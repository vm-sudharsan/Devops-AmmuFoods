# AmmuFoods — Monitoring with Prometheus and Grafana

## Table of Contents

- [Overview](#overview)
- [Metrics Architecture](#metrics-architecture)
- [prom-client Integration](#prom-client-integration)
- [metrics.routes.js Explained](#metricsroutesjs-explained)
- [How app.js Registers the Metrics Endpoint](#how-appjs-registers-the-metrics-endpoint)
- [Kubernetes Pod Annotations for Prometheus](#kubernetes-pod-annotations-for-prometheus)
- [Installing Prometheus on Kubernetes](#installing-prometheus-on-kubernetes)
- [Configuring Prometheus Scraping](#configuring-prometheus-scraping)
- [Installing Grafana on Kubernetes](#installing-grafana-on-kubernetes)
- [Grafana Datasource Setup](#grafana-datasource-setup)
- [Grafana Dashboard Creation](#grafana-dashboard-creation)
- [Available Metrics](#available-metrics)
- [Accessing the UIs](#accessing-the-uis)

---

## Overview

The AmmuFoods backend exposes application and runtime metrics via the industry-standard Prometheus exposition format. Prometheus scrapes these metrics on a schedule, stores them as time-series data, and Grafana visualises them as dashboards.

```
┌──────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                           │
│                                                              │
│  AmmuFoods Backend Pod                                       │
│  ┌────────────────────────────────┐                         │
│  │  prom-client                   │                         │
│  │  collectDefaultMetrics()       │ ──► GET /metrics        │
│  │  (CPU, memory, event loop...)  │        │                │
│  └────────────────────────────────┘        │                │
│                                            │ scrape          │
│                            ┌───────────────▼────────────┐   │
│                            │        Prometheus           │   │
│                            │   (time-series database)    │   │
│                            └───────────────┬────────────┘   │
│                                            │ PromQL query    │
│                            ┌───────────────▼────────────┐   │
│                            │          Grafana            │   │
│                            │      (visualisation)        │   │
│                            └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Metrics Architecture

### How Prometheus works (pull model)

Prometheus uses a **pull** model — it reaches out to your application's `/metrics` endpoint on a schedule (default: every 15 seconds) and stores the returned data. This is the opposite of a push model where your application sends data to a collector.

```
Every 15 seconds:
  Prometheus ──HTTP GET──► http://<pod-ip>:5000/metrics
                ◄─────────── prom-client response (text/plain)

  Prometheus parses and stores:
  process_cpu_user_seconds_total{} 0.046875 1735000000000
  nodejs_heap_size_used_bytes{} 12345678 1735000000000
  ...
```

### Why /metrics is placed before the rate limiter

In `backend/src/app.js`:

```js
// ── Prometheus metrics (before rate limiter — internal scraping only) ──
app.use("/metrics", metricsRoutes);

// ── Rate limiting ──
app.use(apiLimiter);
```

Prometheus scrapes every 15 seconds from every pod. With 2 replicas, that is 2 requests every 15 seconds — 8 per minute — from a single IP (the Prometheus pod). The default rate limiter is configured to allow 100 requests per 15 minutes. This would cause Prometheus to be rate-limited within 12 minutes of the pod starting, resulting in scrape failures and gaps in metrics.

By placing the metrics route **before** `apiLimiter`, Prometheus scrapes bypass the rate limiter entirely. This is safe because `GET /metrics` is a read-only endpoint that exposes no sensitive business data.

---

## prom-client Integration

**Package:** `prom-client@^15.1.3` (listed in `backend/package.json`)

`prom-client` is the official Prometheus client library for Node.js. It:
- Collects Node.js runtime metrics automatically (CPU, memory, GC, event loop)
- Provides a registry to collect and format metrics
- Exposes metrics in Prometheus text exposition format

---

## metrics.routes.js Explained

**File:** `backend/src/routes/metrics.routes.js`

```js
const express = require("express");
const client = require("prom-client");

const router = express.Router();
```
Standard Express router setup. `client` is the entire prom-client library, which includes the metric registry, default metrics collection, and the contentType string.

```js
client.collectDefaultMetrics({ register: client.register });
```
Enables collection of all default Node.js metrics. This single call instruments:
- CPU usage (`process_cpu_user_seconds_total`, `process_cpu_system_seconds_total`)
- Memory usage (`process_resident_memory_bytes`, `nodejs_heap_size_total_bytes`, `nodejs_heap_size_used_bytes`, `nodejs_external_memory_bytes`)
- Event loop lag (`nodejs_eventloop_lag_seconds`, `nodejs_eventloop_lag_min_seconds`, `nodejs_eventloop_lag_max_seconds`)
- Active handles and requests (`nodejs_active_handles_total`, `nodejs_active_requests_total`)
- Garbage collection (`nodejs_gc_duration_seconds`)
- File descriptors (`process_open_fds`, `process_max_fds`)
- Version info (`nodejs_version_info`)

`{ register: client.register }` — passes the default global registry explicitly. This prevents a `duplicate metric` error if the module is required more than once (e.g. during Jest tests), because prom-client checks the registry before registering a metric.

```js
router.get("/", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});
```

`res.set("Content-Type", client.register.contentType)` — sets the `Content-Type` header to `text/plain; version=0.0.4; charset=utf-8`. Prometheus requires this exact content type to parse the response correctly. If the wrong content type is returned, Prometheus marks the scrape as failed.

`await client.register.metrics()` — asynchronously serialises all registered metrics into the Prometheus text format. The `async/await` is required because prom-client's registry serialisation is asynchronous.

`res.end()` instead of `res.send()` — avoids any additional processing by Express's response methods, ensuring the raw metric string is returned exactly as prom-client produces it.

```js
module.exports = router;
```
The route is mounted at `/metrics` in `app.js`, so the full path is `GET http://<host>:5000/metrics`.

---

## How app.js Registers the Metrics Endpoint

```js
// backend/src/app.js
const metricsRoutes = require("./routes/metrics.routes");

// ── Prometheus metrics (before rate limiter — internal scraping only) ──
app.use("/metrics", metricsRoutes);
```

The router is mounted at `/metrics`. Since the router internally handles `GET /`, the full endpoint is `GET /metrics`. This is the URL Prometheus scrapes.

---

## Kubernetes Pod Annotations for Prometheus

**File:** `k8s/backend-deployment.yaml`

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

These three annotations on the **pod template** (not the deployment metadata) enable Prometheus's Kubernetes service discovery to automatically find and scrape the backend pods.

| Annotation | Value | Meaning |
|---|---|---|
| `prometheus.io/scrape` | `"true"` | Opt this pod into Prometheus scraping |
| `prometheus.io/path` | `"/metrics"` | The HTTP path to scrape |
| `prometheus.io/port` | `"5000"` | The port to scrape on |

When Prometheus's `kubernetes_sd_configs` scans pods, it reads these annotations and adds matching pods to its scrape targets. Without `prometheus.io/scrape: "true"`, the pod is ignored.

---

## Installing Prometheus on Kubernetes

The recommended approach for a Kubernetes-native setup is the **kube-prometheus-stack** Helm chart, which installs Prometheus, Grafana, and pre-built Kubernetes dashboards together.

```bash
# Add the Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install the kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Check all pods are running
kubectl get pods -n monitoring
```

Expected output includes:
```
prometheus-kube-prometheus-prometheus-0        2/2   Running
prometheus-grafana-<hash>                      3/3   Running
prometheus-kube-state-metrics-<hash>           1/1   Running
prometheus-prometheus-node-exporter-<hash>     1/1   Running
alertmanager-prometheus-kube-prometheus-alertmanager-0  2/2   Running
```

---

## Configuring Prometheus Scraping

The `kube-prometheus-stack` includes a default configuration that discovers pods using the `prometheus.io/*` annotations. This configuration is part of the Prometheus Operator's default `ServiceMonitor` resources.

### Verify scrape targets

```bash
# Port-forward Prometheus UI
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open http://localhost:9090
# Navigate to Status → Targets
# Look for ammufoods-backend pods in the target list
```

Prometheus targets should show:
```
http://<pod-ip>:5000/metrics    State: UP    Labels: app="ammufoods-backend"
```

### Manual scrape config (if not using kube-prometheus-stack)

If running standalone Prometheus, add this to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ammufoods-backend'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: "true"
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

---

## Installing Grafana on Kubernetes

Grafana is included in the `kube-prometheus-stack` installation above. To install standalone:

```bash
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword='your-admin-password'
```

---

## Grafana Datasource Setup

After installing Grafana, configure the Prometheus datasource:

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Default credentials: admin / prom-operator (kube-prometheus-stack default)

# OR get the password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

**In the Grafana UI:**

1. Navigate to **Connections → Data Sources → Add data source**
2. Select **Prometheus**
3. Set the URL to:
   - If Grafana is in the same namespace as Prometheus: `http://prometheus-kube-prometheus-prometheus:9090`
   - If port-forwarding: `http://localhost:9090`
4. Click **Save & Test** — should show "Data source is working"

---

## Grafana Dashboard Creation

### Import a pre-built Node.js dashboard

The fastest way to get useful dashboards is to import community dashboards from Grafana's dashboard repository.

1. In Grafana, navigate to **Dashboards → Import**
2. Enter Dashboard ID: **11159** (Node.js Application Dashboard)
3. Select your Prometheus datasource
4. Click **Import**

This dashboard shows CPU usage, memory, event loop lag, and active handles — all metrics collected by `prom-client`'s `collectDefaultMetrics()`.

### Create a custom dashboard

**Example: Backend Request Rate panel**

1. Dashboards → New → New Dashboard → Add visualisation
2. Select Prometheus datasource
3. In the PromQL query field:
   ```promql
   rate(http_requests_total{job="ammufoods-backend"}[5m])
   ```
4. Set the panel title to "Request Rate (5m avg)"

> **Note:** `http_requests_total` is a custom counter that would need to be added to the application. The current `collectDefaultMetrics()` call does not include HTTP request metrics automatically. To add them, use `prom-client`'s Counter or Histogram in the route handlers.

### Useful PromQL queries for the default metrics

```promql
# CPU usage (user space) per second
rate(process_cpu_user_seconds_total[1m])

# Heap memory used (bytes)
nodejs_heap_size_used_bytes

# Heap memory used as percentage of total
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# Event loop lag in milliseconds
nodejs_eventloop_lag_seconds * 1000

# Garbage collection duration (per type, rate per minute)
rate(nodejs_gc_duration_seconds_count[1m])

# Process uptime in hours
time() - process_start_time_seconds / 3600

# Number of active handles (file descriptors, network connections)
nodejs_active_handles_total
```

### Dashboard panels recommended for AmmuFoods

| Panel | Metric | Type |
|---|---|---|
| CPU Usage % | `rate(process_cpu_user_seconds_total[1m]) * 100` | Time series |
| Heap Used | `nodejs_heap_size_used_bytes` | Gauge |
| Heap Used % | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100` | Gauge |
| Event Loop Lag | `nodejs_eventloop_lag_seconds * 1000` | Time series |
| GC Runs/min | `rate(nodejs_gc_duration_seconds_count[1m])` | Time series |
| Active Handles | `nodejs_active_handles_total` | Stat |
| Process Uptime | `time() - process_start_time_seconds` | Stat |
| RSS Memory | `process_resident_memory_bytes / 1024 / 1024` | Time series |

---

## Available Metrics

All metrics exposed by `prom-client collectDefaultMetrics()`:

```
# CPU
process_cpu_user_seconds_total
process_cpu_system_seconds_total
process_cpu_seconds_total

# Memory
process_resident_memory_bytes
process_virtual_memory_bytes
process_heap_bytes
nodejs_heap_size_total_bytes
nodejs_heap_size_used_bytes
nodejs_external_memory_bytes
nodejs_heap_space_size_total_bytes
nodejs_heap_space_size_used_bytes
nodejs_heap_space_size_available_bytes

# Event Loop
nodejs_eventloop_lag_seconds
nodejs_eventloop_lag_min_seconds
nodejs_eventloop_lag_max_seconds
nodejs_eventloop_lag_mean_seconds
nodejs_eventloop_lag_stddev_seconds
nodejs_eventloop_lag_p50_seconds
nodejs_eventloop_lag_p90_seconds
nodejs_eventloop_lag_p99_seconds

# GC
nodejs_gc_duration_seconds

# Handles / Requests
nodejs_active_handles_total
nodejs_active_requests_total

# File Descriptors
process_open_fds
process_max_fds

# Process Info
process_start_time_seconds
nodejs_version_info
```

### Test the endpoint manually

```bash
# From outside the cluster (port-forwarded)
kubectl port-forward service/ammufoods-backend-service 5000:5000
curl http://localhost:5000/metrics

# From inside the cluster (curlpod)
kubectl exec curlpod -- curl http://ammufoods-backend-service:5000/metrics
```

Example output:
```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.046875

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 12345678

# HELP nodejs_eventloop_lag_seconds Lag of event loop in seconds.
# TYPE nodejs_eventloop_lag_seconds gauge
nodejs_eventloop_lag_seconds 0.000234
```

---

## Accessing the UIs

### Prometheus

```bash
kubectl port-forward -n monitoring \
  svc/prometheus-kube-prometheus-prometheus 9090:9090
```
Open: `http://localhost:9090`

Useful pages:
- **Status → Targets** — verify AmmuFoods pods are being scraped
- **Graph** — run PromQL queries
- **Status → Configuration** — view active scrape config

### Grafana

```bash
kubectl port-forward -n monitoring \
  svc/prometheus-grafana 3000:80
```
Open: `http://localhost:3000`

Default credentials with `kube-prometheus-stack`:
- Username: `admin`
- Password: retrieve with `kubectl get secret`
