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
```

## 📦 Adding a New Service/Repository

### Step 1: Create New Service Directory

```bash
mkdir new-service
cd new-service
```

### Step 2: Create Basic Structure

For Python (FastAPI):
```
new-service/
├── main.py
├── requirements.txt
├── routes/
│   └── example.py
├── Dockerfile
└── README.md
```

For Node.js (Express):
```
new-service/
├── src/
│   ├── app.ts
│   └── routes/
├── package.json
├── Dockerfile
└── README.md
```

### Step 3: Add to docker-compose.yml

```yaml
new-service:
  build:
    context: ./new-service
    dockerfile: Dockerfile
  container_name: ownquesta-new-service
  ports:
    - "8002:8002"
  environment:
    - API_HOST=0.0.0.0
    - API_PORT=8002
  volumes:
    - ./new-service:/app
  networks:
    - ownquesta-network
  restart: unless-stopped
```

### Step 4: Register with Frontend

Update `frontend/services/api.ts`:
```typescript
const NEW_SERVICE_URL = process.env.NEXT_PUBLIC_NEW_SERVICE_URL || 'http://localhost:8002';

export const newServiceAPI = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${NEW_SERVICE_URL}${endpoint}`, options);
  return response.json();
};
```

### Step 5: Initialize Git (Optional)

```bash
cd new-service
git init
git add .
git commit -m "Initial commit"
# Then push to your repository
```

## 🔄 Inter-Service Communication

### Agent Backend → Data Processing

```python
# In agent-backend/routes/agent.py
import httpx

async def process_with_data_service(data):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://data-processing:8001/api/process/clean',
            json={"data": data}
        )
        return response.json()
```

### Backend → Agent Backend

```javascript
// In backend/src/services/agent.js
const axios = require('axios');

async function askAgent(query) {
  const response = await axios.post(
    'http://agent-backend:8000/api/agent/ask',
    { query }
  );
  return response.data;
}
```

## 🧪 Testing Services

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

### Agent Backend
```bash
cd agent-backend
pytest tests/
```

### Data Processing
```bash
cd data-processing
pytest tests/
```

## 📝 Environment Configuration

Create `.env` file in root:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AGENT_URL=http://localhost:8000
NEXT_PUBLIC_DATA_PROCESS_URL=http://localhost:8001

# Backend
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://admin:password@mongo:27017/ownquesta
JWT_SECRET=your_jwt_secret_here

# Agent Backend
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Data Processing
API_PORT=8001

# Database
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=ownquesta
```

## 🚢 Deployment

### Docker Compose Production

```bash
# Build all images
docker-compose build

# Run with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes (Advanced)

```bash
# Create k8s manifests for each service
kubectl apply -f k8s/

# Check deployments
kubectl get deployments
```

## 🛠️ Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f agent-backend

# Restart a service
docker-compose restart backend

# Stop all
docker-compose down

# Remove volumes
docker-compose down -v

# List running containers
docker-compose ps
```

## 📚 Service Documentation

- **Backend**: [backend/README.md](./backend/README.md)
- **Frontend**: [frontend/README.md](./frontend/README.md)
- **Agent Backend**: [agent-backend/README.md](./agent-backend/README.md)
- **Data Processing**: [data-processing/README.md](./data-processing/README.md)

## 🤝 Contributing

When adding a new service:

1. Create service directory
2. Add to docker-compose.yml
3. Update this README
4. Document endpoints
5. Test service communication
6. Commit and push

## 📖 Integration Guide

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed integration strategies.

## ❓ Troubleshooting

### Service won't connect
- Check docker-compose.yml networks
- Verify service names in URLs
- Check firewall settings

### Port already in use
```bash
# Find process using port
lsof -i :3000

# Or use different ports in docker-compose.yml
```

### Database connection error
- Ensure MongoDB is running: `docker-compose up -d mongo`
- Check MONGO_INITDB_ROOT_USERNAME and PASSWORD

## 📞 Support

For issues, check individual service READMEs or integration guide.

