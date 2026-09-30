# ⚙️ MahaTransit AI — Backend & AI Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

This directory houses the core REST API and AI processing pipeline for **MahaTransit AI**, built with FastAPI, SQLAlchemy 2, Supabase PostgreSQL, `pgvector`, and PyTorch.

---

## 🚀 Quick Setup & Activation

### 1. Create Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
copy .env.example .env   # Windows
cp .env.example .env     # Linux/macOS
```
Configure your `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_KEY` in `.env`.

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🤖 AI / ML Architecture

- **Speech-to-Text**: Whisper model (`base`) for transcribing commuter voice recordings.
- **Multilingual Translation**: MarianMT models for Marathi (`mr`) and Hindi (`hi`) to English (`en`).
- **Duplicate Detection**: Sentence Transformers (`all-MiniLM-L6-v2`) with 384-dimensional cosine distance querying via `pgvector`.
- **Priority Prediction**: Scikit-Learn / XGBoost classification for grievance urgency scoring.

For full database schema documentation, see [MahaTransit_AI_Database_Structure.md](MahaTransit_AI_Database_Structure.md).

---

## 📄 License

This component is licensed under the MIT License — see [LICENSE](LICENSE) for details.
**Author**: Yash Pawar ([@YashPawar1775](https://github.com/YashPawar1775))
