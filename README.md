# Ownquesta Project - Multi-Service Setup

Complete guide for managing multiple repositories and services in the Ownquesta project.

## 📁 Project Structure

```
Fnal_ownquesta/
├── backend/                 # Node.js/Express API
├── frontend/                # Next.js Web App
├── agent-backend/           # FastAPI Agent Service
├── data-processing/         # Data Processing Service
├── docker-compose.yml       # Orchestrate all services
├── .env.example             # Environment template
└── README.md
```

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
cd Fnal_ownquesta

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Run Services Individually

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 - Agent Backend:**
```bash
cd agent-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Terminal 4 - Data Processing:**
```bash
cd data-processing
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 📡 Service URLs

| Service | URL | Port | Type |
|---------|-----|------|------|
| Frontend | http://localhost:3000 | 3000 | Next.js |
| Backend | http://localhost:5000 | 5000 | Node.js |
| Agent API | http://localhost:8000 | 8000 | FastAPI |
| Data Processing | http://localhost:8001 | 8001 | FastAPI |
| MongoDB | mongodb://localhost:27017 | 27017 | Database |
| Redis | redis://localhost:6379 | 6379 | Cache |

## 🔗 Service Communication

### From Frontend to Backend
```typescript
// services/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  return response.json();
};
```

### From Frontend to Agent
```typescript
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';

export const agentAPI = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${AGENT_URL}${endpoint}`, options);
  return response.json();
};
```

### From Frontend to Data Processing
```typescript
const DATA_URL = process.env.NEXT_PUBLIC_DATA_PROCESS_URL || 'http://localhost:8001';

export const dataProcessingAPI = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${DATA_URL}${endpoint}`, options);
  return response.json();
};