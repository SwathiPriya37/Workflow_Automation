# 🚀 AI Workflow Automation Dashboard

An intelligent automation system that monitors GitHub repositories, analyzes code changes using Google Gemini AI, generates comprehensive daily reports, and delivers them automatically via email.

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


## 📊 Features

### Dashboard Pages
1. **Login/Signup** - JWT authentication
2. **Project Setup** - Connect GitHub repositories
3. **Code Timeline** - Visual commit history
4. **AI Analysis** - View code analysis results
5. **Reports** - Daily/weekly technical reports
6. **Email Settings** - Configure email automation
7. **Logs** - System status monitoring


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
