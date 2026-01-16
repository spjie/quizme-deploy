from openai import OpenAI
from flask import Flask, render_template, request, jsonify, g
from supabase import create_client, Client
from functools import wraps
from urllib.parse import unquote
import json
import os

app = Flask(__name__)

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


# Context processor to inject Supabase config into all templates
@app.context_processor
def inject_supabase_config():
    return {
        'supabase_url': SUPABASE_URL or '',
        'supabase_anon_key': SUPABASE_ANON_KEY or ''
    }


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


# ============ Page Routes ============

@app.route('/')
def home():
    return render_template("index.html")


@app.route('/login')
def login_page():
    return render_template("login.html")


@app.route('/signup')
def signup_page():
    return render_template("signup.html")


@app.route('/terms-preview')
def terms_preview():
    return render_template("terms-preview.html")


@app.route('/select/<type>')
def select(type):
    return render_template("select.html", type=type)


@app.route('/notes/<type>')
def terms_notes(type):
    return render_template("notes.html", type=type)


@app.route('/quiz-preview')
def quiz_preview():
    return render_template("quiz-preview.html")


@app.route('/quiz-select')
def quiz_select():
    return render_template("quiz-select.html")


@app.route('/quiz-notes')
def quiz_notes():
    return render_template("quiz-notes.html")


@app.route('/library/<page>')
def library(page):
    return render_template("library.html", page=page)


@app.route('/study')
def study():
    return render_template("study.html")


@app.route('/learn')
def learn():
    return render_template("learn.html")


@app.route('/terms-quiz')
def terms_quiz():
    return render_template("terms-quiz.html")


@app.route('/quiz')
def quiz():
    return render_template("quiz.html")


@app.route('/edit')
def edit():
    return render_template("edit.html")


@app.route('/test')
def test():
    return render_template("test.html")


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
    set_type = data.get('type', 'Flashcards')

    try:
        # Insert study set
        study_set_data = {
            "user_id": user_id,
            "title": data['title'],
            "description": data.get('description', ''),
            "type": set_type,
            "quantity": data.get('quantity', len(data.get('questions', [])))
        }

        result = supabase.table('study_sets').insert(study_set_data).execute()
        study_set_id = result.data[0]['id']

        # Insert questions based on type
        questions = data.get('questions', [])
        if set_type == 'Flashcards':
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
                    "wrong_answers": q['wrong_answers'],
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
        print(f"DEBUG open_json: identifier={identifier}, title={title}, user_id={user_id}")

        result = supabase.table('study_sets').select('*').eq('user_id', user_id).eq('title', title).execute()
        print(f"DEBUG open_json: result.data={result.data}")

        if not result.data:
            # Also try case-insensitive search for debugging
            all_sets = supabase.table('study_sets').select('title, user_id').eq('user_id', user_id).execute()
            print(f"DEBUG open_json: all user sets={all_sets.data}")
            return jsonify({"error": "Study set not found", "searched_title": title, "user_id": user_id}), 404

        study_set = result.data[0]

        # Fetch questions based on type
        if study_set['type'] == 'Flashcards':
            questions_result = supabase.table('flashcard_questions').select('*').eq('study_set_id', study_set['id']).order('position').execute()
            questions = [{"question": q['question'], "answer": q['answer']} for q in questions_result.data]
        else:
            questions_result = supabase.table('quiz_questions').select('*').eq('study_set_id', study_set['id']).order('position').execute()
            questions = [{"question": q['question'], "correct_answer": q['correct_answer'], "wrong_answers": q['wrong_answers']} for q in questions_result.data]

        return jsonify({
            "id": study_set['id'],
            "type": study_set['type'],
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
        result = supabase.table('study_sets').select('title, type').eq('user_id', user_id).execute()

        # Return as list of filenames for backward compatibility
        filenames = [item['title'] + '.json' for item in result.data]
        return jsonify(filenames), 200

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
    prompt = request.args.get('prompt')
    messages = json.loads(prompt)
    completion = openAIClient.chat.completions.create(
        model="gpt-3.5-turbo",
        response_format={"type": "json_object"},
        messages=messages
    )
    return completion.choices[0].message.content


if __name__ == '__main__':
    app.run(debug=True)
