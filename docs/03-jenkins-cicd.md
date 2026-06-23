# AmmuFoods — Jenkins CI/CD Pipeline

## Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Pipeline Architecture](#pipeline-architecture)
- [Environment Variables](#environment-variables)
- [Parameters](#parameters)
- [Stage-by-Stage Breakdown](#stage-by-stage-breakdown)
- [Post Actions — Automatic Rollback](#post-actions--automatic-rollback)
- [Triple Tagging Strategy](#triple-tagging-strategy)
- [Credentials Setup](#credentials-setup)
- [Pipeline Flow Diagram](#pipeline-flow-diagram)
- [Running the Pipeline](#running-the-pipeline)

---

## Pipeline Overview

The AmmuFoods Jenkins pipeline is a **Declarative Pipeline** written in Groovy (Jenkinsfile). It runs on a Windows agent and performs the following sequence:

1. Verify tooling (Kubernetes, Docker, Git)
2. Capture build metadata (build number, git commit hash)
3. Build Docker images for backend and frontend
4. Security scan images with Trivy
5. Tag images with three identifiers (build number, git SHA, `latest`)
6. Push to Docker Hub
7. Deploy to Kubernetes via `kubectl set image`
8. Verify the deployment reached a healthy rollout state
9. Health check via a Kubernetes exec
10. Automatically rollback on any failure

It also supports a manual **ROLLBACK** path that verifies the target image exists in Docker Hub before applying it.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Jenkins Pipeline (Windows)                     │
│                                                                  │
│  Trigger: Manual (Build with Parameters)                        │
│                                                                  │
│  DEPLOY path:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Verify K8s → Verify Tools → Build Metadata              │   │
│  │    → Build Backend → Build Frontend                     │   │
│  │    → Trivy Scan → Tag Images → Docker Hub Login         │   │
│  │    → Push Backend → Push Frontend                       │   │
│  │    → Deploy to K8s → Verify Deployment → Health Check   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ROLLBACK path:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Verify K8s → Verify Tools → Rollback Deployment         │   │
│  │    → Verify Deployment                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ON FAILURE (any stage):                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ post { failure { kubectl set image → previous build } } │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```groovy
environment {
    DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
    BACKEND_IMAGE  = "sudharsanprakalathanvm/ammufoods-backend"
    FRONTEND_IMAGE = "sudharsanprakalathanvm/ammufoods-frontend"
}
```

These are pipeline-level constants. They define the Docker Hub image names used in every tag and push command. Using environment variables instead of hardcoding the image name means the repository URL only needs changing in one place.

`%BACKEND_IMAGE%` and `%FRONTEND_IMAGE%` are accessed in `bat` steps using Windows `%VAR%` syntax (not `$VAR` which is Linux shell syntax).

---

## Parameters

```groovy
parameters {
    choice(
        name: 'DEPLOY_ACTION',
        choices: ['DEPLOY', 'ROLLBACK'],
        description: 'Choose deployment action'
    )
    string(
        name: 'ROLLBACK_VERSION',
        defaultValue: '',
        description: 'Build number to rollback'
    )
}
```

The pipeline is triggered manually with two parameters:

| Parameter | Type | Purpose |
|---|---|---|
| `DEPLOY_ACTION` | Choice | `DEPLOY` = full CI/CD run. `ROLLBACK` = revert to a previous build. |
| `ROLLBACK_VERSION` | String | The Jenkins build number to roll back to. Only used when `DEPLOY_ACTION=ROLLBACK`. |

`when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }` gates most stages — they only execute on the DEPLOY path.

---

## Stage-by-Stage Breakdown

### Stage 1: Verify Kubernetes

```groovy
stage('Verify Kubernetes') {
    steps {
        bat 'kubectl version --client'
        bat 'kubectl get nodes'
    }
}
```

**Purpose:** Confirm that `kubectl` is installed on the Jenkins agent and can communicate with the cluster.

`kubectl version --client` — prints the kubectl client version without contacting the API server.  
`kubectl get nodes` — lists cluster nodes. If this succeeds, the agent has valid kubeconfig and cluster access. If the cluster is unreachable, the pipeline fails here early, before wasting time building images.

This stage runs on **both** DEPLOY and ROLLBACK paths because both need cluster access.

---

### Stage 2: Verify Tools

```groovy
stage('Verify Tools') {
    steps {
        bat 'git --version'
        bat 'docker --version'
    }
}
```

**Purpose:** Sanity-check that Git and Docker are available on the agent. Fails fast if the environment is missing tools before attempting any real work.

---

### Stage 3: Build Metadata

```groovy
stage('Build Metadata') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        script {
            env.GIT_COMMIT_SHORT = powershell(
                script: '(git rev-parse --short HEAD).Trim()',
                returnStdout: true
            ).trim()
        }
        echo "Build Number : ${env.BUILD_NUMBER}"
        echo "Git Commit   : ${env.GIT_COMMIT_SHORT}"
    }
}
```

**Purpose:** Capture two identifiers used to tag images — the Jenkins build number and the short git commit SHA.

`git rev-parse --short HEAD` — returns the first 7 characters of the current commit hash (e.g. `a3f5c12`). This is executed via PowerShell because the Jenkins agent is Windows. `.Trim()` removes any trailing whitespace or newlines.

`env.BUILD_NUMBER` is an automatic Jenkins variable — the sequential build counter (1, 2, 3...).

Both values are stored in pipeline environment variables so they are accessible in all subsequent stages.

Also computes `PREVIOUS_BUILD` in the Deploy To Kubernetes stage:

```groovy
if (env.BUILD_NUMBER.toInteger() > 1) {
    env.PREVIOUS_BUILD = (env.BUILD_NUMBER.toInteger() - 1).toString()
} else {
    env.PREVIOUS_BUILD = ''
}
```

`PREVIOUS_BUILD` is used by the `post { failure }` block to know which image to roll back to.

---

### Stage 4: Build Backend Image

```groovy
stage('Build Backend Image') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        dir('backend') {
            bat 'docker build -t ammu-backend:latest .'
        }
    }
}
```

**Purpose:** Build the backend Docker image from `backend/Dockerfile`.

`dir('backend')` changes the working directory to the `backend/` folder, which is the Docker build context. The image is tagged `ammu-backend:latest` as a local working name. Final versioned tags are applied in the Tag Images stage.

---

### Stage 5: Build Frontend Image

```groovy
stage('Build Frontend Image') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        dir('frontend') {
            bat '''
            docker build ^
            --build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api ^
            -t ammu-frontend:latest .
            '''
        }
    }
}
```

**Purpose:** Build the frontend Docker image with the Kubernetes in-cluster backend URL baked into the Vite bundle.

`^` is the Windows CMD line-continuation character (equivalent to `\` in bash).

`--build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api` — passes the Kubernetes service DNS name as the backend URL. This value is baked into the compiled JavaScript at build time. The URL `ammufoods-backend-service` is the name of the Kubernetes ClusterIP Service defined in `k8s/backend-service.yaml`.

---

### Stage 6: Verify Trivy

```groovy
stage('Verify Trivy') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        bat 'trivy --version'
    }
}
```

**Purpose:** Confirm Trivy is installed before attempting scans. Fails fast with a clear message rather than a cryptic "command not found" error inside the scan stage.

---

### Stage 7: Trivy Scan

```groovy
stage('Trivy Scan') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        bat '''
        trivy image --severity HIGH,CRITICAL --exit-code 0 ammu-backend:latest
        '''
        bat '''
        trivy image --severity HIGH,CRITICAL --exit-code 0 ammu-frontend:latest
        '''
    }
}
```

**Purpose:** Scan both images for known CVEs (Common Vulnerabilities and Exposures) in OS packages and application dependencies.

`--severity HIGH,CRITICAL` — only report HIGH and CRITICAL vulnerabilities to reduce noise.

`--exit-code 0` — the pipeline does **not** fail on findings. This is intentional: the scan is informational. Setting `--exit-code 1` would block deployments whenever a transitive dependency has an unpatched CVE, which can block legitimate deploys. The results are logged in the Jenkins console output for review.

In a production setup, `--exit-code 1` combined with `--ignore-unfixed` (to only fail on vulnerabilities with available fixes) is the recommended approach.

---

### Stage 8: Tag Images

```groovy
stage('Tag Images') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:latest'

        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:latest'
    }
}
```

**Purpose:** Apply three tags to each image for different use cases.

See [Triple Tagging Strategy](#triple-tagging-strategy) for the rationale.

---

### Stage 9: Docker Hub Login

```groovy
stage('Docker Hub Login') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'dockerhub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )
        ]) {
            writeFile file: 'docker_token.txt', text: env.DOCKER_PASS
            bat '''
                type docker_token.txt | docker login -u %DOCKER_USER% --password-stdin
            '''
            bat 'del docker_token.txt'
        }
    }
}
```

**Purpose:** Authenticate with Docker Hub using credentials stored in Jenkins Credentials Manager.

`withCredentials` — injects `DOCKER_USER` and `DOCKER_PASS` as environment variables within its block. They are masked in logs.

The token is written to a temporary file and piped to `docker login --password-stdin` rather than passing it directly on the command line (which would expose it in process lists). The file is immediately deleted after login.

`credentialsId: 'dockerhub-creds'` — this credential must be configured in **Jenkins → Manage Jenkins → Credentials** as a Username/Password credential with this exact ID.

---

### Stage 10 & 11: Push Backend / Frontend Images

```groovy
bat 'docker push %BACKEND_IMAGE%:%BUILD_NUMBER%'
bat 'docker push %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
bat 'docker push %BACKEND_IMAGE%:latest'
```

**Purpose:** Push all three tags to Docker Hub. Each push reuses the same image layers — Docker Hub deduplicates layers, so the actual data transferred is minimal for the second and third push.

---

### Stage 12: Deploy To Kubernetes

```groovy
stage('Deploy To Kubernetes') {
    steps {
        bat '''
        kubectl set image deployment/ammufoods-backend ^
        backend=%BACKEND_IMAGE%:%BUILD_NUMBER%
        '''
        bat '''
        kubectl set image deployment/ammufoods-frontend ^
        frontend=%FRONTEND_IMAGE%:%BUILD_NUMBER%
        '''
        bat 'kubectl rollout status deployment/ammufoods-backend'
        bat 'kubectl rollout status deployment/ammufoods-frontend'
    }
}
```

**Purpose:** Update the running Kubernetes deployments to use the newly built image.

`kubectl set image deployment/<name> <container>=<image>:<tag>` — patches the deployment's container image in place. Kubernetes begins a rolling update: it starts new pods with the new image while keeping old pods running until the new ones pass their readiness probe.

`kubectl rollout status` — blocks the pipeline until the rollout completes (all pods healthy) or times out. If the new pods crash or fail their readiness probe, `rollout status` returns a non-zero exit code, failing this stage and triggering the automatic rollback in `post { failure }`.

The image is tagged with `%BUILD_NUMBER%` (not `latest`) for precise traceability. Using `latest` for deployments is an anti-pattern because it makes it impossible to know exactly which build is running.

---

### Stage 13: Rollback Deployment

```groovy
stage('Rollback Deployment') {
    when { expression { params.DEPLOY_ACTION == 'ROLLBACK' } }
    steps {
        script {
            if (!params.ROLLBACK_VERSION?.trim()) {
                error("ROLLBACK_VERSION is required")
            }
        }
        bat '''
        docker manifest inspect sudharsanprakalathanvm/ammufoods-backend:%ROLLBACK_VERSION%
        '''
        bat '''
        kubectl set image deployment/ammufoods-backend ^
        backend=sudharsanprakalathanvm/ammufoods-backend:%ROLLBACK_VERSION%
        '''
        bat '''
        kubectl set image deployment/ammufoods-frontend ^
        frontend=sudharsanprakalathanvm/ammufoods-frontend:%ROLLBACK_VERSION%
        '''
        bat 'kubectl rollout status deployment/ammufoods-backend'
        bat 'kubectl rollout status deployment/ammufoods-frontend'
    }
}
```

**Purpose:** Manually revert Kubernetes to a specific previous build.

`docker manifest inspect` — verifies the target image exists in Docker Hub **before** attempting the rollback. If the image doesn't exist (e.g. typo in the build number), the stage fails with a clear error rather than applying a broken image reference to the cluster.

`error("ROLLBACK_VERSION is required")` — fails the stage with a meaningful message if the parameter was left empty.

---

### Stage 14: Verify Deployment

```groovy
bat 'kubectl get pods'
bat 'kubectl rollout status deployment/ammufoods-backend'
bat 'kubectl rollout status deployment/ammufoods-frontend'
bat 'kubectl get deployment'
```

**Purpose:** Final confirmation that both deployments are healthy after either a deploy or rollback. Prints pod state and deployment status to the Jenkins console for audit purposes.

---

### Stage 15: Health Check

```groovy
stage('Health Check') {
    when { expression { params.DEPLOY_ACTION == 'DEPLOY' } }
    steps {
        bat '''
        kubectl exec curlpod -- curl --fail http://ammufoods-backend-service:5000/api/health
        '''
        echo 'Application Health Check Passed'
    }
}
```

**Purpose:** Verify the backend is actually responding to requests from inside the cluster.

This uses a pre-existing pod named `curlpod` (a utility pod with `curl` installed) to make an HTTP request to the backend via the Kubernetes service DNS name `ammufoods-backend-service:5000`. This tests the full network path: DNS resolution → ClusterIP service → backend pod → Express handler → JSON response.

`--fail` — causes `curl` to return a non-zero exit code on HTTP error responses (4xx, 5xx), which would fail the Jenkins stage.

**Prerequisite:** The `curlpod` must already exist in the cluster. Create it with:
```bash
kubectl run curlpod --image=curlimages/curl --command -- sleep infinity
```

---

## Post Actions — Automatic Rollback

```groovy
post {
    failure {
        script {
            if (!env.PREVIOUS_BUILD?.trim()) {
                echo "No valid rollback version found. Skipping rollback."
            } else {
                echo "Rolling back to build ${env.PREVIOUS_BUILD}"
                bat """
                kubectl set image deployment/ammufoods-backend ^
                backend=sudharsanprakalathanvm/ammufoods-backend:${env.PREVIOUS_BUILD}
                """
                bat """
                kubectl set image deployment/ammufoods-frontend ^
                frontend=sudharsanprakalathanvm/ammufoods-frontend:${env.PREVIOUS_BUILD}
                """
                bat 'kubectl rollout status deployment/ammufoods-backend'
                bat 'kubectl rollout status deployment/ammufoods-frontend'
                echo "Rollback Completed"
            }
        }
    }
}
```

**Purpose:** If any stage fails during a DEPLOY run, automatically revert both Kubernetes deployments to the previous build number.

`PREVIOUS_BUILD` is computed as `BUILD_NUMBER - 1` in the Deploy To Kubernetes stage. If the pipeline fails before reaching that stage (e.g. during a Docker build), `PREVIOUS_BUILD` will be empty and the rollback is skipped with a clear message — there is no previously pushed image to roll back to.

If `PREVIOUS_BUILD` is set, Kubernetes rolls back both deployments and waits for the rollout to complete. The cluster is never left in a degraded state.

---

## Triple Tagging Strategy

Each successful build produces three tags per image:

| Tag | Example | Purpose |
|---|---|---|
| Build number | `ammufoods-backend:42` | **Primary deployment tag.** Precise, sequential, easy to reference in `ROLLBACK_VERSION`. |
| Git commit SHA | `ammufoods-backend:a3f5c12` | **Traceability.** Directly links the image to the exact commit. Useful for debugging. |
| `latest` | `ammufoods-backend:latest` | **Convenience.** Used for manual testing and as a default pull target. Never used for Kubernetes deployments. |

```
Build 42  (commit a3f5c12)
    │
    ├── ammufoods-backend:42        ← Kubernetes deployments use this
    ├── ammufoods-backend:a3f5c12   ← Links to git commit
    └── ammufoods-backend:latest    ← Convenience / manual use
