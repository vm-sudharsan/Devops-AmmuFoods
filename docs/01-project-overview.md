# AmmuFoods — Project Overview

## Table of Contents

- [What is AmmuFoods?](#what-is-ammufoods)
- [Business Context](#business-context)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables Reference](#environment-variables-reference)
- [Local Development Setup](#local-development-setup)

---

## What is AmmuFoods?

AmmuFoods is a full-stack web application for managing a traditional Indian sweets manufacturing and distribution business based in Coimbatore, Tamil Nadu. The system handles product browsing, event catering requests, and direct communication with customers via email and Google Sheets logging.

This repository serves as a **DevOps portfolio project** demonstrating a complete CI/CD pipeline from source code to a Kubernetes-hosted production environment, including container security scanning, automated rollback, and Prometheus-based observability.

---

## Business Context

| Actor | What They Do |
|---|---|
| Customer | Browses products and submits event catering requests |
| Admin | Manages products and reviews event requests |
| System | Logs requests to Google Sheets, sends email confirmations via Resend |

---

## Tech Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 (LTS) |
| Framework | Express.js | 5.2.1 |
| Database | MongoDB Atlas | Mongoose 9.1 |
| Email | Resend API | 6.12 |
| Metrics | prom-client | 15.1.3 |
| Sheets | googleapis | 171.4 |
| Security | Helmet, CORS, express-rate-limit | Latest |
| Validation | express-validator | 7.3 |
| Image Upload | Cloudinary | 2.9 |

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build Tool | Vite | 7.3.1 |
| Routing | React Router DOM | 7.12 |
| Styling | Tailwind CSS | 3.4.17 |
| Icons | Lucide React | 0.562 |
| HTTP | Fetch API | Native |

### Infrastructure

| Layer | Technology |
|---|---|
| Containerisation | Docker (multi-stage builds) |
| Orchestration | Kubernetes |
| CI/CD | Jenkins (Declarative Pipeline) |
| Registry | Docker Hub |
| Security Scanning | Trivy |
| Monitoring | Prometheus + Grafana |
| Frontend Hosting | Netlify (alternative path) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKSTATION                    │
│                                                                 │
│   git push  ──►  Jenkins Pipeline (Windows Agent)              │
│                       │                                         │
│              ┌────────▼────────┐                               │
│              │  Build & Scan   │                               │
│              │  (Docker+Trivy) │                               │
│              └────────┬────────┘                               │
│                       │ docker push                            │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │      Docker Hub       │
            │  ammufoods-backend    │
            │  ammufoods-frontend   │
            └───────────┬───────────┘
                        │ kubectl set image
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                          │
│                                                               │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │  frontend-deployment│    │    backend-deployment        │  │
│  │  replicas: 2        │    │    replicas: 2               │  │
│  │  nginx:alpine       │    │    node:20-alpine            │  │
│  └──────────┬──────────┘    └──────────────┬──────────────┘  │
│             │                              │                   │
│  ┌──────────▼──────────┐    ┌─────────────▼──────────────┐  │
│  │  frontend-service   │    │    backend-service          │  │
│  │  type: NodePort     │    │    type: ClusterIP          │  │
│  │  port: 80           │    │    port: 5000               │  │
│  └─────────────────────┘    └──────────────┬──────────────┘  │
│                                            │                   │
│                              ┌─────────────▼──────────────┐  │
│                              │    ammufoods-secret         │  │
│                              │    (Kubernetes Secret)      │  │
│                              └──────────────┬──────────────┘  │
│                                            │                   │
│  ┌─────────────────────────────────────────▼──────────────┐  │
│  │              Prometheus + Grafana                       │  │
│  │    Scrapes /metrics via pod annotations                 │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    MongoDB Atlas      │
            │  (External Database)  │
            └───────────────────────┘
```

---

## Repository Structure

```
AmmuFoods/
├── backend/
│   ├── scripts/
│   │   ├── seedAdmin.js          # One-time admin user seeder
│   │   └── seedProducts.js       # Product catalogue seeder
│   ├── src/
│   │   ├── app.js                # Express app — middleware + route registration
│   │   ├── config/
│   │   │   ├── cloudinary.js     # Cloudinary SDK initialisation
│   │   │   ├── db.js             # MongoDB connection with error hints
│   │   │   └── oauth.js          # Google OAuth configuration
│   │   ├── controllers/
│   │   │   ├── event.controller.js    # Event request handlers
│   │   │   └── product.controller.js  # Product CRUD handlers
│   │   ├── middlewares/
│   │   │   ├── error.middleware.js    # Global error handler
│   │   │   ├── rateLimit.middleware.js # express-rate-limit config
│   │   │   └── validate.middleware.js  # express-validator runner
│   │   ├── models/
│   │   │   ├── EventRequest.model.js  # Event request schema
│   │   │   └── Product.model.js       # Product schema
│   │   ├── routes/
│   │   │   ├── event.routes.js        # /api/events
│   │   │   ├── metrics.routes.js      # /metrics (Prometheus)
│   │   │   └── product.routes.js      # /api/products
│   │   ├── services/
│   │   │   ├── cloudinary.service.js  # Image upload/delete
│   │   │   ├── mail.service.js        # Email via Resend
│   │   │   └── sheets.service.js      # Google Sheets append
│   │   └── utils/
│   │       ├── asyncHandler.js        # Try/catch wrapper
│   │       ├── jwt.util.js            # JWT sign/verify
│   │       └── password.util.js       # bcrypt hash/compare
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── netlify/
│   │   └── functions/health.js    # Netlify serverless health check
│   ├── src/
│   │   ├── assets/                # Product images, logo
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProductCard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing + product showcase
│   │   │   └── Order.jsx          # Order/event request form
│   │   ├── utils/
│   │   │   └── api.js             # VITE_API_URL resolution
│   │   ├── App.jsx                # Router root
│   │   ├── index.css              # Tailwind directives
│   │   └── main.jsx               # React root mount
│   ├── .dockerignore
│   ├── .env.example
│   ├── .env.k8s                   # Kubernetes-specific VITE_API_URL
│   ├── Dockerfile                 # Multi-stage: build → nginx
│   ├── netlify.toml               # Netlify deployment config
│   ├── package.json
│   └── vite.config.js
│
├── k8s/
│   ├── backend-deployment.yaml    # Probes, resource limits, Prometheus annotations
│   ├── backend-service.yaml       # ClusterIP on 5000
│   ├── frontend-deployment.yaml   # 2 replicas nginx
│   └── frontend-service.yaml      # NodePort on 80
│
├── docs/                          # This documentation
├── .gitignore
├── docker-compose.yml             # Local development
├── docker-compose.prod.yml        # Production Docker Compose
├── Jenkinsfile                    # CI/CD pipeline
└── README.md
```

---

## API Endpoints

All backend API routes are prefixed with `/api`.

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check — returns status, timestamp, environment | Public |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint | Internal |
| `GET` | `/api/products` | List all available products | Public |
| `GET` | `/api/products/:id` | Get single product | Public |
| `POST` | `/api/products` | Create product | Admin |
| `PUT` | `/api/products/:id` | Update product | Admin |
| `DELETE` | `/api/products/:id` | Delete product | Admin |
| `POST` | `/api/events` | Submit event catering request | Public |
| `GET` | `/api/events` | List all event requests | Admin |
| `GET` | `/api/events/:id` | Get single event request | Admin |
| `PATCH` | `/api/events/:id/status` | Update event status | Admin |

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?appName=<app>

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your-admin@gmail.com

# CORS
FRONTEND_URL=http://localhost:5173
FRONTEND_DEV_URL=http://localhost:5173

# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** Vite bakes `VITE_API_URL` into the JavaScript bundle at **build time**.  
> For Kubernetes deployments the value is injected via `--build-arg` in the Dockerfile.  
> See `frontend/.env.k8s` for the Kubernetes value: `http://ammufoods-backend-service:5000/api`

---

## Local Development Setup

### Prerequisites

- Node.js v20+
- Docker Desktop
- A MongoDB Atlas cluster
- A Resend account for email

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/sudharsanprakalathanvm/ammufoods.git
cd ammufoods

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, Resend key, etc.

# 3. Configure frontend environment
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:5000/api

# 4. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 5a. Run natively
cd backend && npm run dev      # http://localhost:5000
cd ../frontend && npm run dev  # http://localhost:5173

# 5b. OR run with Docker Compose
cd ..
docker compose up --build
# Backend → http://localhost:5000
# Frontend → http://localhost:3000
```
