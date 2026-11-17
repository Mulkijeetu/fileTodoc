# Student file reader

Upload a PDF or image of a student form. NestJS sends that file to Claude, then saves `studentName`, `address`, `course`, `section`, and `grade` in MySQL. React only uploads the file and shows the saved rows.

## Where Claude is used

Claude is called in one place: `backend/src/claude/claude.service.ts`.

1. React posts the file to `POST /api/students/upload`.
2. NestJS sends the file bytes to `https://api.anthropic.com/v1/messages`.
3. Claude returns JSON for the five fields.
4. NestJS inserts that JSON into the `students` table.
5. React loads rows from `GET /api/students`.

The browser never calls Claude, and the API key stays in `backend/.env`.

You do not need a key to install the project. Until `ANTHROPIC_API_KEY` is set, an upload returns an error and nothing is saved. Create a key at [platform.claude.com/settings/keys](https://platform.claude.com/settings/keys), add billing credits there, paste the key into `backend/.env`, and restart the API.

`CLAUDE_MODEL` defaults to `claude-sonnet-5-5`. For cheaper extraction of clean forms, set `claude-haiku-5-5`.

## Run

```bash
docker compose up -d
npm install --prefix backend
npm install --prefix frontend
npm run dev:api
npm run dev:web
```

Open http://localhost:5173.

MySQL defaults in `backend/.env` match `docker-compose.yml` (`filetodoc` / `filetodoc`, database `filetodoc`). The API creates the `students` table on startup while `DB_SYNC=true`.
