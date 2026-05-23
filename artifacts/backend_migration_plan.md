# Backend Migration Plan: Node.js/Express to Python/FastAPI

This document outlines the step-by-step strategy for migrating the current Node.js (Express) and PostgreSQL backend to a Python (FastAPI) and MySQL stack, while introducing Redis for caching. The React frontend, user flows, and JWT authentication mechanisms will remain entirely unchanged.

## 🏗️ Target Architecture

```mermaid
flowchart TD
    A[React Frontend\n(Unchanged)] -->|REST API over HTTP/JSON| B(FastAPI Backend\nPython)
    B <-->|Session / Cache| C[(Redis)]
    B <-->|Read / Write| D[(MySQL Database)]
```

## 🔄 Technology Mapping

| Component | Current Stack (Node.js) | Target Stack (Python) | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Express.js (v5) | **FastAPI** | FastAPI provides automatic OpenAPI docs and high performance using async Python. |
| **Database** | PostgreSQL | **MySQL** | Shifting relational DB. Requires syntax translation for some specific features. |
| **ORM / Query Builder** | Drizzle ORM | **SQLAlchemy 2.0** | SQLAlchemy is the standard async ORM for Python. |
| **DB Migrations** | Drizzle-kit | **Alembic** | Used in conjunction with SQLAlchemy. |
| **Schema Validation** | Zod | **Pydantic (v2)** | Pydantic is native to FastAPI and replaces Zod/api-spec on the backend. |
| **Authentication** | jsonwebtoken, bcryptjs | **PyJWT, passlib (bcrypt)**| Exact same JWT structure and bcrypt hashing to preserve existing user sessions. |
| **Caching Layer** | *None* | **Redis** | New layer for performance optimization. |

---

## 📋 Implementation Phases

### Phase 1: Foundation & Project Setup
*   **Initialize Python Environment:** Set up a `pyproject.toml` or `requirements.txt` using Poetry or pip.
*   **Install Core Dependencies:** `fastapi`, `uvicorn`, `sqlalchemy`, `aiomysql` (async MySQL driver), `alembic`, `pydantic`, `pyjwt`, `passlib`, `redis.asyncio`.
*   **Establish Directory Structure:** Create a standard FastAPI structure (e.g., `app/api`, `app/models`, `app/schemas`, `app/core/config.py`).
*   **Configure CORS:** Set up FastAPI CORS middleware to accept requests exactly as the Express server did (same origins, headers, methods).

### Phase 2: Database & Schema Migration
*   **Translate Schemas:** Convert the existing TypeScript Drizzle schemas (`lib/db/src/schema/*`) to SQLAlchemy declarative models.
*   **Generate Migrations:** Use Alembic to generate the initial MySQL schema based on the SQLAlchemy models.
*   **Data Migration (If Needed):** If there is existing data in PostgreSQL, write a simple ETL script to dump from PG and load into MySQL, taking care to cast Postgres-specific types to MySQL equivalents (e.g., `TIMESTAMP WITH TIME ZONE` to `DATETIME`).

### Phase 3: Pydantic Validation & Contracts
*   **Replicate API Contracts:** Look at the current Zod schemas in `@workspace/api-zod` and recreate them identically as Pydantic models.
*   **Ensure Exact Matching:** The JSON structure expected by the frontend MUST match the Pydantic models exactly. Any difference will break the React app.

### Phase 4: Authentication & JWT
*   **Implement Hashing:** Use `passlib.context` with bcrypt. Verify that passwords hashed by Node.js `bcryptjs` can be successfully verified by Python `passlib` (they are compatible as long as rounds and algorithms match).
*   **Implement JWT:** Create a FastAPI dependency (`Depends()`) to extract the JWT from the authorization header or cookie, verify it using `PyJWT` with the exact same secret key as the old server, and inject the current user into route handlers.

### Phase 5: API Endpoint Porting
*   **Rewrite Routes:** Go through each Express route in `artifacts/api-server` and create an equivalent FastAPI route (`@app.get()`, `@app.post()`, etc.).
*   **Business Logic:** Port the business logic line-by-line from TypeScript to Python.
*   **Status Codes:** Ensure that HTTP status codes (200, 201, 400, 401, 404, 500) match the original Express implementation perfectly so the frontend error handling (`react-query` and `sonner`) behaves as expected.

### Phase 6: Redis Integration
*   **Identify Cacheable Data:** Look for high-read/low-write endpoints (e.g., fetching generic configurations, user profiles, or dashboard statistics).
*   **Implement Caching Logic:** Use `redis.asyncio` to cache the serialized Pydantic responses.
*   **Cache Invalidation:** Ensure that mutations (POST, PUT, DELETE) clear or update the relevant Redis keys.

### Phase 7: Testing & Cutover
*   **Point Frontend to New API:** Change the API base URL in the React frontend (`workspace-app`) or the local proxy configuration in Vite to point to the FastAPI server (e.g., `http://localhost:8000`).
*   **End-to-End Testing:** Perform full regression testing of the UI without changing any React code.
*   **Deployment:** Containerize the FastAPI application using Docker and deploy alongside MySQL and Redis.

---

## ⚠️ Critical Success Factors
1.  **JSON Contract Integrity:** Do not change field names (e.g., `userId` to `user_id`) in the API responses unless the frontend already expected snake_case. FastAPI aliases can be used if you want snake_case in Python but camelCase in JSON (`Field(alias="userId")`).
2.  **JWT Secret:** Maintain the exact same JWT Secret and algorithm (`HS256` typically) so that existing user tokens don't immediately invalidate during the switch.
3.  **Password Hashes:** Ensure Node.js bcrypt hashes are evaluated correctly by Python's passlib. No re-hashing should be required.
