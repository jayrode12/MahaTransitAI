# 🧠 MahaTransit AI — Permanent Rules, System Architecture & Integration Memory (`brain.md`)

> **MANDATORY INSTRUCTION**: This file contains permanent rules, system architecture, and operational memory for the **MahaTransit** project.
> Read and follow this file completely before planning or starting ANY task in this project.

---

## 📌 PROJECT CONTEXT & PRIME DIRECTIVE

The frontend and backend of this project are both already built and working separately:
- **Backend**: FastAPI REST API with SQLAlchemy, PostgreSQL (Supabase), pgvector, and AI pipelines (Whisper, MarianMT, Sentence Transformers, XGBoost).
- **User Site Frontend**: React 19 + Vite + Tailwind CSS Citizen Web Application.
- **Admin Site Frontend**: React 19 + Vite + Tailwind CSS Official & Admin Web Application.

**PRIMARY GOAL**: Connect the frontends to the backend so they work together seamlessly as one cohesive system.
**RESTRICTION**: Do **NOT** rebuild or rewrite either side. Only add or change what is required to integrate them.

---

## 1. UNDERSTAND BEFORE CODING

1. **Inspect Both Sides First**: Before writing any code, examine relevant files, directory layout, dependencies, and schemas in both the frontend and backend.
2. **Learn Existing Patterns**:
   - **Backend**: Layered 3-tier pattern (`Router` ➡️ `Service` ➡️ `Model/Schema`), Pydantic validation DTOs, dependency-injected auth guards (`deps.py`), SQLAlchemy ORM session lifecycle.
   - **Frontend**: Functional components, hook-based state management, inline styling + Tailwind CSS, navigation via top-level state routing (`page` state in `App.jsx`).
3. **Reuse Existing Code**: Always reuse existing utilities, components, helper functions, and services. Never write redundant duplicate helpers.
4. **Clarify Ambiguities**: If any user requirement or interface contract is unclear, ask before guessing or assuming.

---

## 2. Code Quality Rules (Strict)
- **Only What Is Needed**: Write only the code required to solve the task. No extra, unwanted, or illogical code.
- **Zero Dead Code**: No unused imports, unused variables, leftover debug logs, or commented-out code.
- **No Speculative Code**: No duplicate logic and no speculative "just in case" features.
- **Consistent Style**: Follow the existing project style. Do not add new dependencies unless strictly necessary.

---

## 3. Performance Rules

### General Performance
- All code must be fast, optimized, and efficient.
- Pick the best algorithm and data structure, and state time and space complexity for non-trivial logic.
- Avoid unnecessary loops, repeated computation, and redundant network, database, or disk calls.
- Apply caching, batching, lazy loading, and async processing only where they provide real, measurable benefits.

### Stack-Specific Performance Rules

#### Backend (FastAPI, SQLAlchemy, Supabase, AI Models)
- **FastAPI Concurrency**: Keep route handlers using synchronous SQLAlchemy sessions as `def` (not `async def`) so FastAPI manages them in threadpools without blocking the asyncio event loop.
- **SQLAlchemy Queries**:
  - Eliminate N+1 queries: use `.options(joinedload(...))` or `.options(selectinload(...))` when fetching complaints with their attachments, remarks, or AI results.
  - Paginate all list queries with `limit` and `offset` (`skip`), applying a strict upper bound (`le=100`).
  - Use database indexes on foreign keys (`citizen_id`, `department_id`, `status`, `created_at`).
- **pgvector Optimization**:
  - Utilize the HNSW cosine index (`idx_complaints_embedding`) with `vector_cosine_ops`.
  - Always bound vector queries with distance filters (`dist_expr <= max_dist`) and tight limits.
- **AI Model Lifecycle**:
  - Keep Whisper, MarianMT, SentenceTransformer, and XGBoost models loaded as singletons in memory. Never re-instantiate or reload model weights per request.
  - Process heavy AI tasks (STT, translation, vectorization) asynchronously or in background pipelines.

#### Frontend (React 19, Vite, Tailwind CSS)
- **Render Optimization**:
  - Prevent unnecessary component re-renders: memoize heavy components, gauge calculations, and derived statistics.
  - Use stable unique keys (`ticket_number` or database `id`, never array indices) for list items.