```

---

## Credentials Setup

In Jenkins, configure the following credential:

| ID | Type | Purpose |
|---|---|---|
| `dockerhub-creds` | Username with password | Docker Hub login for pushing images |

**Steps:**
1. Jenkins → Manage Jenkins → Credentials → System → Global credentials
2. Add Credentials → Kind: Username with password
3. Username: `sudharsanprakalathanvm`
4. Password: Docker Hub access token (not account password)
5. ID: `dockerhub-creds`

---

## Pipeline Flow Diagram

```
Start
  │
  ▼
DEPLOY_ACTION?
  │
  ├─ DEPLOY ──────────────────────────────────────────────────────┐
  │                                                               │
  │   Verify K8s & Tools                                         │
  │        │                                                      │
  │        ▼                                                      │
  │   Build Metadata (BUILD_NUMBER, GIT_COMMIT_SHORT)            │
  │        │                                                      │
  │        ▼                                                      │
  │   Build Backend Image ─────── Build Frontend Image           │
  │   (docker build ./backend)    (--build-arg VITE_API_URL=...  │
  │        │                       docker build ./frontend)       │
  │        └──────────┬───────────────────────────┘              │
  │                   ▼                                           │
  │             Trivy Scan (non-blocking, exit-code 0)           │
  │                   │                                           │
  │                   ▼                                           │
  │             Tag Images (×3 each)                             │
  │                   │                                           │
  │                   ▼                                           │
  │             Docker Hub Login → Push Backend → Push Frontend   │
  │                   │                                           │
  │                   ▼                                           │
  │             kubectl set image (backend + frontend)            │
  │                   │                                           │
  │                   ▼                                           │
  │             kubectl rollout status ──── FAIL? ──► post{fail} │
  │                   │                              (auto-rollback)
  │                   ▼                                           │
  │             Verify Deployment                                 │
  │                   │                                           │
  │                   ▼                                           │
  │             Health Check (kubectl exec curlpod)              │
  │                   │                                           │
  │                   ▼                                           │
  │                SUCCESS                                        │
  └───────────────────────────────────────────────────────────────┘
  │
  └─ ROLLBACK ──────────────────────────────────────────────────┐
                                                                 │
     Verify K8s & Tools                                         │
          │                                                      │
          ▼                                                      │
     Validate ROLLBACK_VERSION is set                           │
          │                                                      │
          ▼                                                      │
     docker manifest inspect (verify image exists)             │
          │                                                      │
          ▼                                                      │
     kubectl set image (both deployments to ROLLBACK_VERSION)  │
          │                                                      │
          ▼                                                      │
     kubectl rollout status                                     │
          │                                                      │
          ▼                                                      │
     Verify Deployment                                          │
          │                                                      │
          ▼                                                      │
       SUCCESS                                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Running the Pipeline

### Trigger a deployment

1. Open Jenkins → AmmuFoods Pipeline → Build with Parameters
2. Set `DEPLOY_ACTION` = `DEPLOY`
3. Leave `ROLLBACK_VERSION` empty
4. Click Build

### Trigger a rollback

1. Open Jenkins → AmmuFoods Pipeline → Build with Parameters
2. Set `DEPLOY_ACTION` = `ROLLBACK`
3. Set `ROLLBACK_VERSION` = `41` (the build number to roll back to)
4. Click Build

### View build history

```bash
# From the Jenkins agent terminal
kubectl get pods
kubectl describe deployment ammufoods-backend
kubectl rollout history deployment/ammufoods-backend
```
