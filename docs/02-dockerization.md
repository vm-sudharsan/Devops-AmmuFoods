# AmmuFoods — Dockerization

## Table of Contents

- [Overview](#overview)
- [Backend Dockerfile](#backend-dockerfile)
- [Frontend Dockerfile](#frontend-dockerfile)
- [Backend .dockerignore](#backend-dockerignore)
- [Frontend .dockerignore](#frontend-dockerignore)
- [docker-compose.yml — Local Development](#docker-composeyml--local-development)
- [docker-compose.prod.yml — Production](#docker-composeprodmyml--production)
- [Build Commands Reference](#build-commands-reference)
- [How VITE\_API\_URL Works at Build Time](#how-vite_api_url-works-at-build-time)

---

## Overview

AmmuFoods uses Docker to package both the backend and frontend into portable, reproducible container images.

```
┌──────────────────────────────────────────────────────────┐
│                     Docker Images                         │
│                                                          │
│  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │   ammufoods-backend   │  │  ammufoods-frontend    │  │
│  │                       │  │                        │  │
│  │  Base: node:20-alpine │  │  Stage 1: node:20-alpine│ │
│  │  node server.js       │  │  (Vite build)          │  │
│  │  Port: 5000           │  │                        │  │
│  │  Single-stage         │  │  Stage 2: nginx:alpine │  │
│  │                       │  │  (Serves /dist)        │  │
│  └───────────────────────┘  │  Port: 80              │  │
│                              └────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Key design decisions:
- Backend uses a **single-stage** build — there is no compilation step for Node.js, so a multi-stage build adds no value.
- Frontend uses a **multi-stage** build — Node builds the Vite bundle in stage 1, then only the compiled `dist/` files are copied into a minimal nginx image in stage 2. The final image contains no Node.js, no source code, and no `node_modules`.
- Both images use `alpine` variants to minimise image size and attack surface.

---

## Backend Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
```
Uses the official Node.js 20 image based on Alpine Linux. Alpine is a security-focused minimal distribution (~5MB), significantly smaller than Debian-based `node:20`.

```dockerfile
WORKDIR /app
```
Sets `/app` as the working directory inside the container. All subsequent `COPY`, `RUN`, and `CMD` instructions operate relative to this path.

```dockerfile
COPY package*.json ./
```
Copies `package.json` and `package-lock.json` into the container **before** copying source code. This is a deliberate layer-caching optimisation — Docker caches this layer and only re-runs `npm ci` when the package files change, not on every source code edit.

```dockerfile
RUN npm ci --omit=dev
```
Installs dependencies using `npm ci` (clean install) rather than `npm install`. `npm ci`:
- Installs exact versions from `package-lock.json` — fully reproducible
- Fails if `package-lock.json` is missing or mismatched
- Does not modify `node_modules` if already present (fails instead)

`--omit=dev` excludes development dependencies (Jest, Nodemon, Supertest, etc.) from the production image. This reduces image size by approximately 30–40%.

```dockerfile
COPY . .
```
Copies all remaining source files into the container. Files listed in `.dockerignore` are excluded (see [Backend .dockerignore](#backend-dockerignore)). This step comes **after** `npm ci` to preserve the package layer cache.

```dockerfile
EXPOSE 5000
```
Documents that the container listens on port 5000. This is informational only — it does not publish the port to the host. The actual port binding happens in `docker-compose.yml` or Kubernetes service definitions.

```dockerfile
CMD ["node", "server.js"]
```
Specifies the default command when the container starts. Uses the exec form (JSON array) rather than shell form to ensure the process receives OS signals correctly — critical for graceful shutdown in Kubernetes. `server.js` is the entry point: it loads environment variables, connects to MongoDB, and starts the Express server.

### Why no non-root user?

The current backend Dockerfile runs as root. For a production hardening improvement, a `USER node` directive can be added after the `COPY` step. This is noted as a future improvement in the security audit.

---

## Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
```
Starts the first stage named `builder`. This stage installs all dependencies and builds the Vite application. The `AS builder` alias allows the second stage to reference this stage by name. The final image will contain **none** of the contents from this stage.

```dockerfile
WORKDIR /app
```
Sets working directory for the build stage.

```dockerfile
COPY package*.json ./
```
Same layer-caching pattern as the backend: copy lock files first, install dependencies, then copy source. This means `npm ci` only reruns when package files change.

```dockerfile
RUN npm ci
```
Installs **all** dependencies including devDependencies (Vite, TypeScript, ESLint, etc.) because they are needed to build the application. There is no `--omit=dev` here since the build tools are required.

```dockerfile
COPY . .
```
Copies the full frontend source code. Files in `.dockerignore` are excluded (`node_modules`, `dist`, `.env` files, etc.).

```dockerfile
# Build-time variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```
This is the most important section of the frontend Dockerfile.

`ARG` declares a build-time argument that can be passed via `--build-arg` on the command line. `ENV` promotes it to an environment variable so Vite can read it during `npm run build`.

**Why this matters:** Vite statically replaces `import.meta.env.VITE_API_URL` with the actual string value at build time. If `VITE_API_URL` is not set, the fallback in `src/utils/api.js` is used:

```js
// frontend/src/utils/api.js
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};
```

This means the backend URL is **baked into the JavaScript bundle**. A Kubernetes build must pass `--build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api` so the frontend talks to the in-cluster backend service name, not `localhost`.

```dockerfile
RUN npm run build
```
Executes `vite build` which compiles React JSX, processes Tailwind CSS, bundles all JavaScript, and outputs optimised static files to `/app/dist`. After this line, the builder stage is complete.

```dockerfile
# Production Stage
FROM nginx:alpine
```
Starts a completely fresh, minimal nginx image. Nothing from the `builder` stage carries over except what is explicitly `COPY`ed. The final image has no Node.js, no source files, no `node_modules`, and no build tools.

```dockerfile
COPY --from=builder /app/dist /usr/share/nginx/html
```
Copies only the compiled `dist/` directory from the `builder` stage into nginx's web root. This is the heart of multi-stage builds — the production image is tiny (typically 25–35MB vs. 400MB+ for a single-stage Node build).

```dockerfile
EXPOSE 80
```
Documents that nginx listens on port 80.

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
Starts nginx in the foreground (`daemon off`). Docker containers must have a foreground process to stay running. Without `daemon off`, nginx would fork a daemon and exit, causing the container to stop immediately.

### Image size comparison

| Image | Size |
|---|---|
| `node:20-alpine` with all deps | ~400MB |
| Final `ammufoods-frontend` (nginx:alpine + dist) | ~25–35MB |

---

## Backend .dockerignore

**File:** `backend/.dockerignore`

```
node_modules        # Do not copy local node_modules — npm ci installs fresh
npm-debug.log       # Debug logs not needed in container

.env                # NEVER include real secrets in Docker image
.env.*              # Catches .env.production, .env.local, etc.

coverage            # Test coverage reports

.git                # Git history not needed
.gitignore

.vscode             # Editor configs
.kiro

README.md           # Documentation

Dockerfile          # No need to copy Dockerfile into itself

tests               # Test files are excluded from production image
__tests__
```

The most critical entry is `.env` / `.env.*`. If these were not excluded, the real MongoDB URI, Resend API key, and Google private key would be embedded inside the Docker image layer, making them visible to anyone who pulls the image.

---

## Frontend .dockerignore

**File:** `frontend/.dockerignore`

```
node_modules    # Fresh install via npm ci in builder stage

dist            # Prevent stale local build from leaking in — always rebuilt

.env            # Local environment file
.env.*          # Catches all variants

.git
.gitignore

.vscode
.kiro

README.md
Dockerfile
```

---

## docker-compose.yml — Local Development

**File:** `docker-compose.yml`

```yaml
version: '3.9'

services:

  backend:
    build:
      context: ./backend     # Docker build context — Dockerfile is here
    container_name: ammu-backend
    ports:
      - "5000:5000"           # host:container — access at http://localhost:5000
    env_file:
      - ./backend/.env        # Injects all variables from .env at runtime

  frontend:
    build:
      context: ./frontend    # Uses frontend/Dockerfile
    container_name: ammu-frontend
    ports:
      - "3000:80"            # Maps host port 3000 to container port 80 (nginx)
    depends_on:
      - backend              # Starts backend before frontend
```

**Key points:**

- `build: context:` — tells Docker Compose to build the image from source rather than pull from a registry. This is the development workflow.
- `env_file: ./backend/.env` — loads environment variables at container start time. Unlike `ARG`, these are not baked in — they are injected as runtime environment variables. This is correct for Node.js (reads `process.env.*` at runtime).
- The frontend `.env` is not mounted here. The `VITE_API_URL` defaults to `http://localhost:5000/api` via the fallback in `api.js`, which works because both the browser and backend are on `localhost` from the developer's perspective.
- `depends_on` ensures ordering at startup but does not wait for the backend to be healthy — it only waits for the container to start.

**Usage:**

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all
docker compose down
```

---

## docker-compose.prod.yml — Production

**File:** `docker-compose.prod.yml`

```yaml
name: ammufoods

services:

  backend:
    image: sudharsanprakalathanvm/ammufoods-backend:${IMAGE_TAG}
    # container_name: ammu-backend    # Commented out for multi-instance support

    ports:
      - "5000:5000"

    env_file:
      - ./backend/.env

    restart: unless-stopped

  frontend:
    image: sudharsanprakalathanvm/ammufoods-frontend:${IMAGE_TAG}
    # container_name: ammu-frontend

    ports:
      - "3000:80"

    depends_on:
      - backend

    restart: unless-stopped
```

**Key differences from `docker-compose.yml`:**

| Feature | `docker-compose.yml` | `docker-compose.prod.yml` |
|---|---|---|
| Image source | `build:` (from source) | `image:` (from Docker Hub) |
| Image tag | Always latest build | `${IMAGE_TAG}` variable |
| Restart policy | None | `unless-stopped` |
| container_name | Fixed name | Commented out |

**`${IMAGE_TAG}`** is provided at runtime via an environment variable or a `.env` file in the same directory. The Jenkins pipeline previously used this approach (before switching to Kubernetes) by writing `IMAGE_TAG=<build_number>` to a `deploy.env` file and passing it with `--env-file deploy.env`.

**`restart: unless-stopped`** — containers automatically restart after crashes or server reboots, unless explicitly stopped with `docker stop`.

**container_name commented out** — when scaling to multiple instances (e.g. `docker compose up --scale backend=2`), Docker cannot assign the same container name to two instances, so the name is removed.

**Usage:**

```bash
# Deploy specific version
IMAGE_TAG=42 docker compose -f docker-compose.prod.yml up -d

# Pull latest and redeploy
IMAGE_TAG=latest docker compose -f docker-compose.prod.yml pull
IMAGE_TAG=latest docker compose -f docker-compose.prod.yml up -d

# Check running containers
docker compose -f docker-compose.prod.yml ps
```

---

## Build Commands Reference

```bash
# Build backend image locally
docker build -t ammu-backend:latest ./backend

# Build frontend image for Kubernetes (with backend URL baked in)
docker build \
  --build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api \
  -t ammu-frontend:latest \
  ./frontend

# Build frontend for local dev (uses fallback localhost URL)
docker build -t ammu-frontend:local ./frontend

# Tag for Docker Hub
docker tag ammu-backend:latest sudharsanprakalathanvm/ammufoods-backend:42
docker tag ammu-backend:latest sudharsanprakalathanvm/ammufoods-backend:latest

# Push to Docker Hub
docker push sudharsanprakalathanvm/ammufoods-backend:42
docker push sudharsanprakalathanvm/ammufoods-backend:latest

# Inspect image layers
docker history sudharsanprakalathanvm/ammufoods-frontend:latest

# Check image size
docker images | grep ammufoods
```

---

## How VITE_API_URL Works at Build Time

This is the most important thing to understand about the frontend container.

```
┌──────────────────────────────────────────────────────────────┐
│                    Build Time (docker build)                  │
│                                                              │
│  --build-arg VITE_API_URL=http://ammufoods-backend-service   │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │  ARG + ENV   │  (Dockerfile)                 │
│              └──────┬──────┘                                │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │  vite build  │  replaces import.meta.env     │
│              │              │  VITE_API_URL with literal    │
│              └──────┬──────┘  string in bundle.js           │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │   dist/     │  ← compiled JS with URL baked  │
│              └─────────────┘                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Run Time (container)                       │
│                                                              │
│  nginx serves dist/  ← VITE_API_URL is already in the JS    │
│  No environment variables are read at runtime by the        │
│  frontend container.                                        │
└──────────────────────────────────────────────────────────────┘
```

This is fundamentally different from the backend, where `process.env.PORT` is read when `server.js` runs. React/Vite environment variables do not exist at runtime — they are compile-time constants.

**Consequence:** A single frontend Docker image cannot be reused across environments with different backend URLs. A new image must be built for each environment (local, staging, production, Kubernetes).

The Jenkins pipeline handles this by passing the Kubernetes in-cluster service name during the build:

```groovy
bat '''
docker build ^
--build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api ^
-t ammu-frontend:latest .
'''
```
