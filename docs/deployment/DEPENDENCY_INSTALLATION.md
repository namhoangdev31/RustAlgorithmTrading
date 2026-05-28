# Dependency Installation Guide (Tri-Runtime)

This guide covers the installation of all dependencies required for the **Phase 3.5 Tri-Runtime** (Rust/Python/Go) architecture.

## 🚀 Why UV? (Python Package Management)

We use **uv** for ultra-fast Python dependency management. It is **10-100x faster** than standard pip:

| Tool | Installation Time | Speed |
|------|-------------------|-------|
| **pip** | 45-90 seconds | Baseline |
| **uv** | 2-5 seconds | **~20x faster** |

- **Parallel Downloads**: Installs multiple packages simultaneously.
- **Intelligent Caching**: Reuses binaries across projects to save bandwidth and time.
- **Rust-based**: Built with the same performance mindset as our trading kernel.

## ⚡ Fast Installation (Recommended)

The project provides a unified, hardened installation script that auto-detects your platform and installs all runtimes.

```bash
# Run the unified installer
./install_all_dependencies_fast.sh
```

**This script handles:**

- **Rust Toolchain**: `rustup`, `cargo`, and standard libraries.
- **Python Environment**: `uv` package manager and virtual environment setup.
- **Go Runtime**: Go 1.22+ installation.
- **System Libraries**: `libssl-dev`, `pkg-config`, `build-essential`, `zmq`.

---

## 📋 Manual Installation (Component-by-Component)

### 1. System Dependencies (Linux/WSL)

```bash
sudo apt-get update && sudo apt-get install -y \
    build-essential pkg-config libssl-dev \
    curl git jq zmq-dev
```

### 2. Rust Kernel

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

### 3. Python Research Layer (via UV)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup environment
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 4. Go Control Plane

```bash
# Install Go (Ubuntu example)
sudo snap install go --classic
# Or download from https://go.dev/dl/
```

---

## ✅ Verification

Run the health check script to ensure all runtimes are operational:

```bash
./ops/scripts/health_check.sh
```

**Expected Output:**

- [✓] Rust binary compilation: OK
- [✓] Python environment (uv): OK
- [✓] Go runtime version: OK
- [✓] ZeroMQ connectivity: OK

---

## 🔧 Troubleshooting

### Missing `pkg-config` or `openssl`

If Rust compilation fails with "Could not find directory of OpenSSL installation":

```bash
sudo apt-get install -y pkg-config libssl-dev
```

### `uv` Command Not Found

Ensure `~/.cargo/bin` is in your PATH:

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

---
**Maintained By**: Trading Infrastructure Team