- **Network & Request Throttling**:
  - Debounce search and filter inputs (300ms) before triggering API calls to `/api/v1/complaints`.
  - Abort in-flight requests using `AbortController` when query parameters change or components unmount.
  - Deduplicate and cache static reference data (departments, categories, transit routes).
- **Bundle Hygiene**:
  - Keep bundle sizes small by avoiding duplicate packages and tree-shaking icon/utility imports.

---

## 4. FRONTEND-BACKEND INTEGRATION RULES

1. **Audit First (Integration Map)**: Never change code before mapping endpoints, payload contracts, and frontend consumers.
2. **Backend is Single Source of Truth**:
   - Adapt frontend state and forms to the backend API contract.
   - Do not modify backend endpoints unless there is an explicit bug or missing capability, and notify the user before modifying.
3. **Centralized API Client Layer**:
   - Create exactly **one** unified API service client in each frontend (`src/services/api.js` or `src/api/client.js`).
   - Configure base URL from environment variables (`import.meta.env.VITE_API_BASE_URL`).
   - Centralize request/response interceptors, auth token injection, standard error handling, and timeout policies.
   - **Strictly prohibit scattered `fetch()` or `axios` calls inside UI components.**
4. **Environment Variables**:
   - Store API URLs and credentials in `.env` files (`.env.local` / `.env.example`). Never hardcode hosts or ports.
5. **CORS Governance**:
   - Configure backend `BACKEND_CORS_ORIGINS` precisely to permit frontend dev ports (e.g. `http://localhost:5173`, `http://localhost:8443`, `http://127.0.0.1:8443`, etc.).
6. **End-to-End Authentication Lifecycle**:
   - Persist auth tokens/session securely in browser storage (`localStorage` / `sessionStorage`).
   - Automatically inject `Authorization: Bearer <token>` (or `X-User-Id: <uuid>`) into authenticated API requests.
   - Gracefully handle 401 Unauthorized responses by clearing stored credentials and redirecting to the login screen.
   - Maintain route protection guards matching user roles (`citizen`, `complaint_officer`, `department_admin`, `super_admin`).
7. **Single Data Transformation Layer**:
   - Bridge discrepancies between backend schema names (e.g. `transit_mode`, `ticket_number`, `description_original`) and frontend display keys (e.g. `transport`, `id`, `desc`) within dedicated mapper functions inside the API service layer.
8. **UI State Completeness**:
   - Every API call must explicitly manage and display: **Loading state**, **Empty state**, and **Error state** (with human-readable feedback).
9. **Incremental Verification**:
   - Connect and test one feature at a time (e.g. Auth ➡️ Complaints Listing ➡️ Complaint Submission ➡️ AI Insights).
   - Provide exact CLI run commands and testing steps for each connected feature.

---

## 5. FINAL CHECKLIST BEFORE EVERY RESPONSE

- [ ] Solves exactly what was requested — no extra or unrelated code.
- [ ] Handles edge cases gracefully without code bloat.
- [ ] Free of dead code, unused imports, or leftover debug logs.
- [ ] Strictly adheres to existing codebase architectural patterns and naming.
- [ ] Payload shapes, headers, status codes, and error formats match between frontend and backend.
- [ ] Adheres to the fastest, most performant approach.

---

## 6. RESPONSE OUTPUT FORMAT

- **Brief approach**: 2–3 concise sentences explaining the integration step.
- **Code modifications**: Exact changed or new code blocks accompanied by absolute file paths.
- **Verification & commands**: Clear execution commands to run and test the changes.
- **Performance & assumptions**: Brief notes if applicable. No conversational filler.

---

## 6. Project Overview

