# it-works-on-my-machine

## Goals

- Deploy the service as a part of further microservices-based solution.
- Achieve zero-click deployment automation.
- Comprehensive CI/CD pipeline with automated testing and code quality gates.
- Reliable production deployment with rollback capabilities.

## Intentionally Out of Scope

Following features, required in the real world, were intentionally excluded because of complexity or just for time
saving, but may be implemented later keeping the current design:

- Support of different simultaneous feature builds of the service deployed in the development environment and multiple
  releases of the service deployed in the staging or production environments, Both features require
  service mesh or complicated deployments, which are beyond the scope of this assignment.
- Blue/Green or Canary deployments. Kubernetes deployments rolling out is sufficient for the current service to provide
  reliable deployments.
- Kubernetes infrastructure provisioning as IaC.
- Integration with other services for end-to-end tests on release deployment.
- New services onboarding automation.
- Release triggering automation.
- Fancy markdown for pipeline runs to represent results
- Custom GitHub Actions for CI/CD pipeline steps, using existing actions and run bash code instead.

## Architecture & Design

### Deployment Platform

The service is deployed as a Kubernetes Deployment, taking advantage of native features for scalability, reliability,
and observability.

- **Stateless** by design
- **Deployed using Helm** (chart included locally for demo)
- **GitOps-driven** rollout flow (e.g., ArgoCD, FluxCD-compatible)

Although in this demo the Helm chart is part of the repository, in production we recommend a centralized chart registry
for reusability.
> The Helm chart provided is very basic and clear example to demonstrate only CD-related features, not a full-fledged.
> It creates Kuberenets deployment with probes, no Ingress or Service resources, as they are not required for the demo.

### CI/CD & Promotion Flow

The service follows a Git-based promotion model:

```ascii
    +-------------+        Push        +------------------+
    | Developer   |------------------->|  feature/*       |
    +-------------+                    +------------------+
                                           | CI only
                                           v Code quality gates
     Merge PR into                     +------------- -----+
     develop                           |   develop        |
                                       +------------------+
                                           | Build, 
                                           v Dev deploy
     Release branch created            +------------------+
     from develop                      |  release/x.y.z   |
                                       +------------------+
                                           | Build,
                                           v Staging deploy
     Merge PR into                     +------------------+
     main                              |      main        |
                                       +------------------+
                                           | Tagging,
                                           v Production deploy
                                           
                                      GitOps/CD system
                                      updates cluster
```

## CI/CD Pipeline Logic

### GitHub Actions (CI)

- Code quality checks (lint, unit tests, coverage threshold)
- Docker build
- Push image to container registry
- Update GitOps deployment manifests per environment (per branch logic)
- Run integration tests

### GitOps-based CD

- Git is the source of truth for deployments
- ArgoCD/FluxCD watches the GitOps repo and syncs desired state
- Deployment is handled via standard Kubernetes `Deployment` mechanics

> Rely on Kubernetes native rollout strategies (rolling update, readiness probes, health checks) for safe delivery.

## Repository & Branching Strategy

### Repository Layout

A **composite (monolith per service) repository** is used, combining:

- Application code
- Helm chart (for test assignment, in production use a centralized chart registry)
- GitOps deployment manifests

> Why: repository which combines both service code and its GitOps configuration per service
> - makes CI/CD pipelines simpler, allows build and deploy by one pipeline run
> - avoids build queuing and merge conflicts in GitOps manifests on parallel services builds
>
> For real projects pure monorepo or spited repo approach may be used depending on the project size and complexity.

### Branching Model

GitFlow model is used:

- `feature/*` — Feature development (CI only)
- `develop` — Integrated Dev testing (CI + Dev deployment)
- `release/*` — Pre-production QA (Staging deployment)
- `hotfix/*` — Urgent fixes (Staging + Prod deployment)
- `main` — Production-ready releases (Production deployment)

> Why: This model:
> - Well reflects the promotion flow chosen (see below)
> - May be easily extend to support multiple feature version deployed to dev and multiple releases deployed to
    staging/prod in the future

## Promotion Flow

- Developers work on features in `feature/*` branches, triggering CI checks
- Once a feature is ready, it is merged into `develop` and deployed to the development environment for integration
  testing
