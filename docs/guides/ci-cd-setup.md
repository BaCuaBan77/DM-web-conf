# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for automated testing and Docker image deployment.

### Workflows

1. **Test Suite** (`test.yml`) - Runs on every commit
2. **Docker Build & Push** (`docker-build-push.yml`) - Runs on push to main

---

## Test Suite Workflow

### Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

#### 1. Backend Tests
- **Environment**: Ubuntu latest, JDK 17
- **Actions**:
  - Checkout code
  - Set up Java with Maven caching
  - Run `mvn clean test -s settings.xml`
  - Generate JUnit test reports
  - Upload coverage reports

#### 2. Frontend Unit Tests
- **Environment**: Ubuntu latest, Node.js 20.18.3
- **Actions**:
  - Checkout code
  - Set up Node.js with npm caching
  - Install dependencies
  - Run `npm test`
  - Generate coverage reports
  - Upload coverage artifacts

#### 3. Frontend E2E Tests
- **Environment**: Ubuntu latest, Node.js 20.18.3, JDK 17
- **Actions**:
  - Checkout code
  - Set up Node.js and Java
  - Install dependencies and Playwright
  - Start backend server (port 8080)
  - Start frontend server (port 3000)
  - Run Playwright E2E tests
  - Upload Playwright reports
  - Stop servers

#### 4. Integration Tests
- **Environment**: Ubuntu latest, JDK 17
- **Actions**:
  - Run backend integration and E2E tests
  - Upload test results

#### 5. Code Quality Checks
- **Environment**: Ubuntu latest, Node.js 20.18.3, JDK 17
- **Actions**:
  - TypeScript compilation check
  - Java compilation check

#### 6. Test Summary
- **Dependencies**: All above jobs
- **Actions**:
  - Aggregate test results
  - Fail if any job failed
  - Display summary

### Test Coverage

Test reports and coverage are uploaded as artifacts:
- `backend-coverage` - Backend JaCoCo reports
- `frontend-coverage` - Frontend coverage reports
- `playwright-report` - E2E test reports
- `integration-test-results` - Integration test results

---

## Docker Build & Push Workflow

### Triggers

- Push to `main` branch
- Tags matching `v*.*.*` (e.g., v1.0.0)
- Manual trigger via `workflow_dispatch`

### Jobs

#### 1. Build and Push
- **Environment**: Ubuntu latest with Docker Buildx
- **Actions**:
  - Checkout code
  - Set up Docker Buildx
  - Log in to Docker Hub
  - Extract metadata (tags, labels)
  - Build and push backend image
  - Build and push frontend image
  - Generate deployment summary

#### 2. Update docker-compose
- **Dependencies**: Build and Push
- **Actions**:
  - Update docker-compose.yml with published images
  - Create PR with changes

#### 3. Deployment Notification
- **Dependencies**: Build and Push
- **Actions**:
  - Display deployment status
  - List published images

### Docker Image Tags

Images are tagged with:
- `latest` - Latest build from main branch
- `main` - Main branch builds
- `main-<sha>` - Git commit SHA
- `v1.2.3` - Semantic version (if tagged)
- `1.2` - Major.minor version

### Docker Images

Published to Docker Hub:
- `<username>/dm-conf-backend:latest`
- `<username>/dm-conf-frontend:latest`

---

## Setup Instructions

### Prerequisites

1. GitHub repository with the project
2. Docker Hub account

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `myusername` |
| `DOCKER_PASSWORD` | Your Docker Hub access token | `dckr_pat_...` |

**Creating Docker Hub Access Token:**

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Name: `github-actions`
5. Permissions: Read, Write, Delete
6. Copy the token and add to GitHub secrets

### Step 2: Enable GitHub Actions

1. Go to your repository
2. Click "Actions" tab
3. If prompted, enable GitHub Actions

### Step 3: Push Workflows

The workflows are already in `.github/workflows/`:
- `test.yml`
- `docker-build-push.yml`

Push them to your repository:

```bash
git add .github/workflows/
git commit -m "ci: add GitHub Actions workflows"
git push origin main
```

### Step 4: Verify Workflows

1. Go to Actions tab in your GitHub repository
2. You should see:
   - "Test Suite" workflow running
   - "Build and Push Docker Images" workflow running
