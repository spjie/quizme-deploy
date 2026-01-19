from openai import OpenAI
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from supabase import create_client, Client
from functools import wraps
from urllib.parse import unquote
import json
import os

app = Flask(__name__)

# Enable CORS for Next.js frontend
CORS(app, origins=[
    'http://localhost:3001',
    'http://localhost:3000',
    'https://*.vercel.app',
], supports_credentials=True)

# Initialize clients safely
try:
    openAIClient = OpenAI()
except Exception as e:
    print(f"Warning: OpenAI client initialization failed: {e}")
    openAIClient = None

# Supabase client initialization
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

# Use service role key for backend operations (bypasses RLS)
supabase: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"Warning: Supabase client initialization failed: {e}")


# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split(' ')[1]
        try:
            user = supabase.auth.get_user(token)
            g.user = user.user
            g.token = token
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return decorated_function


# ============ API Health Check ============

@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok"}), 200


# ============ Auth Routes ============

@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        return jsonify({
            "message": "Signup successful",
            "user": {"id": str(response.user.id), "email": response.user.email} if response.user else None,
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            } if response.session else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return jsonify({
            "message": "Login successful",
            "user": {"id": str(response.user.id), "email": response.user.email},
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    try:
        supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    return jsonify({
        "user": {
            "id": str(g.user.id),
            "email": g.user.email
        }
    }), 200


# ============ Data Routes ============

@app.route('/save', methods=['POST'])
@require_auth
def save_json():
    """Save a study set to Supabase database"""
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({"error": "Invalid JSON data or missing title"}), 400

    user_id = str(g.user.id)
    set_type_raw = data.get('type', 'flashcards').lower()
    # Map to database expected values (capitalized)
    set_type_db = 'Flashcards' if set_type_raw == 'flashcards' else 'Quiz'

    try:
        # Insert study set
        study_set_data = {
            "user_id": user_id,
            "title": data['title'],
            "description": data.get('description', ''),
            "type": set_type_db,
            "quantity": data.get('quantity', len(data.get('questions', [])))
        }

        result = supabase.table('study_sets').insert(study_set_data).execute()
        study_set_id = result.data[0]['id']

        # Insert questions based on type
        questions = data.get('questions', [])
        if set_type_raw == 'flashcards':
            for idx, q in enumerate(questions):
                supabase.table('flashcard_questions').insert({
                    "study_set_id": study_set_id,
                    "question": q['question'],
                    "answer": q['answer'],
                    "position": idx
                }).execute()
        else:  # Quiz
            for idx, q in enumerate(questions):
                supabase.table('quiz_questions').insert({
                    "study_set_id": study_set_id,
                    "question": q['question'],
                    "correct_answer": q['correct_answer'],
                    "wrong_answers": q.get('incorrect_answers', q.get('wrong_answers', [])),
                    "position": idx
                }).execute()

        return jsonify({
            "message": "Study set saved successfully",
            "id": study_set_id,
            "filename": data['title'] + ".json"
        }), 200

    except Exception as e:
        print(f"Save error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/open/<identifier>')
@require_auth
def open_json(identifier):
    """Open a study set by ID or title"""
    user_id = str(g.user.id)

    try:
        # URL decode and remove .json extension
        title = unquote(identifier).replace('.json', '')

        result = supabase.table('study_sets').select('*').eq('user_id', user_id).eq('title', title).execute()

        if not result.data:
            return jsonify({"error": "Study set not found"}), 404

        study_set = result.data[0]

        # Try to fetch flashcard questions first
        fc_questions = supabase.table('flashcard_questions').select('*').eq('study_set_id', study_set['id']).order('position').execute()

        # If flashcard questions exist, this is a flashcard set
        if fc_questions.data:
            actual_type = 'flashcards'
            questions = [{"question": q['question'], "answer": q['answer']} for q in fc_questions.data]
        else:
            # Otherwise, try quiz questions
            qz_questions = supabase.table('quiz_questions').select('*').eq('study_set_id', study_set['id']).order('position').execute()
            actual_type = 'quiz'
            questions = [{"question": q['question'], "correct_answer": q['correct_answer'], "incorrect_answers": q['wrong_answers']} for q in qz_questions.data]

        return jsonify({
            "id": study_set['id'],
            "type": actual_type,
            "title": study_set['title'],
            "description": study_set['description'],
            "quantity": study_set['quantity'],
            "questions": questions
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/list-jsons')
@require_auth
def list_jsons():
    """List all study sets for the current user"""
    user_id = str(g.user.id)

    try:
        result = supabase.table('study_sets').select('id, title, description, type').eq('user_id', user_id).order('created_at', desc=True).execute()

        files = []
        for item in result.data:
            # Detect actual type based on which table has questions
            actual_type = item['type']

            # Check if flashcard_questions exist for this set
            fc_check = supabase.table('flashcard_questions').select('id').eq('study_set_id', item['id']).limit(1).execute()
            qz_check = supabase.table('quiz_questions').select('id').eq('study_set_id', item['id']).limit(1).execute()

            if fc_check.data and not qz_check.data:
                actual_type = 'flashcards'
            elif qz_check.data and not fc_check.data:
                actual_type = 'quiz'

            files.append({
                "title": item['title'],
                "description": item.get('description', ''),
                "type": actual_type
            })

        return jsonify({"files": files}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/delete/<identifier>')
@require_auth
def delete_json(identifier):
    """Delete a study set by title"""
    user_id = str(g.user.id)
    title = unquote(identifier).replace('.json', '')

    try:
        # Delete by title (cascades to questions due to foreign key)
        result = supabase.table('study_sets').delete().eq('user_id', user_id).eq('title', title).execute()

        if result.data:
            return jsonify({"message": f"Study set '{title}' deleted successfully"}), 200
        else:
            return jsonify({"error": "Study set not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/chat')
@require_auth
def select_chat_completion():
    """Generate AI content using OpenAI"""
    prompt = request.args.get('prompt')

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    if not openAIClient:
        return jsonify({"error": "OpenAI client not initialized"}), 500

    try:
        # Parse prompt as JSON if it looks like a message array, otherwise create one
        try:
            messages = json.loads(prompt)
        except json.JSONDecodeError:
            # If it's a plain text prompt, wrap it in a message format
            messages = [{"role": "user", "content": prompt}]

        completion = openAIClient.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=messages
        )

        return jsonify({
            "response": completion.choices[0].message.content
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=3000)