### 6.1 Tech Stack & Directory Structure
```
c:\Users\yvpaw\OneDrive\Desktop\Mahatransit/
├── Backend/                     # FastAPI Backend Server (Port: 8000)
│   ├── app/
│   │   ├── api/                 # API Routes (/auth, /citizens, /admins, /complaints, /notifications, /ai)
│   │   ├── core/                # Config & Supabase Client (config.py, supabase.py)
│   │   ├── db/                  # Database Session & Base (session.py, base.py)
│   │   ├── models/              # SQLAlchemy Models (Citizen, Admin, Complaint, Remark, Attachment, etc.)
│   │   ├── schemas/             # Pydantic Schemas / DTOs
│   │   ├── services/            # Business Logic Layer & AI Subsystems
│   │   │   ├── ai/              # Whisper STT, MarianMT Translation, pgvector Duplicate Detection, XGBoost
│   │   └── supabase/            # Canonical Database DDL (supabase_schema.sql)
│   ├── models/                  # Trained Model Weights (priority_xgb_model.joblib)
│   ├── requirements.txt         # Python Dependencies
│   └── .env.example             # Backend Environment Template
│
├── User Site/                   # Citizen React App (Port: 8443 or 5173)
│   ├── src/
│   │   ├── components/          # AppLayout, Header, Sidebar, ActionStatusStepper
│   │   ├── pages/               # Landing, Login, Register, Dashboard, NewComplaint, History, ComplaintDetails
│   │   ├── data/                # Mock Complaints (complaints.js) — TO BE REPLACED WITH API
│   │   ├── imports/             # Static Assets & Cityscape Illustrations
│   │   ├── App.jsx              # Main Route & State Coordinator
│   │   └── main.jsx             # React 19 Entrypoint
│   ├── package.json             # Vite + React 19 + Tailwind CSS
│   └── vite.config.js           # Server port config (default: process.env.PORT || 8443)
│
└── Admin Site/                  # Official & Admin React App (Port: 8443 or 5174)
    ├── src/
    │   ├── components/          # Sidebar, Topbar, MumbaiCityscape
    │   ├── pages/               # LandingPage, LoginPage, Dashboard, Complaints, ComplaintHistory, ComplaintDetails
    │   ├── App.jsx              # Main Admin Coordinator & Auth Guards
    │   └── main.jsx             # React 19 Entrypoint
    ├── package.json             # Vite + React 19 + Tailwind CSS + Recharts
    └── vite.config.js           # Server port config (default: process.env.PORT || 8443)
```

### 7.2 Network Ports & Default Execution Commands
| Service | Technology | Default Port | Start Command |
|---|---|---|---|
| **Backend** | FastAPI / Uvicorn | `8000` | `uvicorn app.main:app --reload --port 8000` (inside `Backend/`) |
| **User Site** | Vite / React 19 | `8443` (or `5173`) | `npm run dev` or `PORT=5173 npm run dev` (inside `User Site/`) |
| **Admin Site** | Vite / React 19 | `8443` (or `5174`) | `PORT=5174 npm run dev` (inside `Admin Site/`) |

### 7.3 Database & Auth Stack
- **Database Engine**: PostgreSQL on Supabase + `pgvector` extension.
- **ORM**: SQLAlchemy 2.0 with connection pooling.
- **Authentication**: Supabase Auth (`auth.users`), validated on backend via Bearer token (`supabase_client.auth.get_user(token)`) or direct `X-User-Id` header.
- **File & Media Storage**: Supabase Storage Buckets (`attachments`, `voice-files`, `profile-images`).

---

## 8. INTEGRATION MAP

The table below catalogs all backend API endpoints, their contracts, corresponding frontend views, and current integration statuses.