3. Click on a workflow to see details

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![Test Suite](https://github.com/<username>/<repo>/actions/workflows/test.yml/badge.svg)](https://github.com/<username>/<repo>/actions/workflows/test.yml)
[![Docker Build](https://github.com/<username>/<repo>/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/<username>/<repo>/actions/workflows/docker-build-push.yml)
```

Replace `<username>` and `<repo>` with your GitHub username and repository name.

---

## Deployment

### Pulling Docker Images

After a successful build, pull the images:

```bash
docker pull <your-username>/dm-conf-backend:latest
docker pull <your-username>/dm-conf-frontend:latest
```

### Using Published Images

**Option 1: Update docker-compose.yml manually**

```yaml
services:
  backend:
    image: <your-username>/dm-conf-backend:latest
    # Remove 'build: ./backend'
    
  frontend:
    image: <your-username>/dm-conf-frontend:latest
    # Remove 'build: ./frontend'
```

**Option 2: Use the auto-generated PR**

The workflow creates a PR with updated docker-compose.yml. Review and merge it.

### Deploy with Docker Compose

```bash
docker-compose pull
docker-compose up -d
```

---

## Monitoring Workflows

### View Workflow Runs

1. Go to Actions tab
2. Select a workflow (Test Suite or Docker Build)
3. Click on a run to see details
4. View logs for each job

### Download Artifacts

1. Go to a completed workflow run
2. Scroll to "Artifacts" section
3. Download:
   - Test coverage reports
   - Playwright reports
   - Integration test results

### Troubleshooting Failed Workflows

**Backend Tests Failing:**
```bash
# Check the job logs
# Common issues:
# - Maven dependency resolution (check settings.xml)
# - Test data files missing
# - Java version mismatch
```

**Frontend Tests Failing:**
```bash
# Common issues:
# - Node version mismatch
# - npm dependencies not cached properly
# - E2E tests timing out (increase timeout)
```

**Docker Build Failing:**
```bash
# Common issues:
# - Docker Hub credentials incorrect
# - Dockerfile syntax errors
# - Build context issues
```

---

## Advanced Configuration

### Customize Test Triggers

Edit `.github/workflows/test.yml`:

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]  # Add more branches
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sunday
```

### Customize Docker Tags

Edit `.github/workflows/docker-build-push.yml`:

```yaml
tags: |
  type=raw,value=stable,enable={{is_default_branch}}
  type=raw,value=dev,enable=${{ github.ref == 'refs/heads/develop' }}
  type=semver,pattern={{version}}
```

### Add Slack Notifications

Add to end of workflow:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Workflow ${{ github.workflow }} completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Matrix Testing

Test multiple versions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [17, 18, 19]
        node: [18, 20]
    steps:
      - uses: actions/setup-java@v3
        with:
          java-version: ${{ matrix.java }}
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
```

---

## Best Practices

### 1. Protect Main Branch

GitHub Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select: All workflow checks

### 2. Use Pull Requests

- Never push directly to main
- Create feature branches
- Open PR for review
- Wait for CI to pass
- Merge when approved

### 3. Semantic Versioning

Tag releases:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This triggers Docker build with version tags.

### 4. Cache Dependencies

Workflows already cache:
- Maven dependencies
- npm packages
- Docker layers

### 5. Monitor Build Times

- Keep workflows under 10 minutes
- Use caching effectively
- Parallelize independent jobs

---

## Security Considerations

### Secrets Management

- ✅ Use GitHub Secrets for sensitive data
- ❌ Never commit credentials to code
- ✅ Rotate Docker Hub tokens regularly
- ✅ Use least-privilege access tokens

### Workflow Permissions

Default permissions are read-only. Workflows use:
- `actions/checkout` - Read repository
- `docker/login-action` - Use secrets
- `peter-evans/create-pull-request` - Create PRs

### Dependency Security

Enable Dependabot:

1. Settings → Security → Dependabot
2. Enable Dependabot alerts
3. Enable Dependabot security updates

---

## Costs

GitHub Actions:
- **Free tier**: 2,000 minutes/month for private repos
- **Public repos**: Unlimited

Each workflow run typically uses:
- Test Suite: ~10-15 minutes
- Docker Build: ~5-10 minutes

Monitor usage: Settings → Billing → Actions usage

---

## Support

### GitHub Actions Documentation

- [GitHub Actions](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Docker build and push](https://github.com/marketplace/actions/build-and-push-docker-images)

### Troubleshooting

**Issue**: Workflow not triggering
- Check branch name in trigger
- Verify .github/workflows/ path
- Check GitHub Actions is enabled

**Issue**: Docker push unauthorized
- Verify DOCKER_USERNAME secret
- Verify DOCKER_PASSWORD is an access token (not password)
- Check token permissions

**Issue**: Tests passing locally but failing in CI
- Check Node/Java versions match
- Verify all dependencies in package.json/pom.xml
- Check environment variables

---

## Example Workflow Run

```
✅ Test Suite
  ├─ ✅ Backend Tests (3m 45s)
  ├─ ✅ Frontend Unit Tests (2m 12s)
  ├─ ✅ Frontend E2E Tests (5m 33s)
  ├─ ✅ Integration Tests (4m 21s)
  ├─ ✅ Code Quality Checks (1m 48s)
  └─ ✅ Test Summary (5s)

✅ Build and Push Docker Images
  ├─ ✅ Build and Push (6m 12s)
  │  ├─ Backend: dm-conf-backend:latest
  │  └─ Frontend: dm-conf-frontend:latest
  ├─ ✅ Update docker-compose (22s)
  └─ ✅ Deployment Notification (8s)
```

---

For more information, see the [GitHub Actions Documentation](https://docs.github.com/en/actions).

