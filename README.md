# AI Study Material Generator

A simple full-stack web app for generating study material based on a user's profile and selected topic.

## Features

- User signup and login
- Profile setup based on education level
- Dashboard with recommended topics
- Practice section with topic progress
- Material page with notes, references, videos, quiz, and chat helper
- Detailed notes page for long-form study content

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MySQL

## Project Structure

- `public/` - frontend pages, styles, and scripts
- `server.js` - backend routes and API logic
- `db.js` - MySQL connection
- `schema.sql` - database schema

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
PORT=3002
JWT_SECRET=your_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_study_db
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5-mini
```

3. Create the database and tables using `schema.sql`.

4. Start the server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3002
```

## Notes

- If the OpenAI API quota is not active, the app falls back to built-in sample content.
- Some figure/image sections use public Wikipedia or Wikimedia sources.