| # | HTTP Method | Endpoint Path | Access / Auth | Request Body / Query | Response Shape | Frontend Target Component | Status |
|---|---|---|---|---|---|---|---|
| **1** | `POST` | `/api/v1/auth/login` | Public | `LoginRequest` (`email`, `password`, `user_type`) | `AuthResponse` (`user_id`, `role`, `full_name`, `email`, etc.) | `User Site: Login.jsx`<br>`Admin Site: LoginPage.jsx` | 🟡 Pending |
| **2** | `POST` | `/api/v1/auth/logout` | Authenticated | None | `MessageResponse` (`message`) | `User Site: Header.jsx`<br>`Admin Site: Topbar.jsx` | 🟡 Pending |
| **3** | `POST` | `/api/v1/citizens/register` | Public | `CitizenRegister` (`full_name`, `email`, `phone`, `password`, `preferred_language`) | `CitizenProfileResponse` (201) | `User Site: Register.jsx` | 🟡 Pending |
| **4** | `GET` | `/api/v1/citizens/profile` | Citizen Auth | None | `CitizenProfileResponse` (200) | `User Site: Dashboard.jsx`, `Header.jsx` | 🟡 Pending |
| **5** | `PUT` | `/api/v1/citizens/profile` | Citizen Auth | `CitizenProfileUpdate` (`full_name`, `phone`, `preferred_language`) | `CitizenProfileResponse` (200) | `User Site: Profile Settings` (if added) | 🟡 Pending |
| **6** | `GET` | `/api/v1/admins/profile` | Admin Auth | None | `AdminProfileResponse` (200) (`department_id`, `role`, `full_name`) | `Admin Site: Dashboard.jsx`, `Topbar.jsx` | 🟡 Pending |
| **7** | `POST` | `/api/v1/admins/officers` | Super / Dept Admin | `AdminOfficerCreate` (`department_id`, `role`, `full_name`, `email`, `phone`, `password`) | `AdminProfileResponse` (201) | `Admin Site: Officer Management` | 🟡 Pending |
| **8** | `GET` | `/api/v1/admins/officers` | Super / Dept Admin | Query `?department_id=UUID` | `List[AdminProfileResponse]` (200) | `Admin Site: Officer Directory` | 🟡 Pending |
| **9** | `POST` | `/api/v1/complaints` | Public / Citizen | `ComplaintCreate` (`title`, `description_original`, `transit_mode`, `form_data`, `attachments`) | `ComplaintResponse` (201) (`ticket_number`, `status`, `priority`) | `User Site: NewComplaint.jsx` | 🟡 Pending |
| **10** | `GET` | `/api/v1/complaints` | Public / Official | Query (`page`, `limit`, `status`, `priority`, `transit_mode`, `department_id`, `citizen_id`, `search`) | `ComplaintListResponse` (200) (`items`, `total`, `page`, `pages`) | `User Site: Dashboard.jsx`, `History.jsx`<br>`Admin Site: Dashboard.jsx`, `Complaints.jsx`, `ComplaintHistory.jsx` | 🟡 Pending |
| **11** | `GET` | `/api/v1/complaints/track/{ticket_number}` | Public | Path `ticket_number` | `ComplaintResponse` (200) | `User Site: Landing.jsx` (Track Form), `ComplaintDetails.jsx` | 🟡 Pending |
| **12** | `GET` | `/api/v1/complaints/{id}` | Public / Official | Path `complaint_id` | `ComplaintResponse` (200) (full timeline, attachments, AI data) | `User Site: ComplaintDetails.jsx`<br>`Admin Site: ComplaintDetails.jsx` | 🟡 Pending |
| **13** | `PATCH` | `/api/v1/complaints/{id}` | Official Auth | `ComplaintUpdate` (`status`, `priority`, `remarks`, `updated_by`) | `ComplaintResponse` (200) | `Admin Site: ComplaintDetails.jsx` (Status update actions) | 🟡 Pending |
| **14** | `POST` | `/api/v1/complaints/{id}/remarks` | Official Auth | `ComplaintRemarkCreate` (`status`, `remarks`, `updated_by`) | `ComplaintRemarkResponse` (201) | `Admin Site: ComplaintDetails.jsx` (Add official note) | 🟡 Pending |
| **15** | `POST` | `/api/v1/complaints/{id}/attachments` | Public / Citizen | `ComplaintAttachmentCreate` (`attachment_type`, `file_name`, `file_url`, `mime_type`, `file_size`) | `ComplaintAttachmentResponse` (201) | `User Site: NewComplaint.jsx`, `ComplaintDetails.jsx` | 🟡 Pending |
| **16** | `DELETE` | `/api/v1/complaints/{id}` | Official Auth | Path `complaint_id` | `{"message": "...", "id": "..."}` | `Admin Site: Complaints.jsx` | 🟡 Pending |
| **17** | `GET` | `/api/v1/notifications` | Authenticated | Query `?unread_only=bool&page=int&limit=int` | `NotificationListResponse` (200) (`items`, `total`, `unread_count`) | `User Site: Header.jsx`<br>`Admin Site: Topbar.jsx` | 🟡 Pending |
| **18** | `POST` | `/api/v1/notifications` | Authenticated | `NotificationCreate` (`user_id`, `user_type`, `title`, `message`, `type`, `complaint_id`) | `NotificationResponse` (201) | System / Triggered on status change | 🟡 Pending |
| **19** | `PATCH` | `/api/v1/notifications/{id}/read` | Authenticated | Path `notification_id` | `NotificationResponse` (200) | Notification Popover / Dropdown | 🟡 Pending |
| **20** | `PATCH` | `/api/v1/notifications/read-all` | Authenticated | None | `{"message": "...", "updated_count": int}` | Notification Popover / Dropdown | 🟡 Pending |
| **21** | `POST` | `/api/v1/ai/speech-to-text` | Public | `SpeechToTextRequest` (`complaint_id`, `audio_url`, `language`) | `SpeechToTextResponse` (`speech_text`, `language`, `status`) | `User Site: NewComplaint.jsx` (Voice note transcription) | 🟡 Pending |
| **22** | `POST` | `/api/v1/ai/translate` | Public | `TranslationRequest` (`complaint_id`, `text`, `source_language`) | `TranslationResponse` (`original_text`, `translated_text`) | `User Site: NewComplaint.jsx`<br>`Admin Site: ComplaintDetails.jsx` | 🟡 Pending |
| **23** | `POST` | `/api/v1/ai/detect-duplicate` | Public | `DuplicateDetectionRequest` (`complaint_id`, `text`, `similarity_threshold`) | `DuplicateDetectionResponse` (`has_duplicates`, `duplicates`) | `Admin Site: ComplaintDetails.jsx` (Duplicate cluster list) | 🟡 Pending |
| **24** | `POST` | `/api/v1/ai/predict-priority` | Public | `PriorityPredictionRequest` (`complaint_id`, `text`, `transit_mode`) | `PriorityPredictionResponse` (`predicted_priority`, `priority_confidence`) | `Admin Site: ComplaintDetails.jsx` (Priority Gauge display) | 🟡 Pending |
| **25** | `POST` | `/api/v1/ai/pipeline` | Public | `FullPipelineRequest` (`complaint_id`) | `FullPipelineResponse` (STT + Translation + Duplicates + Priority) | Automated backend ingestion after ticket creation | 🟡 Pending |

