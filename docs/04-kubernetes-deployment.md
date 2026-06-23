# AmmuFoods — Kubernetes Deployment

## Table of Contents

- [Overview](#overview)
- [Cluster Architecture](#cluster-architecture)
- [Secrets](#secrets)
- [Backend Deployment](#backend-deployment)
- [Backend Service](#backend-service)
- [Frontend Deployment](#frontend-deployment)
- [Frontend Service](#frontend-service)
- [Health Probes Explained](#health-probes-explained)
- [Resource Limits Explained](#resource-limits-explained)
- [Rolling Updates](#rolling-updates)
- [Apply and Manage](#apply-and-manage)
- [Useful kubectl Commands](#useful-kubectl-commands)

---

## Overview

AmmuFoods runs on Kubernetes with four manifest files:

| File | Kind | Purpose |
|---|---|---|
| `k8s/backend-deployment.yaml` | Deployment | Runs 2 replicas of the Node.js backend |
| `k8s/backend-service.yaml` | Service (ClusterIP) | Internal access to the backend within the cluster |
| `k8s/frontend-deployment.yaml` | Deployment | Runs 2 replicas of the nginx frontend |
| `k8s/frontend-service.yaml` | Service (NodePort) | External access to the frontend |

---

## Cluster Architecture

```
External Traffic
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Node                            │
│                                                                 │
│  ┌──────────────────────────────┐                              │
│  │   frontend-service (NodePort)│◄── Browser / External Users │
│  │   port: 80                   │                              │
│  └──────────────┬───────────────┘                              │
│                 │                                               │
│     ┌───────────┼───────────┐                                  │
│     ▼           ▼           ▼                                  │
│  ┌────────┐ ┌────────┐  (selector: app=ammufoods-frontend)     │
│  │frontend│ │frontend│                                         │
│  │ pod 1  │ │ pod 2  │  nginx serving /dist                    │
│  └────────┘ └────────┘                                         │
│       │          │                                              │
│       └────┬─────┘  (all fetch() calls go to backend-service)  │
│            │                                                    │
│  ┌─────────▼─────────────────────┐                             │
│  │  backend-service (ClusterIP)  │                             │
│  │  ammufoods-backend-service:5000                             │
│  └──────────────┬────────────────┘                             │
│                 │                                               │
│     ┌───────────┼───────────┐                                  │
│     ▼           ▼           ▼                                  │
│  ┌────────┐ ┌────────┐  (selector: app=ammufoods-backend)      │
│  │backend │ │backend │                                         │
│  │ pod 1  │ │ pod 2  │  node server.js:5000                    │
│  └────────┘ └────────┘                                         │
│       │                                                         │
│  envFrom: secretRef: ammufoods-secret                          │
│                 │                                               │
└─────────────────┼───────────────────────────────────────────── ┘
                  │
                  ▼
         MongoDB Atlas (external)
```

---

## Secrets

The backend requires environment variables containing sensitive data (MongoDB URI, Resend API key, Google private key). These are stored in a Kubernetes Secret named `ammufoods-secret`.

**Kubernetes Secrets are NOT created from a manifest file** in this repository — they are created imperatively from the command line to avoid committing sensitive data to Git.

### Creating the secret

```bash
kubectl create secret generic ammufoods-secret \
  --from-literal=PORT=5000 \
  --from-literal=NODE_ENV=production \
  --from-literal=MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" \
  --from-literal=RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx" \
  --from-literal=ADMIN_EMAIL="ammufoods2018@gmail.com" \
  --from-literal=FRONTEND_URL="http://your-frontend-url" \
  --from-literal=FRONTEND_DEV_URL="http://localhost:5173" \
  --from-literal=GOOGLE_SHEET_ID="your_sheet_id" \
  --from-literal=GOOGLE_SERVICE_ACCOUNT_EMAIL="sa@project.iam.gserviceaccount.com" \
  --from-literal=GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Verifying the secret exists

```bash
kubectl get secret ammufoods-secret
kubectl describe secret ammufoods-secret
```

### How it connects to the deployment

In `k8s/backend-deployment.yaml`:

```yaml
envFrom:
- secretRef:
    name: ammufoods-secret
```

`envFrom: secretRef` injects **all** key-value pairs from the secret as environment variables into the container. This is equivalent to listing each key under `env:` individually. The backend reads them via `process.env.*` at runtime.

> **Important:** The backend pod will enter `CrashLoopBackOff` if the `ammufoods-secret` does not exist. Always create the secret before applying the deployment.

---

## Backend Deployment

**File:** `k8s/backend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
```
Uses the standard Deployment API. A Deployment manages a ReplicaSet, which manages the actual Pods. This abstraction provides rolling updates, rollback history, and self-healing.

```yaml
metadata:
  name: ammufoods-backend
```
The Deployment name. Used in `kubectl set image deployment/ammufoods-backend` in the Jenkins pipeline.

```yaml
spec:
  replicas: 2
```
Runs two identical backend pods simultaneously. This provides:
- **High availability** — if one pod crashes, the other continues serving requests
- **Zero-downtime deployments** — rolling updates replace one pod at a time

```yaml
  selector:
    matchLabels:
      app: ammufoods-backend
```
The Deployment manages all pods that have the label `app: ammufoods-backend`. This is how Kubernetes knows which pods belong to this Deployment.

```yaml
  template:
    metadata:
      labels:
        app: ammufoods-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "5000"
```
Every pod created from this template gets the `app: ammufoods-backend` label (required for the Service selector to find it).

The three Prometheus annotations tell Prometheus how to scrape this pod:
- `prometheus.io/scrape: "true"` — opt this pod into scraping
- `prometheus.io/path: "/metrics"` — the path that returns Prometheus metrics
- `prometheus.io/port: "5000"` — the port to scrape on

These annotations are read by Prometheus's Kubernetes service discovery configuration. The backend exposes metrics at `http://<pod-ip>:5000/metrics` via `prom-client`.

```yaml
    spec:
      containers:
      - name: backend
        image: sudharsanprakalathanvm/ammufoods-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
```
`imagePullPolicy: Always` — Kubernetes always pulls the image from Docker Hub before starting the container, even if it's already cached locally. This ensures that tagging changes to `latest` are picked up. When deploying with a specific build number tag (as the Jenkins pipeline does), `IfNotPresent` would be more efficient.

```yaml
        envFrom:
        - secretRef:
            name: ammufoods-secret
```
Injects all secret key-value pairs as environment variables. See [Secrets](#secrets).

```yaml
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
```
See [Health Probes Explained](#health-probes-explained).

```yaml
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 15
```
See [Health Probes Explained](#health-probes-explained).

```yaml
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```
See [Resource Limits Explained](#resource-limits-explained).

---

## Backend Service

**File:** `k8s/backend-service.yaml`

```yaml
apiVersion: v1
kind: Service

metadata:
  name: ammufoods-backend-service
```
The Service name becomes the DNS hostname for in-cluster access: `ammufoods-backend-service`. Any pod in the cluster can reach the backend at `http://ammufoods-backend-service:5000`. This is the URL baked into the frontend image as `VITE_API_URL`.

```yaml
spec:
  selector:
    app: ammufoods-backend
```
Routes traffic to all pods with label `app: ammufoods-backend`. When a new backend pod starts (during a rolling update), it automatically receives traffic once Kubernetes adds it to the Service endpoints.

```yaml
  ports:
  - protocol: TCP
    port: 5000
    targetPort: 5000
```
`port: 5000` — the port the Service listens on (what callers connect to).  
`targetPort: 5000` — the port on the pod to forward traffic to (where `node server.js` listens).

```yaml
  type: ClusterIP
```
`ClusterIP` is the default Service type. It creates an internal virtual IP address reachable only from within the cluster. The backend is intentionally not exposed externally — all external traffic flows through the frontend, which calls the backend API via the internal service name.

This provides a security boundary: the MongoDB URI and API keys in the backend are not accessible from outside the cluster.

---

## Frontend Deployment

**File:** `k8s/frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment

metadata:
  name: ammufoods-frontend

spec:
  replicas: 2
```
Two frontend replicas. Each pod serves the compiled React SPA via nginx.

```yaml
  selector:
    matchLabels:
      app: ammufoods-frontend

  template:
    metadata:
      labels:
        app: ammufoods-frontend

    spec:
      containers:
      - name: frontend
        image: sudharsanprakalathanvm/ammufoods-frontend:latest
        ports:
        - containerPort: 80
```

The frontend deployment is simpler than the backend:
- No `envFrom` — the frontend container is nginx serving static files. No runtime environment variables are needed.
- No health probes — this is a current gap. A readiness probe hitting nginx's root path would improve deployment reliability.
- No resource limits — another current gap.

The frontend image contains the compiled Vite bundle with `VITE_API_URL=http://ammufoods-backend-service:5000/api` baked in. All API calls from the browser use this URL, which resolves to the backend ClusterIP service.

---

## Frontend Service

**File:** `k8s/frontend-service.yaml`

```yaml
apiVersion: v1
kind: Service

metadata:
  name: ammufoods-frontend-service

spec:
  selector:
    app: ammufoods-frontend

  ports:
  - port: 80
    targetPort: 80

  type: NodePort
```

`type: NodePort` — exposes the Service on a port on every node in the cluster. Kubernetes assigns a port in the range 30000–32767 (or a specified port). This makes the frontend accessible from outside the cluster at `http://<node-ip>:<nodeport>`.

Unlike `ClusterIP`, `NodePort` allows external access without an Ingress controller. This is appropriate for a learning/portfolio Kubernetes setup.

In a production Kubernetes environment, an `Ingress` resource with TLS termination would replace the `NodePort` service.

### Access the frontend

```bash
# Get the assigned NodePort
kubectl get service ammufoods-frontend-service
# Example output:
# NAME                       TYPE       PORT(S)        AGE
# ammufoods-frontend-service NodePort   80:31234/TCP   2d

# Access in browser
http://<node-ip>:31234

# Or use port-forward for local access
kubectl port-forward service/ammufoods-frontend-service 8080:80
# Then visit http://localhost:8080
```

---

## Health Probes Explained

The backend deployment defines two health probes, both hitting the `/api/health` endpoint.

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 10
```

**What it does:** Determines whether the pod is ready to receive traffic.

**Timing:**
- `initialDelaySeconds: 10` — waits 10 seconds after the container starts before the first probe. Allows Node.js to start and MongoDB to connect.
- `periodSeconds: 10` — checks every 10 seconds.

**Behaviour on failure:**
- If the readiness probe fails, Kubernetes removes the pod from the Service's endpoint list — no more traffic is routed to it.
- The pod is not restarted.
- This is used during rolling updates: new pods only receive traffic once they pass the readiness probe. Old pods continue serving traffic until new pods are ready.

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 15
```

**What it does:** Determines whether the pod is still alive and should continue running.

**Timing:**
- `initialDelaySeconds: 30` — longer delay than the readiness probe. Gives the app more time to initialise before liveness checks begin. A liveness probe that fires too early can cause a healthy pod to be killed during startup.
- `periodSeconds: 15` — checks every 15 seconds.

**Behaviour on failure:**
- If the liveness probe fails, Kubernetes **restarts the container**.
- This recovers from deadlocks, infinite loops, or any state where the app is running but not responding.

### The /api/health endpoint

```js
// backend/src/app.js
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    message: "AmmuFoods Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});
```

Returns HTTP 200 when the server is running. The probe only checks the status code (200 = healthy). The response body is for human consumption.

---

## Resource Limits Explained

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### Requests (Guaranteed Resources)

`requests` are what Kubernetes **guarantees** to the container. The scheduler uses this to decide which node to place the pod on.

- `cpu: "100m"` — 100 millicores = 0.1 CPU core. At minimum, one-tenth of a CPU is reserved for this container.
- `memory: "128Mi"` — 128 mebibytes of RAM guaranteed.

### Limits (Maximum Resources)

`limits` are the maximum resources the container can use.

- `cpu: "500m"` — the container can burst up to half a CPU core. If it tries to use more, the Linux kernel throttles it.
- `memory: "512Mi"` — if the container exceeds 512Mi, Kubernetes kills it with an OOMKilled (Out Of Memory) signal and restarts it.

### Why this matters

Without `requests`, Kubernetes cannot schedule pods efficiently — it doesn't know how much resource a pod needs and may overcommit nodes.

Without `limits`, a misbehaving pod can consume all node resources, starving other pods. Memory limits are especially important because memory pressure cannot be throttled — it results in immediate pod termination.

---

## Rolling Updates

When the Jenkins pipeline runs `kubectl set image`, Kubernetes performs a rolling update:

```
Before update:
  ┌─────────────┐   ┌─────────────┐
  │  backend:41 │   │  backend:41 │
  │  (pod-abc)  │   │  (pod-def)  │
  └─────────────┘   └─────────────┘

Rolling update to backend:42:

Step 1: Start new pod
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  backend:41 │   │  backend:41 │   │  backend:42 │ ← Starting
  │  (pod-abc)  │   │  (pod-def)  │   │  (pod-ghi)  │
  └─────────────┘   └─────────────┘   └──────┬──────┘
                                              │ readiness probe passes

Step 2: Terminate old pod
  ┌─────────────┐                     ┌─────────────┐
  │  backend:41 │                     │  backend:42 │ ← Ready
  │  (pod-abc)  │                     │  (pod-ghi)  │
  └─────────────┘                     └─────────────┘
     Terminating

Step 3: Start second new pod
  ┌─────────────┐   ┌─────────────┐
  │  backend:42 │   │  backend:42 │ ← Both replicas updated
  │  (pod-ghi)  │   │  (pod-jkl)  │
  └─────────────┘   └─────────────┘
```

This ensures zero downtime — at least one healthy pod is always serving traffic during the update.

If the new pod fails its readiness probe, the update pauses. The old pod remains running. The Jenkins pipeline catches this via `kubectl rollout status`, which exits non-zero, triggering the `post { failure }` auto-rollback.

---

## Apply and Manage

### Initial deployment

```bash
# Create the secret first (see Secrets section)
kubectl create secret generic ammufoods-secret --from-literal=...

# Create a curlpod for health checks in the Jenkins pipeline
kubectl run curlpod --image=curlimages/curl --command -- sleep infinity

# Apply all manifests
kubectl apply -f k8s/

# Watch pods come up
kubectl get pods -w
```

### Check deployment status

```bash
# Pod status
kubectl get pods -l app=ammufoods-backend
kubectl get pods -l app=ammufoods-frontend

# Deployment status
kubectl get deployments

# Service status
kubectl get services

# Events (useful for debugging)
kubectl describe deployment ammufoods-backend
kubectl describe pod <pod-name>
```

### View pod logs

```bash
# Logs from backend pod
kubectl logs -l app=ammufoods-backend --tail=50

# Follow logs in real time
kubectl logs -l app=ammufoods-backend -f

# Logs from a specific pod
kubectl logs ammufoods-backend-<hash>
```

### Manual rollout operations

```bash
# Check rollout history
kubectl rollout history deployment/ammufoods-backend

# Roll back to the previous version
kubectl rollout undo deployment/ammufoods-backend

# Roll back to a specific revision
kubectl rollout undo deployment/ammufoods-backend --to-revision=3

# Pause a rolling update
kubectl rollout pause deployment/ammufoods-backend

# Resume a paused rollout
kubectl rollout resume deployment/ammufoods-backend
```

---

## Useful kubectl Commands

```bash
# Get everything in the default namespace
kubectl get all

# Describe a pod (shows events, probe status, resource usage)
kubectl describe pod <pod-name>

# Execute a command inside a running pod
kubectl exec -it <pod-name> -- sh

# Port forward the backend to localhost for testing
kubectl port-forward service/ammufoods-backend-service 5000:5000
# Then: curl http://localhost:5000/api/health

# Port forward the frontend to localhost
kubectl port-forward service/ammufoods-frontend-service 8080:80
# Then: open http://localhost:8080

# Scale deployments manually
kubectl scale deployment ammufoods-backend --replicas=3

# Restart all pods in a deployment (rolling restart)
kubectl rollout restart deployment/ammufoods-backend

# Delete and recreate everything
kubectl delete -f k8s/
kubectl apply -f k8s/
```
