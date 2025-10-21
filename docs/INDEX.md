# Documentation Index

Welcome to the Device Manager Web Configuration documentation!

## 📖 Quick Navigation

### Getting Started

- **[Quick Start Guide](guides/quick-start-guide.md)** - Get up and running in 5 minutes
  - Installation prerequisites
  - Running the application
  - Basic usage tutorial
  - Common tasks
  - Troubleshooting

### Development

- **[Development Guide](guides/development-guide.md)** - Complete developer documentation
  - Environment setup
  - Project structure
  - Development workflow
  - Testing
  - Contributing guidelines

- **[CI/CD Setup Guide](guides/ci-cd-setup.md)** - GitHub Actions automation
  - Automated testing on every commit
  - Docker image building and publishing
  - Deployment workflows
  - Setup instructions

### Technical Reference

- **[API Documentation](API.md)** - REST API reference
  - All endpoints documented
  - Request/response examples
  - Validation rules
  - cURL examples

- **[Features](FEATURES.md)** - Complete feature list
  - UI/UX features
  - Technical features
  - Validation features
  - Security features

### Testing

- **[E2E Testing Guide](testing/e2e-test-guide.md)** - End-to-end testing
  - Frontend E2E (Playwright)
  - Backend E2E (JUnit)
  - Running tests
  - Writing new tests

- **[TDD Plan](testing/tdd-plan.md)** - Test-driven development plan
  - Test cases
  - Development order
  - Priority assignments

### Requirements & Architecture

- **[Requirements](requirements/requirements.md)** - Requirements specification
  - Functional requirements
  - Non-functional requirements
  - Constraints

- **[Architecture Diagrams](architecture/)** - System architecture
  - [Context Diagram](architecture/context.mermaid) - System context
  - [Container Diagram](architecture/container.mermaid) - Container view
  - [Component Diagram](architecture/component.mermaid) - Component view

---

## 🗂️ Documentation Structure

```
docs/
├── INDEX.md                      # This file
├── API.md                        # API documentation
├── FEATURES.md                   # Feature list
│
├── guides/                       # User and developer guides
│   ├── quick-start-guide.md      # Getting started (5 min)
│   ├── development-guide.md      # Developer documentation
│   └── ci-cd-setup.md            # CI/CD automation guide
│
├── testing/                      # Testing documentation
│   ├── e2e-test-guide.md         # E2E testing guide
│   └── tdd-plan.md               # TDD development plan
│
├── requirements/                 # Requirements
│   └── requirements.md           # Requirements specification
│
└── architecture/                 # Architecture diagrams
    ├── context.mermaid           # System context diagram
    ├── container.mermaid         # Container diagram
    └── component.mermaid         # Component diagram
```

---

## 🎯 Documentation by Role

### For Operators/Users

Start here to learn how to use the system:

1. **[Quick Start Guide](guides/quick-start-guide.md)** - Learn the basics
2. **[Features](FEATURES.md)** - Understand what you can do
3. **Troubleshooting** - See [Quick Start Guide § Troubleshooting](guides/quick-start-guide.md#troubleshooting)

### For Developers

Start here to contribute to the project:

1. **[Development Guide](guides/development-guide.md)** - Setup your environment
2. **[CI/CD Setup Guide](guides/ci-cd-setup.md)** - Configure automated workflows
3. **[TDD Plan](testing/tdd-plan.md)** - Understand the testing approach
4. **[E2E Testing Guide](testing/e2e-test-guide.md)** - Learn how to test
5. **[API Documentation](API.md)** - API reference
6. **[Architecture](architecture/)** - Understand the design

### For Architects/Designers

Start here to understand the system:

1. **[Requirements](requirements/requirements.md)** - System requirements
2. **[Architecture Diagrams](architecture/)** - System design
3. **[Features](FEATURES.md)** - What the system does
4. **[API Documentation](API.md)** - Interface contracts

---

## 📚 Document Descriptions

### Guides

**Quick Start Guide**
- Time: 5-10 minutes
- Audience: All users
- Purpose: Get started quickly
- Contents: Installation, basic usage, common tasks

**Development Guide**
- Time: 30-60 minutes
- Audience: Developers
- Purpose: Learn to develop and contribute
- Contents: Setup, workflow, testing, contributing

### Technical Documentation

**API Documentation**
- Audience: Developers, integrators
- Purpose: API reference
- Contents: All endpoints, examples, validation rules

**Features**
- Audience: All stakeholders
- Purpose: Understand capabilities
- Contents: UI features, technical features, planned features

### Testing

**E2E Testing Guide**
- Audience: Developers, QA
- Purpose: Test the system
- Contents: Test structure, running tests, writing tests

**TDD Plan**
- Audience: Developers
- Purpose: Development methodology
- Contents: Test cases, development order, priorities

### Requirements & Architecture

**Requirements**
- Audience: All stakeholders
- Purpose: What the system must do
- Contents: Functional & non-functional requirements

**Architecture**
- Audience: Architects, developers
- Purpose: How the system is designed
- Contents: Context, container, and component diagrams

---

## 🔍 Finding Information

### Common Questions

**How do I get started?**  
→ [Quick Start Guide](guides/quick-start-guide.md)

**How do I develop a new feature?**  
→ [Development Guide](guides/development-guide.md)

**What are all the API endpoints?**  
→ [API Documentation](API.md)

**How do I run tests?**  
→ [E2E Testing Guide](testing/e2e-test-guide.md)

**What can the system do?**  
→ [Features](FEATURES.md)

**How is the system designed?**  
→ [Architecture](architecture/)

**What were the requirements?**  
→ [Requirements](requirements/requirements.md)

**How do I troubleshoot issues?**  
→ [Quick Start Guide § Troubleshooting](guides/quick-start-guide.md#troubleshooting)

---

## 📝 Documentation Updates

This documentation is maintained alongside the codebase. When making changes:

1. **Update relevant docs** when changing functionality
2. **Add examples** for new features
3. **Keep screenshots current** (if applicable)
4. **Update version numbers** in README
5. **Test all code examples** in documentation

---

## 🔗 External Resources

**Technologies:**
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [Material UI Documentation](https://mui.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Playwright Documentation](https://playwright.dev/)

**Tools:**
- [Maven Guide](https://maven.apache.org/guides/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📮 Feedback

Found an issue with the documentation?

- Check if it's already in the [project issues](../../issues)
- Contact the Observis development team
- Submit documentation improvements via pull request

---

<div align="center">

**[↑ Back to Top](#documentation-index)**

---

**Documentation Version:** 1.0.0  
**Last Updated:** 2025-10-21  
**Maintained by:** Observis Team

</div>

