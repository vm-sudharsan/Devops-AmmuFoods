# AmmuFoods — Troubleshooting Guide

## Table of Contents

- [Docker Build Failures](#docker-build-failures)
- [MongoDB Atlas Whitelist Issue](#mongodb-atlas-whitelist-issue)
- [Prometheus Scrape Issue](#prometheus-scrape-issue)
- [CrashLoopBackOff Issue](#crashloopbackoff-issue)
- [Port-Forwarding Issues](#port-forwarding-issues)
- [CORS Errors](#cors-errors)
- [General Debugging Commands](#general-debugging-commands)

---

## Docker Build Failures

### Issue: Frontend build fails with "VITE_API_URL not set"

**Symptom:**

The frontend container builds successfully but the app makes requests to `undefined/api/products` when running in Kubernetes.

**Root Cause:**

Vite bakes environment variables into the JavaScript bundle at **build time**. If `VITE_API_URL` is not passed as a `--build-arg`, Vite uses the fallback value in `api.js`:

```js
// frontend/src/utils/api.js
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};
```

A frontend image built **without** the build arg will always call `http://localhost:5000/api` — `localhost` inside the browser context refers to the user's machine, not the Kubernetes cluster. This results in failed API calls.

**Fix:**

Always pass `--build-arg` when building the frontend image for Kubernetes:

```bash
docker build \
  --build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api \
  -t ammufoods-frontend:latest \
  ./frontend
```

In the Jenkins pipeline this is already handled:

```groovy
bat '''
docker build ^
--build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api ^
-t ammu-frontend:latest .
'''
```

**Verify the baked-in URL:**

```bash
# Check what URL was baked into the image
docker run --rm ammu-frontend:latest \
  grep -r "ammufoods-backend-service" /usr/share/nginx/html/assets/
```

---

### Issue: Backend Docker build fails — npm ci exits with error

**Symptom:**

```
npm error code EINTEGRITY
npm error sha512-... integrity checksum failed
```

**Root Cause:**

`npm ci` requires `package-lock.json` to be in sync with `package.json`. If `package.json` was modified and `npm install` was not run to update the lockfile, `npm ci` fails.

**Fix:**

```bash
# On the developer machine, regenerate the lockfile
cd backend
npm install
# Commit the updated package-lock.json
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

---

### Issue: Docker build fails — "Cannot find module" during image startup

**Symptom:**

Container starts but immediately exits with:
```
Error: Cannot find module 'express'
```

**Root Cause:**

The `COPY . .` instruction copies the local `node_modules` folder from the developer's machine into the image, overwriting the `npm ci` installation with platform-specific binaries (compiled native modules may differ between macOS/Windows and linux/alpine).

**Fix:**

Ensure `backend/.dockerignore` contains `node_modules`:

```
node_modules
```

This file already exists in the repository. If it was accidentally deleted or modified:

```bash
# Verify .dockerignore
cat backend/.dockerignore
```

Then rebuild:

```bash
docker build --no-cache -t ammu-backend:latest ./backend
```

---

### Issue: Frontend build produces blank page

**Symptom:**

The frontend loads but shows a completely blank page. No errors in the build step.

**Root Cause:**

React Router uses client-side routing. When the nginx container serves a URL like `http://host/order`, nginx looks for a file at `/usr/share/nginx/html/order` which doesn't exist, and returns a 404 — resulting in a blank page.

**Fix:**

A custom nginx configuration needs to redirect all requests to `index.html`. Add a custom nginx config to the frontend Dockerfile:

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Add to `frontend/Dockerfile` in the production stage:
```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

> **Note:** This fix has not been applied to the current repository. The current deployment works because the app is accessed via the root path. This would need to be addressed before deep-linking to routes like `/order` directly.

---

## MongoDB Atlas Whitelist Issue

### Issue: Backend pod crashes — "MongoDB connection failed: ECONNREFUSED" or IP whitelist error

**Symptom:**

Pod logs show:
```
❌ MongoDB connection failed:
Error: Could not connect to any servers in your MongoDB Atlas cluster.
💡 Possible issues:
   - Add your IP to MongoDB Atlas whitelist
   - Or add 0.0.0.0/0 to allow all IPs
```

This error is produced by `backend/src/config/db.js`:

```js
} else if (error.message.includes("IP")) {
  console.error("\n💡 Possible issues:");
  console.error("   - Add your IP to MongoDB Atlas whitelist");
  console.error("   - Or add 0.0.0.0/0 to allow all IPs");
}
```

**Root Cause:**

MongoDB Atlas requires explicit IP whitelisting. When the backend runs inside Kubernetes, the outbound IP address is the Kubernetes node's IP, not the developer's machine IP. Atlas rejects connections from unknown IPs by default.

**Fix — Development / Learning environment:**

Add `0.0.0.0/0` to the MongoDB Atlas IP Access List to allow connections from any IP:

1. Log in to MongoDB Atlas
2. Navigate to **Security → Network Access**
3. Click **Add IP Address**
4. Enter `0.0.0.0/0` and set comment to "Allow all (development)"
5. Click **Confirm**

> **Warning:** `0.0.0.0/0` allows connections from any IP address. This is acceptable for a learning environment but not recommended for production. In production, use a static IP for the Kubernetes egress or a VPC peering connection.

**Fix — Production:**

Configure a NAT gateway for your Kubernetes cluster and whitelist only that gateway's static IP in MongoDB Atlas.

**Verify connectivity:**

```bash
# From inside a backend pod
kubectl exec -it <backend-pod-name> -- sh
# Inside the pod:
nslookup <your-cluster>.mongodb.net
```

---

## Prometheus Scrape Issue

### Issue: Prometheus shows backend targets as DOWN

**Symptom:**

In Prometheus UI (Status → Targets), the AmmuFoods backend targets show:
```
State: DOWN
Error: Get "http://<pod-ip>:5000/metrics": context deadline exceeded
```

Or the targets do not appear at all.

**Root Cause 1: Pod annotations are on the Deployment, not the pod template**

Prometheus discovers pods via their annotations. The annotations must be on the **pod template** (`spec.template.metadata.annotations`), not on the Deployment's own metadata.

Incorrect (on Deployment metadata):
```yaml
metadata:
  name: ammufoods-backend
  annotations:                  # ← WRONG — this is on the Deployment
    prometheus.io/scrape: "true"
```

Correct (on pod template):
```yaml
spec:
  template:
    metadata:
      annotations:              # ← CORRECT — this is on the pod
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "5000"
```

The `k8s/backend-deployment.yaml` in this repository has the annotations in the correct location.

**Fix:**

```bash
kubectl describe pod <backend-pod-name> | grep -A5 "Annotations"
# Should show: prometheus.io/scrape=true
```

If annotations are missing:
```bash
kubectl annotate pod <pod-name> prometheus.io/scrape=true
kubectl annotate pod <pod-name> prometheus.io/path=/metrics
kubectl annotate pod <pod-name> prometheus.io/port=5000
```

Or re-apply the deployment:
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

**Root Cause 2: `/metrics` endpoint is rate-limited**

If Prometheus is being rate-limited (previously, before the metrics route was moved before `apiLimiter`), scrapes return HTTP 429, which Prometheus reports as DOWN.

**Fix (already applied in the codebase):**

The metrics route is registered before `apiLimiter` in `app.js`:

```js
// ── Prometheus metrics (before rate limiter) ──
app.use("/metrics", metricsRoutes);

// ── Rate limiting ──
app.use(apiLimiter);
```

**Verify the endpoint is accessible:**

```bash
# From inside the cluster
kubectl exec curlpod -- curl -s http://ammufoods-backend-service:5000/metrics | head -5

# Expected output:
# # HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# # TYPE process_cpu_user_seconds_total counter
# process_cpu_user_seconds_total 0.046875
```

**Root Cause 3: Prometheus not configured for pod discovery**

If using standalone Prometheus (not kube-prometheus-stack), it may not have `kubernetes_sd_configs` configured.

**Fix:**

Ensure `prometheus.yml` includes pod discovery. See the scrape config in [05-monitoring-prometheus-grafana.md](05-monitoring-prometheus-grafana.md#configuring-prometheus-scraping).

---

## CrashLoopBackOff Issue

### Issue: Backend pod enters CrashLoopBackOff

**Symptom:**

```bash
kubectl get pods
# NAME                                    READY   STATUS             RESTARTS
# ammufoods-backend-7d9f6b5c4-abc12       0/1     CrashLoopBackOff   5
```

**Diagnosis:**

```bash
# Check the logs of the crashed pod
kubectl logs ammufoods-backend-<hash>

# Check previous logs (before the last restart)
kubectl logs ammufoods-backend-<hash> --previous

# Describe the pod for event details
kubectl describe pod ammufoods-backend-<hash>
```

**Root Cause 1: Missing Kubernetes Secret**

The most common cause. The deployment references `ammufoods-secret` via `envFrom: secretRef`. If the secret doesn't exist, the pod cannot start.

Symptoms in logs:
```
Error from server (BadRequest): container "backend" in pod "ammufoods-backend-..." 
failed to start: failed to get secret reference "ammufoods-secret": 
secrets "ammufoods-secret" not found
```

**Fix:**

```bash
# Check if the secret exists
kubectl get secret ammufoods-secret

# If it doesn't exist, create it (see 04-kubernetes-deployment.md)
kubectl create secret generic ammufoods-secret \
  --from-literal=MONGO_URI="mongodb+srv://..." \
  --from-literal=...
```

**Root Cause 2: MongoDB connection failure at startup**

If `MONGO_URI` in the secret is incorrect (wrong credentials, wrong cluster name), `connectDB()` throws an error and calls `process.exit(1)`.

```js
// backend/src/config/db.js
} catch (error) {
  console.error("❌ MongoDB connection failed:");
  process.exit(1);    // ← Causes the container to exit → CrashLoopBackOff
}
```

Symptoms in logs:
```
❌ MongoDB connection failed:
Error: authentication failed
```

**Fix:**

1. Verify the MONGO_URI value in the secret:
```bash
kubectl get secret ammufoods-secret -o jsonpath='{.data.MONGO_URI}' | base64 --decode
```

2. Update the secret if incorrect:
```bash
kubectl delete secret ammufoods-secret
kubectl create secret generic ammufoods-secret \
  --from-literal=MONGO_URI="mongodb+srv://correct-user:correct-pass@cluster.mongodb.net/db"
```

3. Restart the deployment to pick up the new secret:
```bash
kubectl rollout restart deployment/ammufoods-backend
```

**Root Cause 3: Wrong Docker image or tag**

If `kubectl set image` was called with a non-existent tag, the pod fails to pull the image.

Symptoms in `kubectl describe pod`:
```
Events:
  Warning  Failed    ErrImagePull       Back-off pulling image "...backend:999"
  Warning  Failed    ImagePullBackOff   Back-off pulling image "...backend:999"
```

**Fix:**

```bash
# Check what image is currently set
kubectl get deployment ammufoods-backend -o jsonpath='{.spec.template.spec.containers[0].image}'

# Roll back to the previous working revision
kubectl rollout undo deployment/ammufoods-backend
```

---

## Port-Forwarding Issues

### Issue: kubectl port-forward disconnects frequently

**Symptom:**

```bash
kubectl port-forward service/ammufoods-backend-service 5000:5000
# Forwarding from 127.0.0.1:5000 -> 5000
# Forwarding from [::1]:5000 -> 5000
# ... (disconnects after a few minutes)
# error: lost connection to pod
```

**Root Cause:**

`kubectl port-forward` is not designed for stable long-term connections. It creates a single tunnel that can be interrupted by pod restarts, rolling updates, or network timeouts.

**Fix for testing:**

```bash
# Keep port-forward running in the background with auto-reconnect
while true; do
  kubectl port-forward service/ammufoods-backend-service 5000:5000
  echo "Reconnecting..."
  sleep 2
done
```

**Fix for production access:**

Use a `NodePort` service or an `Ingress` resource instead of port-forwarding.

---

### Issue: Port already in use when port-forwarding

**Symptom:**

```bash
kubectl port-forward service/ammufoods-backend-service 5000:5000
# Unable to listen on port 5000: listen tcp 127.0.0.1:5000: bind: address already in use
```

**Root Cause:**

The local port 5000 is already occupied by another process (possibly a previously started `kubectl port-forward` or the local backend server).

**Fix:**

```bash
# Windows: Find what's using port 5000
netstat -ano | findstr :5000
# Kill the process by PID
taskkill /PID <pid> /F

# Use a different local port
kubectl port-forward service/ammufoods-backend-service 5001:5000
# Access at http://localhost:5001
```

---

### Issue: Accessing frontend via NodePort returns connection refused

**Symptom:**

```
http://<node-ip>:<nodeport>/   →  ERR_CONNECTION_REFUSED
```

**Root Cause:**

When using a local Kubernetes distribution (Minikube, Docker Desktop Kubernetes, kind), the "node IP" may not be the machine's IP.

**Fix for Minikube:**

```bash
# Get the correct service URL
minikube service ammufoods-frontend-service --url
# Returns: http://192.168.49.2:31234
```

**Fix for Docker Desktop Kubernetes:**

Docker Desktop Kubernetes uses `localhost` as the node IP:

```bash
kubectl get service ammufoods-frontend-service
# PORT(S): 80:31234/TCP
# Access: http://localhost:31234
```

**Fix for any environment — use port-forward:**

```bash
kubectl port-forward service/ammufoods-frontend-service 8080:80
# Access: http://localhost:8080
```

---

## CORS Errors

### Issue: Browser shows CORS blocked error

**Symptom:**

```
Access to fetch at 'http://ammufoods-backend-service:5000/api/products' 
from origin 'http://localhost:8085' has been blocked by CORS policy
```

**Root Cause:**

The frontend is being served from an origin not in the backend's CORS allowlist. In `backend/src/app.js`:

```js
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8085",
  "https://ammufoods.netlify.app",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_DEV_URL,
].filter(Boolean);
```

If the frontend is running on a port not in this list, all CORS preflight requests are rejected.

**Fix:**

Add the new origin to the allowlist in `app.js`, or set `FRONTEND_URL` in the backend's environment variables (the `ammufoods-secret`) to the frontend's origin.

For Kubernetes access where the frontend is served via a NodePort on an unknown port:

```bash
# Get the NodePort
kubectl get service ammufoods-frontend-service
# PORT: 80:31234/TCP → http://localhost:31234

# Update the secret with the correct frontend URL
kubectl patch secret ammufoods-secret -p \
  '{"data":{"FRONTEND_URL":"'"$(echo -n "http://localhost:31234" | base64)"'"}}'

# Restart the backend to pick up the new value
kubectl rollout restart deployment/ammufoods-backend
```

---

## General Debugging Commands

```bash
# ── Pods ──
kubectl get pods                              # List all pods
kubectl get pods -w                           # Watch pod changes in real time
kubectl describe pod <name>                   # Full pod details + events
kubectl logs <pod-name>                       # Pod logs
kubectl logs <pod-name> --previous            # Logs from last terminated container
kubectl logs -l app=ammufoods-backend -f      # Follow logs from all backend pods
kubectl exec -it <pod-name> -- sh             # Shell into a running pod

# ── Deployments ──
kubectl get deployments                       # List deployments
kubectl describe deployment ammufoods-backend # Full deployment details
kubectl rollout status deployment/ammufoods-backend   # Check rollout progress
kubectl rollout history deployment/ammufoods-backend  # Rollout history
kubectl rollout undo deployment/ammufoods-backend     # Roll back

# ── Services ──
kubectl get services                          # List services
kubectl describe service ammufoods-backend-service

# ── Secrets ──
kubectl get secrets                           # List secrets
kubectl describe secret ammufoods-secret      # Show secret keys (not values)
kubectl get secret ammufoods-secret -o jsonpath='{.data.MONGO_URI}' | base64 --decode

# ── Events ──
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events --field-selector reason=BackOff

# ── Resource Usage ──
kubectl top pods                              # CPU/memory per pod (requires metrics-server)
kubectl top nodes                             # CPU/memory per node

# ── Health checks ──
kubectl exec curlpod -- curl -s http://ammufoods-backend-service:5000/api/health
kubectl exec curlpod -- curl -s http://ammufoods-backend-service:5000/metrics | head -10

# ── Port-forwarding ──
kubectl port-forward service/ammufoods-backend-service 5000:5000
kubectl port-forward service/ammufoods-frontend-service 8080:80
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```
