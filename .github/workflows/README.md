# GitHub Actions Workflows

This directory contains CI/CD automation workflows for the Device Manager Web Configuration project.

## Workflows

### 1. Test Suite (`test.yml`)

**Purpose**: Run comprehensive tests on every commit

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
1. **Backend Tests** - Maven/JUnit tests
2. **Frontend Unit Tests** - Vitest/React Testing Library
3. **Frontend E2E Tests** - Playwright browser tests
4. **Integration Tests** - Full workflow tests
5. **Code Quality** - TypeScript/Java compilation
6. **Test Summary** - Aggregate results

**Artifacts**:
- Backend coverage reports
- Frontend coverage reports
- Playwright E2E reports
- Integration test results

---

### 2. Docker Build & Push (`docker-build-push.yml`)

**Purpose**: Build and publish Docker images to Docker Hub

**Triggers**:
- Push to `main` branch
- Version tags (`v*.*.*`)
- Manual workflow dispatch

**Jobs**:
1. **Build and Push** - Create and publish Docker images
   - `<username>/dm-conf-backend:latest`
   - `<username>/dm-conf-frontend:latest`
2. **Update docker-compose** - Create PR with image refs
3. **Deployment Notification** - Status summary

**Image Tags**:
- `latest` - Latest main branch
- `main` - Main branch builds
- `main-<sha>` - Git commit SHA
- `v1.2.3` - Semantic versions
- `1.2` - Major.minor

---

## Setup

### Prerequisites

1. GitHub repository
2. Docker Hub account

### Configuration

**Required Secrets** (GitHub Settings → Secrets → Actions):

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token (not password) |

### Creating Docker Hub Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Account Settings → Security → New Access Token
3. Name: `github-actions`
4. Permissions: Read, Write, Delete
5. Copy token → Add to GitHub Secrets

---

## Usage

### Running Tests Automatically

Tests run automatically on:
- Every push to main/develop
- Every pull request

No manual action required.

### Building Docker Images

Images build automatically on:
- Push to main branch
- Creating version tags

**Manual trigger**:
1. Go to Actions tab
2. Select "Build and Push Docker Images"
3. Click "Run workflow"

### Pulling Published Images

```bash
docker pull <your-username>/dm-conf-backend:latest
docker pull <your-username>/dm-conf-frontend:latest
```

---

## Workflow Status

Check workflow status:
- GitHub repository → Actions tab
- View individual workflow runs
- Download artifacts

### Status Badges

Add to README.md:

```markdown
[![Test Suite](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml)
[![Docker Build](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/docker-build-push.yml)
```

---

## Troubleshooting

### Tests Failing

**Backend**:
- Check Java version (17)
- Verify Maven settings.xml
- Check test data files

**Frontend**:
- Check Node version (20.18.3)
- Verify dependencies installed
- Check Playwright browsers installed

**E2E**:
- Backend must start on port 8080
- Frontend must start on port 3000
- Increase timeout if needed

### Docker Build Failing

**Common Issues**:
- Docker Hub credentials incorrect
- Secrets not configured
- Dockerfile syntax errors
- Network timeouts

**Solutions**:
- Verify DOCKER_USERNAME secret
- Verify DOCKER_PASSWORD is token (not password)
- Check Dockerfile syntax locally
- Re-run workflow

---

## Local Testing

Test workflows locally before pushing:

**Backend**:
```bash
cd backend
mvn clean test -s settings.xml
```

**Frontend Unit**:
```bash
cd frontend
npm test
```

**Frontend E2E**:
```bash
cd frontend
npm run test:e2e
```

**Docker Build**:
```bash
docker build -t dm-conf-backend ./backend
docker build -t dm-conf-frontend ./frontend
```

---

## Advanced Configuration

### Custom Branches

Edit workflow triggers:

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
```

### Scheduled Tests

Add cron schedule:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

### Slack Notifications

Add notification step (requires SLACK_WEBHOOK secret):

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Documentation

📖 **Complete Guide**: [CI/CD Setup Guide](../../docs/guides/ci-cd-setup.md)

Includes:
- Detailed setup instructions
- Configuration options
- Best practices
- Security considerations
- Troubleshooting guide

---

## Support

**Issues**: Check [GitHub Actions Documentation](https://docs.github.com/en/actions)

**Questions**: See project documentation in `docs/` directory