- New release branches (`release/x.y.z`) are cut from `develop` for staging QA
- On approval, merged into `main` to trigger production deployment
- Production releases are tagged (e.g., `v1.2.3`) and synced to cluster via GitOps
- Hotfixes follow a similar flow via `hotfix/*` → `main` with intermediate staging deployment for testing

## Versioning Strategy

Composite strategy combining Git semantics and `package.json`:

- Dev builds: tagged with short commit SHA (`dev-<sha>`)
- Releases candidates: versioned by branch name and rc autoincrement (e.g., `release/1.2.3-rc1`)
- On merge to `main`:
    - `package.json` version updated with release version (e.g., `1.2.3`)
    - Git tag `v1.2.3` created
- Hotfixes update `package.json` and create tags similarly

> Why:
> - Using sha1 tagging fo dev builds allows to avoid noise in the repository with build numbers and provides
    traceability
> - Using `package.json` versioning for releases allows to use standard npm versioning and
    semantic versioning, which is widely used in the Node.js ecosystem

## Quality Gates

Code quality checks are enforced or recommended at various stages:

- ✅ Lint (ESLint or equivalent)
- ✅ Code formatting
- ✅ Dependency security checks
- ✅ Unit & integration tests
- ✅ Test coverage threshold
- ✅ Image vulnerability scanning

> The strategy starts with fewer restrictions during early development and gradually increases enforcement as code is
> promoted to higher environments.

## Rollback Strategy

Kubernetes Deployment resources are configured with:

- **Rolling updates** (default)
- **Readiness/liveness probes** for health validation
- **Rollback on failure** via post-deployment tests
- Manual rollback is possible by reverting GitOps image tag to a previous version

## 🔐 Secrets & Configuration

Secrets and environment-specific configuration are **not hardcoded**. In these would be managed via:

- GitHub Actions Secrets for CI/CD
- Kubernetes Secrets (possible with Vault operator or similar solutions) for deployed infrastructure and applications

## Source Code Improvements/Changes

### Dockerfile

```Dockerfile
COPY package*.json ./
RUN npm ci --only=production

COPY server.js .
```

- package-lock.json added to ensure consistent dependencies
- `npm ci` used for production builds to ensure a clean installation of dependencies.
- `COPY server.js .` added to copy the main application file into the image to avoid accidental addition of unnecessary
  files

### Dependencies

Dependabot added it to the repository to ensure dependencies are up-to-date safely

### Tests

Very basic unit test added to use with Code Quality Gates

### Health Checks

Added basic HTTP health checks (/health) to the Kubernetes Deployment to ensure the service is running and responsive.
Configured the Deployment with a RollingUpdate strategy for safe and zero-downtime upgrades.

## GitHub Organization/Repo configuration

## Summary

This project showcases:

- GitHub Actions CI integrated with GitOps CD
- A realistic branching and promotion model
- Standardized release/versioning flow
- Kubernetes-native deployment strategies
- Clear separation of dev/staging/prod environments

While scoped down, the approach is **modular, scalable, and production-aware** — a solid starting point for a full
microservice platform.

## Local Kubernetes deployment

You can test the deployment locally using following:

- Install local Kubernetes cluster, activating Kubernetes in Docker Desktop or using Minikube
- Install Helm (brew install helm for MacOS)
- Pull the repository
- Run the following commands from the root of the repository:

```bash
helm upgrade --install it-works-on-my-machine  ./deploy/charts/app -f ./deploy/environments/dev/values.yaml

kubectl get pods
NAME                                     READY   STATUS    RESTARTS   AGE
it-works-on-my-machine-fcbcb5b88-8l6nt   1/1     Running   0          51m
it-works-on-my-machine-fcbcb5b88-g75ph   1/1     Running   0          51m
it-works-on-my-machine-fcbcb5b88-tcx29   1/1     Running   0          51m
```
- Use `kubectl port-forward` to access the service locally:

```bash
kubectl port-forward it-works-on-my-machine-fcbcb5b88-8l6nt 3000:3000
curl localhost:3000/health
Still working... on *my* machine 🧃
```

## Afterparty Backlog

- [ ] Rewrite Bash sections with custom GitHub Actions
- [ ] Add service to Helm chart to make local testing easier
- [ ] Replace more hardcoded values with GitHub Actions Variables