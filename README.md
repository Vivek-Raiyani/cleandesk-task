## Setup

### Without Docker (local dev)

**Backend**
```bash
cd backend
pip install -r requirements.txt
python seed_users.py   # sets up tables + seed data
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
bun install
bun dev
```

### With Docker

```bash
docker-compose up --build
```

- Backend ? http://localhost:8000
- Frontend ? http://localhost:3000
- API docs ? http://localhost:8000/api/openapi.json

### Env

Copy `backend/.env.example` to `backend/.env` and fill in your `DATABASE_URL`:

```
DATABASE_URL=postgresql+psycopg2://<user>:<pass>@<host>/<db>?sslmode=require
```

---

## AI Caching

The `/api/ai/optimize-task` endpoint uses a simple DB-backed cache so we don't hammer the AI for the same prompt repeatedly.

**How it works:**
1. Incoming prompt gets SHA-256 hashed
2. We check `AICacheLog` table for an existing entry with that hash
3. If found and less than 30 minutes old, return the cached response
4. If found but expired, call AI again, update the cached entry
5. If not found at all, call AI, create a new cache entry

The cache TTL is hardcoded to 30 minutes in `backend/routes/ai.py`.
