# 🚀 AI Workflow Automation Dashboard

An intelligent automation system that monitors GitHub repositories, analyzes code changes using Google Gemini AI, generates comprehensive daily reports, and delivers them automatically via email.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)

## ✨ Features

### 🔍 Code Analysis
- **Automated GitHub Monitoring** - Webhook-based commit detection
- **AI-Powered Analysis** - Gemini 1.5 Flash analyzes code changes
- **Risk Assessment** - Automatic risk level classification (low/medium/high)
- **Security Scanning** - Identifies potential vulnerabilities
- **Productivity Insights** - Developer productivity metrics

### 📊 Reporting
- **Daily Reports** - Automated comprehensive daily summaries
- **Custom Reports** - On-demand report generation
- **Historical Analysis** - Track project progress over time
- **Export Options** - PDF, CSV, and email formats

### 📧 Email Automation
- **Scheduled Delivery** - Configurable daily report emails
- **Custom Templates** - Professional HTML email templates
- **Multi-recipient** - Team-wide distribution
- **Timezone Support** - Global team compatibility

### 🎯 Dashboard
- **Real-time Overview** - Live project statistics
- **Commit Timeline** - Visual commit history
- **Analysis Results** - Detailed code insights
- **System Logs** - Activity monitoring

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐ │
│  │Dashboard│ │ Projects │ │ Timeline │ │ Reports │ │Email Settings│ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ └──────┬──────┘ │
└───────┼──────────┼───────────┼────────────┼─────────────┼──────────┘
        │          │           │            │             │
        ▼          ▼           ▼            ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js + Express)                   │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────────────┐  │
│  │  Auth API  │ │ GitHub API │ │ Analysis API│ │  Reports API    │  │
│  └─────┬──────┘ └─────┬──────┘ └──────┬──────┘ └────────┬────────┘  │
│        │              │               │                  │           │
│  ┌─────┴──────────────┴───────────────┴──────────────────┴────────┐ │
│  │                     Service Layer                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │ │
│  │  │AI Service│ │Email Svc │ │Report Svc│ │    Cron Jobs      │  │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────┬─────────┘  │ │
│  └───────┼────────────┼────────────┼─────────────────┼────────────┘ │
└──────────┼────────────┼────────────┼─────────────────┼──────────────┘
           │            │            │                 │
           ▼            │            │                 │
┌──────────────────┐    │            │                 │
│  AI MICROSERVICE │    │            │                 │
│  (Python/FastAPI │    │            │                 │
│     /Gemini)     │    │            │                 │
└──────────────────┘    │            │                 │
                        │            │                 │
           ┌────────────┴────────────┴─────────────────┘
           ▼
┌──────────────────┐    ┌──────────────────┐
│    MongoDB       │    │   SMTP Server    │
│   (Database)     │    │   (Email)        │
└──────────────────┘    └──────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios |
| **Backend** | Node.js 20, Express.js, MongoDB, Mongoose, JWT, NodeMailer |
| **AI Service** | Python 3.11, FastAPI, Google Gemini 1.5 Flash, Pydantic |
| **Infrastructure** | Docker, Docker Compose, Nginx |

## 📁 Project Structure

```
Workflow_automation/
├── backend/                    # Node.js Express Backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Auth & validation middleware
│   │   ├── models/            # MongoDB schemas (User, Project, etc.)
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic (AI, Email, Reports)
│   │   └── index.js           # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/                 # Python FastAPI Microservice
│   ├── app/
│   │   ├── prompts/           # Gemini prompt templates
│   │   ├── services/          # AI analysis services
│   │   └── main.py            # FastAPI entry point
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # React Dashboard
│   ├── src/
│   │   ├── components/        # Sidebar, StatCard, DashboardLayout
│   │   ├── pages/             # 9 page components
│   │   ├── services/          # API service
│   │   ├── context/           # AuthContext
│   │   └── App.jsx            # Main app with routing
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Container orchestration
├── .env.example                # Environment template
└── README.md                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Node.js 20+, Python 3.11+, MongoDB
- Google Gemini API key
- GitHub Personal Access Token

### Quick Start with Docker

```bash
# 1. Clone and configure
git clone <repository-url>
cd Workflow_automation
cp .env.example .env
# Edit .env with your API keys

