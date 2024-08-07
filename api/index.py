from openai import OpenAI
from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)
openAIClient = OpenAI()


@app.route('/')
def home():
    return render_template("index.html")


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


SAVE_DIR = 'saved_jsons'
os.makedirs(SAVE_DIR, exist_ok=True)


@app.route('/save', methods=['POST'])
def save_json():
    file = request.get_json()

    if not file or 'title' not in file:
        return jsonify({"error": "Invalid JSON data or missing title"}), 400

    filename = file['title'] + ".json"
    file_path = os.path.join(SAVE_DIR, filename)
    with open(file_path, 'w') as json_file:
        json.dump(file, json_file, indent=4)

    return jsonify({"message": "JSON data saved successfully", "filename": filename}), 200


@app.route('/open/<filename>')
def open_json(filename):
    file_path = os.path.join(SAVE_DIR, filename)

    if os.path.exists(file_path):
        with open(file_path, "r") as json_file:
            data = json.load(json_file)
        return jsonify(data), 200
    else:
        return jsonify({"error": "File not found"}), 404


@app.route('/list-jsons')
def list_jsons():
    json_list = os.listdir(SAVE_DIR)
    return jsonify(json_list)


@app.route('/delete/<filename>')
def delete_json(filename):
    file_path = os.path.join(SAVE_DIR, filename)

    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": f"File {filename} deleted successfully"}), 200
    else:
        return jsonify({"error": "File not found"}), 404


@app.route('/chat')
def select_chat_completion():
    prompt = request.args.get('prompt')
    messages = json.loads(prompt)
    completion = openAIClient.chat.completions.create(
        model="gpt-3.5-turbo",
        response_format={"type": "json_object"},
        messages=messages
    )
    return completion.choices[0].message.content


@app.route('/test')
def test():
    return render_template("test.html")


if __name__ == '__main__':
    app.run(debug=True)
