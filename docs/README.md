# py_rt Documentation

Welcome to the comprehensive documentation for the py_rt (Python + Rust Trading) system.

## Documentation Structure

```
docs/
├── README.md                    # This file
├── index.md                     # Documentation home
├── roadmap/                     # Strategic delivery plans
│   ├── EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md
│   └── WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md
├── guides/                      # User guides and tutorials
│   ├── quickstart.md           # 10-minute quick start
│   ├── installation.md         # Detailed installation
│   ├── configuration.md        # System configuration
│   ├── strategy-development.md # Building strategies
│   ├── backtesting.md          # Testing strategies
│   ├── ml-integration.md       # ML model integration
│   ├── risk-management.md      # Risk controls
│   └── monitoring.md           # System monitoring
├── architecture/               # System architecture
│   ├── overview.md             # High-level design
│   ├── components.md           # Component details
│   ├── dataflow.md             # Message flow
│   └── deployment.md           # Production deployment
├── api/                        # API reference
│   ├── python/                 # Python API docs
│   │   ├── index.md
│   │   ├── strategies.md
│   │   ├── backtesting.md
│   │   └── data.md
│   ├── rust/                   # Rust API docs
│   │   ├── index.md
│   │   ├── common.md
│   │   └── components.md
│   ├── rest/                   # REST API
│   ├── websocket/              # WebSocket protocol
│   └── zmq/                    # ZMQ messages
├── developer/                  # Developer guides
│   ├── contributing.md         # How to contribute
│   ├── code-style.md          # Coding standards
│   ├── testing.md             # Testing guide
│   ├── performance.md         # Performance tuning
│   └── troubleshooting.md     # Common issues
└── images/                     # Documentation images
    ├── architecture/
    └── screenshots/
```

## Quick Links

### Getting Started

- [Quick Start Guide](guides/quickstart.md) - Get running in 10 minutes
- [Installation Guide](guides/installation.md) - Detailed setup
- [Configuration Guide](guides/configuration.md) - Configure the system

### Planning & Roadmap

- [Execution Plan 24 Weeks (2026-04-20 to 2026-10-04)](roadmap/EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md) - Weekly execution plan for balanced delivery
- [Week 1 Operations Plan (2026-04-20 to 2026-04-26)](roadmap/WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md) - Daily tasks, checklists, issue register, and week-end report template
- [Week 1 Execution Pack](roadmap/week1/) - KPI charter, baseline report, SLO draft, issue register, gate notes, and final report template

### Development

- [Strategy Development](guides/strategy-development.md) - Build trading strategies
- [Backtesting Guide](guides/backtesting.md) - Test your strategies
- [ML Integration](guides/ml-integration.md) - Use machine learning

### Architecture

- [System Overview](architecture/overview.md) - High-level architecture
- [Component Design](architecture/components.md) - Detailed components
- [Deployment Guide](architecture/deployment.md) - Production deployment

### API Reference

- [Python API](api/python/index.md) - Python modules
- [Rust API](api/rust/index.md) - Rust crates
- [REST API](api/rest/index.md) - HTTP endpoints
- [WebSocket API](api/websocket/index.md) - WebSocket protocol

### Developer

- [Contributing](developer/contributing.md) - How to contribute
- [Code Style](developer/code-style.md) - Coding standards
- [Testing](developer/testing.md) - Testing strategies
- [Troubleshooting](developer/troubleshooting.md) - Common issues

## Documentation Format

This documentation is written in Markdown and can be:

1. **Read on GitHub**: Browse directly in the repository
2. **Built with MkDocs**: Generate static site with `mkdocs serve`
3. **Built with Sphinx**: Generate Python docs with `sphinx-build`
4. **Read Offline**: Download and view locally

## Building Documentation

### MkDocs (Recommended)

```bash
# Install MkDocs
pip install mkdocs mkdocs-material

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

### Sphinx (Python API)

```bash
# Install Sphinx
pip install sphinx sphinx-rtd-theme

# Build HTML
cd docs
make html

# View
open _build/html/index.html
```

### Rustdoc (Rust API)

```bash
# Generate Rust documentation
cd rust
cargo doc --no-deps --open

# Generate with private items
cargo doc --no-deps --document-private-items --open
```

## Contributing to Documentation

We welcome documentation improvements! Please:

1. Follow Markdown best practices
2. Include code examples
3. Add diagrams where helpful
4. Test links and code samples
5. Submit PR with description

See [Contributing Guide](developer/contributing.md) for details.

## License

Documentation is licensed under the same Apache License 2.0 as the code.

---

**Version**: 0.1.3 | **Last Updated**: 2026-04-14