# 2. Start all services
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# AI Service: http://localhost:8000
```

### Local Development

**Backend**
```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
npm run dev           # Runs on port 5000
```

**AI Service**
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # Add your Gemini API key
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev           # Runs on port 5173
```

## ⚙ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_PASSWORD` | MongoDB password | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GITHUB_TOKEN` | GitHub personal access token | Yes |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `SMTP_HOST` | Email server host | Yes |
| `SMTP_PORT` | Email server port | No (default: 587) |
| `SMTP_USER` | Email account username | Yes |
| `SMTP_PASS` | Email account password | Yes |

### GitHub Webhook Setup

1. Go to your repository → Settings → Webhooks
2. Add webhook:
   - URL: `https://your-domain.com/api/github/webhook`
   - Content type: `application/json`
   - Secret: Your `GITHUB_WEBHOOK_SECRET`
   - Events: Select "Push events"

## 📚 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Projects

```http
GET    /api/projects          # List all projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
```

### Analysis

```http
POST /api/analyze             # Trigger analysis
GET  /api/analyze             # Get analyses
GET  /api/analyze/:id         # Get specific analysis
```

### Reports

```http
POST /api/reports/generate    # Generate report
GET  /api/reports             # List reports
GET  /api/reports/:id         # Get report
```

### Email

```http
POST /api/email/test          # Send test email
GET  /api/email/health        # Check email config
PUT  /api/email/schedule      # Update schedule
GET  /api/email/history       # Email history
```

### AI Service Endpoints

```http
POST /analyze                 # Analyze code changes
POST /report                  # Generate AI report
POST /productivity            # Productivity insights
POST /security                # Security analysis
GET  /health                  # Health check
```

## 🚢 Deployment

### Production with Docker Compose

```bash
# Set production environment
export NODE_ENV=production

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# AI Service health
curl http://localhost:8000/health

# MongoDB status
docker exec workflow_mongodb mongosh --eval "db.adminCommand('ping')"
```

## 📈 Key Benefits

This system reduces manual reporting time by **80%** through:

1. ✅ **Automated Commit Detection** - No manual tracking
2. ✅ **AI-Powered Analysis** - Instant code review
3. ✅ **Scheduled Reports** - Zero-effort daily summaries
4. ✅ **Email Automation** - Automatic stakeholder updates
5. ✅ **Centralized Dashboard** - All insights in one place

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for developers who value their time.
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

## 📊 Features

### Dashboard Pages
1. **Login/Signup** - JWT authentication
2. **Project Setup** - Connect GitHub repositories
3. **Code Timeline** - Visual commit history
4. **AI Analysis** - View code analysis results
5. **Reports** - Daily/weekly technical reports
6. **Email Settings** - Configure email automation
7. **Logs** - System status monitoring

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| POST | /api/github/webhook | GitHub webhook handler |
| POST | /api/analyze | Trigger AI analysis |
| GET | /api/reports | Get all reports |
| GET | /api/reports/today | Get today's report |
| POST | /api/email/send | Send report email |
| PUT | /api/email/schedule | Update email schedule |

## 🔄 Automation Flow

```
GitHub Commit 
    ↓
Webhook Trigger 
    ↓
Node.js Backend (Extract Diff)
    ↓
Python AI Service (Process)
    ↓
Gemini 1.5 Flash (Analyze)
    ↓
Store in MongoDB
    ↓
Daily Cron Job (Generate Report)
    ↓
Email Delivery (NodeMailer)
    ↓
Dashboard Display
```

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Axios, Recharts, TailwindCSS
- **Backend**: Node.js, Express, Mongoose, JWT, NodeMailer
- **AI Service**: Python, FastAPI, Google Generative AI
- **Database**: MongoDB
- **AI Model**: Gemini 1.5 Flash

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
