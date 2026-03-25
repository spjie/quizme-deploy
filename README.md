# ok, quiz me on this

An app that turns your notes into AI-generated flashcards to make studying more efficient through active recall.

## Features
- Paste your notes or select a subject
- Customize difficulty level, Bloom's taxonomy, reasoning depth, and learning mode
- Automatically generate flashcards using AI
- Simple interface for reviewing cards

## Tech Stack
Frontend: Next.js + Tailwind CSS
Backend: Flask API
Database: Supabase (Postgres)
AI: OpenAI API

## Demo
[studywithquizme.vercel.app](https://studywithquizme.vercel.app/)

## How it works
User input -> AI -> Validation -> Study
- **Input**: Provide your notes and select study parameters (difficulty, learning mode, reasoning depth, Bloom’s level).
- **AI**: An AI model transforms your notes into targeted questions.
- **Validation**: Outputs are validated into a consistent JSON schema for reliable formatting and rendering.
- **Study**: Study through an interactive quiz interface designed for active recall.

## Setup
npm install
npm run dev
