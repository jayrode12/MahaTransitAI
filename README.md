# 🚆 MahaTransit AI — Intelligent Public Transport Complaint Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)

**MahaTransit AI** is a state-of-the-art, centralized, AI-powered complaint management and grievance resolution ecosystem designed for Mumbai and Maharashtra's public transit network (BEST Buses, Central & Western Railways, Metro, Auto/Taxis, and MSRTC).

The platform bridges commuters and transport department authorities through dedicated portals, utilizing advanced Natural Language Processing (NLP), Speech-to-Text (STT), multilingual neural translation, semantic vector similarity duplicate detection (`pgvector`), and machine learning-driven priority prediction.

---

## 📑 Table of Contents

- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [AI / ML Capabilities](#-ai--ml-capabilities)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Activation Guide](#-step-by-step-activation-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Database & Supabase Setup](#2-database--supabase-setup)
  - [3. Backend API Activation](#3-backend-api-activation)
  - [4. Citizen Portal Activation (User Site)](#4-citizen-portal-activation-user-site)
  - [5. Official & Admin Portal Activation (Admin Site)](#5-official--admin-portal-activation-admin-site)
  - [6. Standalone AI Microservice (Optional)](#6-standalone-ai-microservice-optional)
- [API Reference](#-api-reference)
- [Environment Variables Guide](#-environment-variables-guide)
- [License & Author](#-license--author)

---

## 📌 Problem Statement

Public transport commuters in metropolitan regions encounter daily challenges across multiple distinct transit providers (railways, buses, metros, autorickshaws). Traditional grievance systems suffer from:
- **Fragmented Portals**: No unified place to file complaints across transit modes.
- **Language Barriers**: Inability for non-English speakers to submit grievances comfortably.
- **Duplicate Overload**: Multiple commuters filing identical issues (e.g. signal failure at a specific station), causing bureaucratic congestion.
- **Triage Delay**: High-urgency safety or accessibility hazards get buried under minor complaints.

**MahaTransit AI** resolves this with an intelligent single-pane-of-glass platform that standardizes reporting, automatically translates regional languages, groups duplicate reports via vector similarity, and assigns intelligent urgency scores.

---

## ✨ Key Features

### 👤 Citizen Portal (User Site)
- **Omnichannel Filing**: Submit complaints through structured text or voice recording.
- **Voice-to-Complaint**: Record voice memos in regional languages; AI handles transcription and translation automatically.
- **Real-Time Tracking**: Monitor status updates from `Submitted` to `In Progress` and `Resolved`.
- **Location Mapping**: Pinpoint incident locations with interactive map coordinates.
- **Notifications & History**: Real-time resolution notifications and historical grievance records.

### 🏢 Department & Official Portal (Admin Site)
- **Role-Based Access**: Dedicated workflows for `Super Admins`, `Department Admins`, and `Complaint Officers`.
- **AI-Assisted Triage**: Auto-predicted category, urgency score (Critical, High, Medium, Low), and confidence metric.
- **Duplicate Cluster Management**: Instant identification of overlapping complaints via semantic embeddings.
- **Analytics & SLA Heatmaps**: Performance tracking, resolution turnaround times, and grievance volume charts.
- **Resolution Lifecycle**: Update statuses, log internal notes, and provide citizen-facing resolution remarks.

---

## 🤖 AI / ML Capabilities

1. **🎙️ Speech-to-Text (STT)**:
   - Built on **OpenAI Whisper** running locally via PyTorch.
   - Converts regional voice complaints into text without sending voice recordings to paid third-party APIs.
2. **🌍 Multilingual Neural Translation**:
   - Built using **HuggingFace MarianMT** models (`Helsinki-NLP/opus-mt-mr-en` and `Helsinki-NLP/opus-mt-hi-en`).
   - Automatically translates Marathi and Hindi grievances to English while preserving the original verbatim report.
3. **🔍 Semantic Duplicate Detection**:
   - Uses **Sentence-Transformers** (`all-MiniLM-L6-v2`) generating 384-dimensional dense embeddings.
   - Integrates with PostgreSQL **`pgvector`** with HNSW indexing to discover semantically matching grievances in sub-millisecond speeds.
4. **⚡ Smart Priority & Category Prediction**:
   - Utilizes machine learning classification models (**XGBoost** / **Scikit-Learn**) trained on transport complaint semantics to predict urgency levels and route complaints to the appropriate department.

---

## 🛠 Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.10+) | High-performance asynchronous REST API |
| **Database & ORM** | PostgreSQL (Supabase) + SQLAlchemy 2.0 | Relational storage with Row-Level Security (RLS) |
| **Vector Engine** | `pgvector` with HNSW Indexing | Semantic complaint embedding search |
| **Object Storage** | Supabase Storage Buckets | Media attachments (audio, images, docs) |
| **AI / ML Pipeline** | PyTorch, Whisper, Transformers, XGBoost | Local AI processing pipeline |
| **User Site Frontend** | React 19, Vite, Tailwind CSS v4 | Citizen grievance web application |
| **Admin Site Frontend** | React 19, Vite, Tailwind CSS v4, Recharts | Official analytics and complaint triage portal |

---

## 📂 Repository Structure

```text
MahaTransitAI/
├── Admin Site/                   # Department Officer & Admin Portal
│   ├── src/                      # React components, pages, services, state
│   ├── .env.example              # Admin frontend environment configuration
│   ├── .gitignore                # Admin-specific gitignore
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite bundler configuration
│
├── Backend/                      # Core FastAPI Application & AI Engine
│   ├── app/                      # Application source
│   │   ├── api/                  # API route controllers (auth, complaints, ai, etc.)
│   │   ├── core/                 # Config settings, security, logging
│   │   ├── db/                   # Database session and base models
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   ├── schemas/              # Pydantic request/response models
│   │   └── services/             # Business logic & AI orchestration
│   ├── AI-Service/               # Standalone AI microservice (optional standalone mode)
│   ├── models/                   # Pre-trained ML model checkpoints (e.g. XGBoost)
│   ├── .env.example              # Backend environment template
│   ├── .gitignore                # Backend-specific gitignore
│   ├── requirements.txt          # Python dependencies
│   └── MahaTransit_AI_Database_Structure.md # DB Schema and Supabase specification
│
├── User Site/                    # Citizen Web Portal
│   ├── src/                      # Citizen UI components, pages, audio recorder
│   ├── .env.example              # User frontend environment configuration
│   ├── .gitignore                # User-specific gitignore
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite bundler configuration
│
├── .gitignore                    # Root repository gitignore
├── LICENSE                       # MIT License
└── README.md                     # Comprehensive project documentation
```

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Python**: Version `3.10` or higher (`python --version`)
2. **Node.js**: Version `18.x` or `20.x` LTS (`node -v`)
3. **npm** or **pnpm**: Node package manager
4. **Git**: Distributed version control
5. **Supabase Account**: A free Supabase PostgreSQL project with the `pgvector` extension enabled.

---

## 🚀 Step-by-Step Activation Guide

Follow these steps to activate and run the entire MahaTransit AI ecosystem locally.

### 1. Clone Repository

```bash
git clone https://github.com/YashPawar1775/MahaTransitAI.git
cd MahaTransitAI
```

---

### 2. Database & Supabase Setup

1. Create a new project in [Supabase](https://supabase.com/).
2. In the Supabase SQL Editor, enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Set up the schema tables as defined in [`Backend/MahaTransit_AI_Database_Structure.md`](Backend/MahaTransit_AI_Database_Structure.md):
   - `departments`, `complaint_categories`, `citizens`, `admins`
   - `complaints`, `complaint_attachments`, `complaint_remarks`
   - `ai_results`, `duplicate_complaints`, `notifications`, `audit_logs`
4. Create the required storage buckets in Supabase Storage:
   - `complaint-attachments` (or `attachments`)
   - `voice-files`
   - `profile-images`
5. Retrieve your PostgreSQL Connection String (Pooler or Direct URI) and API Keys from **Project Settings ➔ Database / API**.

---

### 3. Backend API Activation

Open a terminal and navigate to the `Backend` directory:

```bash
cd Backend
```

#### Step 3.1: Create and Activate Python Virtual Environment

- **On Windows (Command Prompt / PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```

- **On macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### Step 3.2: Install Backend Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 3.3: Configure Backend Environment Variables

Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and fill in your Supabase database and API credentials:

```ini
PROJECT_NAME="MahaTransit AI - Complaint Management System"
API_V1_STR="/api/v1"

# Database Connection (from Supabase Dashboard)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Storage & Service API
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
SUPABASE_BUCKET=complaint-attachments

# AI Models Configuration (Runs locally)
WHISPER_MODEL_SIZE=base
XGBOOST_MODEL_PATH=./models/priority_xgb_model.joblib
```

#### Step 3.4: Launch the FastAPI Backend Server

Run the development server using Uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- The API server will start at: `http://localhost:8000`
- Interactive Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc alternative documentation: `http://localhost:8000/redoc`

---

### 4. Citizen Portal Activation (User Site)

Open a new terminal window:

```bash
cd "User Site"
```

#### Step 4.1: Install Node Dependencies

```bash
npm install
```

#### Step 4.2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Ensure `.env` contains:

```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
PORT=5173
```

#### Step 4.3: Start the Citizen Portal

```bash
npm run dev
```

The Citizen Portal will be live at: **`http://localhost:5173`**

---

### 5. Official & Admin Portal Activation (Admin Site)

Open another terminal window:

```bash
cd "Admin Site"
```

#### Step 5.1: Install Node Dependencies

```bash
npm install
```

#### Step 5.2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Ensure `.env` contains:

```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
PORT=5174
```

#### Step 5.3: Start the Official & Admin Portal

```bash
npm run dev
```

The Admin & Officer Portal will be live at: **`http://localhost:5174`**

---

### 6. Standalone AI Microservice (Optional)

The main FastAPI backend already includes full AI execution capabilities. If you prefer to run the AI processing pipeline as an isolated microservice, an independent runner is provided in `Backend/AI-Service`:

```bash
cd Backend/AI-Service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## 📡 API Reference

When the backend is active, explore and test the endpoints directly via `http://localhost:8000/docs`. Key routes include:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new citizen account |
| `POST` | `/api/v1/auth/login` | Authenticate citizen or transport official |
| `POST` | `/api/v1/complaints/` | Submit a new complaint (with optional media attachment) |
| `GET` | `/api/v1/complaints/` | List complaints with pagination, filtering, and search |
| `GET` | `/api/v1/complaints/{id}` | Retrieve comprehensive complaint details |
| `POST` | `/api/v1/complaints/{id}/status` | Update resolution status and add remarks (Officers) |
| `POST` | `/api/v1/ai/speech-to-text` | Transcribe voice complaint audio via Whisper |
| `POST` | `/api/v1/ai/translation` | Translate Marathi / Hindi grievances into English |
| `POST` | `/api/v1/ai/duplicate-detection` | Calculate semantic similarity and detect duplicates |
| `POST` | `/api/v1/ai/priority-prediction` | Predict urgency tier using XGBoost |
| `POST` | `/api/v1/ai/pipeline` | Execute complete end-to-end AI pipeline on a complaint |

---

## ⚙️ Environment Variables Guide

### Backend (`Backend/.env`)
- `DATABASE_URL`: Full PostgreSQL connection string with credentials.
- `SUPABASE_URL`: Supabase project URL (`https://<ref>.supabase.co`).
- `SUPABASE_KEY`: Supabase Anon or Service Role key.
- `SUPABASE_BUCKET`: Storage bucket name for complaint attachments (default: `complaint-attachments`).
- `WHISPER_MODEL_SIZE`: Whisper model size (`tiny`, `base`, `small`, `medium`). Default: `base`.
- `XGBOOST_MODEL_PATH`: File path to pre-trained priority prediction model weights.

### Citizen Site (`User Site/.env`)
- `VITE_API_BASE_URL`: Base URL for the backend API (`http://localhost:8000/api/v1`).
- `PORT`: Development server port (`5173`).

### Admin Site (`Admin Site/.env`)
- `VITE_API_BASE_URL`: Base URL for the backend API (`http://localhost:8000/api/v1`).
- `PORT`: Development server port (`5174`).

---

## 📄 License & Author

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

**Author & Maintainer:**
- **Yash Pawar** ([@YashPawar1775](https://github.com/YashPawar1775))

---

<p align="center">
  <b>MahaTransit AI</b> — Transforming Urban Mobility & Grievance Redressal with Artificial Intelligence.
</p>
