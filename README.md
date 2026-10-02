# Task register — CEMOSA technical test

A todo application built with **FastAPI** and **React + TypeScript (Vite)**, designed as a
quality-control sheet on drafting paper, in line with CEMOSA's work in engineering and quality
control. It covers every task in [`INSTRUCTIONS.md`](INSTRUCTIONS.md), with a bilingual interface
(Spanish / English) and automated tests on both sides.

<p align="center">
  <img src="docs/screenshots/desktop-es.png" alt="Desktop view in Spanish: title block with progress ring, favourites section and task list" width="68%">
  &nbsp;
  <img src="docs/screenshots/mobile-en.png" alt="Mobile view in English" width="24%">
</p>

## Features

| Task in the brief | Implementation |
|---|---|
| 1. Completion status saved in the backend | `PATCH /todos/{id}`; the checkbox updates instantly and rolls back if saving fails |
| 2. Delete tasks | `DELETE /todos/{id}`; trash button with an inline two-step confirmation that is safe against accidental double clicks |
| 3. Auto-load tasks | The list loads on page open and reloads after every add, delete, completion or favourite change |
| 4. Descriptions and favourites | Optional description (up to 500 characters) and a star toggle; favourites are shown in their own section, without duplicates |
| 5. README | This file |

Beyond the brief:

- **Spanish / English** interface with a flag language switcher; the choice is remembered.
- **Robust storage**: thread-safe JSON repository with atomic writes, automatic migration of the
  original data file, and ids that are never reused after a delete.
- **Accessibility**: semantic HTML, keyboard support, visible focus, screen reader announcements,
  WCAG AA contrast and support for the *reduced motion* setting.
- **Tests**: 51 backend tests (pytest) and 45 frontend tests (Vitest + Testing Library).

## Getting started

### Requirements

- **Python 3.11–3.13**. Python 3.14 is not supported yet: the pinned `pydantic-core` has no
  pre-built packages for it.
- **Node.js 20+** and npm.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt   # or requirements.txt to skip the test tools
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Run

```bash
cd frontend
npm run dev
```

This starts both servers. The backend runs from `backend/.venv` automatically, with no need to
activate it.

| | URL |
|---|---|
| Application | http://localhost:5173 |
| API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

The servers can also be started separately: `npm run dev:frontend` and `npm run dev:backend`, or
`python -m uvicorn app.main:app --reload` from `backend/`.

### Configuration

All settings are optional.

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | frontend (`.env.local`, see `.env.example`) | `http://localhost:8000` | Backend base URL |
| `API_PORT` | `npm run dev` / `dev:backend` | `8000` | Backend port |
| `TODO_DATA_FILE` | backend | `backend/app/todos.json` | JSON file where the tasks are stored |
| `TODO_CORS_ORIGINS` | backend | `*` | Allowed origins, comma separated |

## Tests

```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm test          # npm run test:watch while developing
npm run lint
npm run build     # also type-checks the code, including the tests
```

- **Backend tests** go through the HTTP API and the JSON repository. They cover validation, error
  codes, CORS, data migrations and concurrent writes. Each test uses its own temporary data file.
- **Frontend tests** use the whole app as a user would, against an in-memory fake of the API. They
  cover each task of the brief, plus error handling, rollbacks, the delete confirmation and the
  language switcher. The client, the error messages, the language detection and the form also have
  unit tests.

## API

| Method | Path | Body | Responses |
|---|---|---|---|
| `GET` | `/todos` | — | `200` list of todos |
| `POST` | `/todos` | `{ title, description?, completed?, favorite? }` | `201` todo · `422` invalid data |
| `PATCH` | `/todos/{id}` | Any subset of `title`, `description`, `completed`, `favorite` | `200` todo · `404` · `422` |
| `DELETE` | `/todos/{id}` | — | `204` · `404` |

```json
{ "id": 4, "title": "Learn FastAPI", "description": "Routers and validation", "completed": false, "favorite": true }
```

- Titles are trimmed and must be 1–120 characters long. Descriptions are optional, up to 500
  characters, and a blank description is stored as `null`.
- `PATCH` only changes the fields that are sent. An empty body, unknown fields and `null` in a
  required field are rejected; `"description": null` clears the description.
- If the data file is unreadable, the API answers `500` with a clear message instead of crashing.

## Project structure

```
backend/
  app/
    main.py                  # Application factory: settings, CORS, error handlers, routes
    core/                    # Settings (environment variables) and domain errors → HTTP codes
    schemas/todo.py          # Pydantic models: TodoCreate, TodoUpdate (partial), Todo
    repositories/            # TodoRepository interface + JSON implementation
    api/                     # Dependency injection and the /todos router
    todos.json               # Data
  tests/                     # pytest suite
frontend/
  scripts/dev-backend.mjs    # Starts uvicorn from the virtualenv on any OS
  src/
    api/                     # HTTP client (ApiError) and todosApi
    hooks/useTodos.ts        # List state and actions: loading, reloads, rollbacks
    i18n/                    # Language provider, detection and ES/EN dictionaries
    components/
      layout/                # Sheet, header, title block, progress ring
      todo/                  # Form, sections, list, row, favourite and delete controls
      ui/                    # Button, Checkbox, icons, flags, error banner, empty state
    test/                    # Test setup and in-memory fake API
    index.css                # Design tokens (Tailwind v4 @theme) and motion
```

## Design decisions

### Backend

- **Layered architecture with the repository pattern.** Routes depend on the `TodoRepository`
  interface, not on the JSON file. Moving to SQLite or PostgreSQL means adding one class, without
  touching the routes or the schemas.
- **Safe JSON storage.** Each read-modify-write runs under a lock, because FastAPI runs sync
  endpoints in a thread pool. Writes go to a temporary file that then replaces the original, so an
  interrupted write cannot corrupt the data.
- **Ids are never reused.** The file stores a `next_id` counter, so a stale client acting on a
  deleted task gets a `404` instead of changing a newer one.
- **Backwards compatible.** The original file (a plain list without ids) and records without the
  new fields are migrated automatically the first time they are read.

### Frontend

- **One place for data.** All requests go through `api/client.ts`, and all list state lives in
  `useTodos`. Every action runs through a single helper that reloads the list afterwards, so a new
  action cannot forget to do it.
- **Instant feedback.** Completing, starring and deleting update the screen at once and roll back
  if the request fails. In-flight list requests are cancelled before each action, so stale data
  never overwrites the change on screen.
- **Translations checked by the compiler.** The Spanish dictionary is typed against the English
  one: a missing or unknown key fails the build. Backend messages are never shown raw; errors are
  mapped to translated messages.
- **Visual identity.** The corporate colours are sampled from the CEMOSA logo (blue `#005DB9`, lime
  `#D4E458`, grey `#2F3734`). Details are taken from technical drawings: a blueprint grid, crop
  marks, a title block ("cajetín"), `T-007` reference codes, and a segmented progress ring that
  echoes the logo. Every colour is a design token; there are no loose hex values in components.
- **Calm, consistent motion.** A shared timing scale (200 / 320 / 450 ms). Rows open and close
  their height so the list never jumps, and everything turns instant when the system asks for
  reduced motion.

## Possible next steps

- A database repository (SQLite/PostgreSQL) selected by configuration.
- Editing a task's title and description in place (the API already supports it).
- Authentication and per-user lists.
- Filtering and searching once lists grow.
- Continuous integration running the test suites on every pull request.
