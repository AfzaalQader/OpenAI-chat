# OpenAI-chat

A learning monorepo: a **Django REST API backend** that talks to the OpenAI API,
and a **React (Vite) frontend** that consumes it. Both live in one repository so
they can later be composed together with Docker.

```
OpenAI-chat/
├── backend/      # Django + DRF API (Python, PostgreSQL)
└── frontend/     # Vite + React chat UI
```

## Stack

**Backend**
- Django 6 + Django REST Framework
- PostgreSQL (via `psycopg`)
- `openai` (official Python client)
- `django-cors-headers`, `python-dotenv`

**Frontend**
- Vite + React
- Plain `fetch` for API calls

---

## 1. Backend setup

```bash
cd backend
source venv/bin/activate           # virtualenv already created
pip install -r requirements.txt    # (already installed once)

# Configure environment
cp .env.example .env
# edit .env: set OPENAI_API_KEY and your POSTGRES_* values
```

Create the PostgreSQL database (once), e.g.:

```bash
createdb openai_chat
```

Then migrate and run:

```bash
python manage.py migrate
python manage.py runserver        # http://127.0.0.1:8000
```

### API endpoints

| Method | Path                        | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/api/health/`              | Health check                       |
| POST   | `/api/chat/`                | Send a message, get a reply        |
| GET    | `/api/conversations/`       | List conversations                 |
| GET    | `/api/conversations/{id}/`  | Get one conversation with messages |

```bash
curl -X POST http://127.0.0.1:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, who are you?"}'
```

---

## 2. Frontend setup

```bash
cd frontend
npm install            # (already installed once)
npm run dev            # http://localhost:5173
```

The frontend calls `http://127.0.0.1:8000/api` by default. To point it
elsewhere, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.

CORS for `localhost:5173` (Vite) and `localhost:3000` (CRA) is already allowed
in the backend; add more origins via `CORS_ALLOWED_ORIGINS` in `backend/.env`.

---

## Notes for production / Docker

- Set `DJANGO_DEBUG=False` and a strong `DJANGO_SECRET_KEY`.
- Fill in `DJANGO_ALLOWED_HOSTS`.
- Point `POSTGRES_HOST` at your database container/host.
- Build the frontend with `npm run build` (outputs `frontend/dist/`).
- Never commit `.env` files (they're git-ignored).