*Status Legend:*
- 🟢 **Connected**: Integrated with live backend, data contracts validated, tested and working.
- 🟡 **Pending**: Frontend currently relies on mock data or stub functions; endpoint exists on backend ready for integration.
- 🔴 **Broken**: Connection attempted but failing due to contract mismatch, CORS, network errors, or auth failures.

---

## 9. LEARNED PATTERNS & CRITICAL INTEGRATION GOTCHAS

1. **Port Collisions**:
   - Both `User Site` and `Admin Site` have `port: parseInt(process.env.PORT || '8443')` in their `vite.config.js`. Running both simultaneously requires specifying distinct ports (e.g. User Site on `5173`, Admin Site on `5174`, Backend on `8000`).
2. **CORS Allowlist Requirement**:
   - `Backend/app/core/config.py` defines `BACKEND_CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]`.
   - When User Site and Admin Site run on their default or alternate ports, the backend CORS origins must explicitly include all active frontend hostnames and ports.
3. **Dual Authentication Support in Backend**:
   - `Backend/app/api/deps.py` supports two auth methods:
     - Standard: `Authorization: Bearer <Supabase-Access-Token>`
     - Development/Direct: `X-User-Id: <UUID>` header
   - The frontend API client should store the logged-in user profile (`user_id`, `role`, `user_type`, token) and attach both headers to guarantee seamless auth handling across local and deployed environments.
4. **Data Contract Differences**:
   - **Ticket ID**: Frontend mocks use `id: "CMP-2024-0051"` or `"MMM-2024-0123"`. The backend generates `ticket_number: "MT-YYYYMMDD-XXXX"`, while the database primary key is a UUID `id`. The frontend mapping layer must handle `ticket_number` for display and `id` for REST routes.
   - **Transit Modes**: Backend strictly accepts enum lowercase `'metro'`, `'bus'`, `'train'`. Frontend UI uses capitalized `'Metro'`, `'Bus'`, `'Railway'`. A mapping layer must normalize these.
   - **Status Enums**: Backend uses `'submitted'`, `'assigned'`, `'accepted'`, `'in_progress'`, `'resolved'`, `'closed'`, `'rejected'`. Frontend displays `'Under Investigation'`, `'Pending'`, `'In Progress'`, `'Resolved'`, `'Closed'`.
5. **No Direct Fetching in React Pages**:
   - All HTTP interactions must flow through a centralized API service layer (`User Site/src/services/api.js` and `Admin Site/src/services/api.js`). Components should only call async service functions (e.g. `api.getComplaints()`, `api.login()`).
