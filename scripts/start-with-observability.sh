#!/bin/bash
# Unified Trading System + Observability Launcher
# Starts all observability services then launches the trading engine

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✓${NC} $1"; }
echo_error() { echo -e "${RED}✗${NC} $1"; }
echo_info() { echo -e "${BLUE}ℹ${NC} $1"; }
echo_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Parse command line arguments
MODE="${1:-docker}"
TRADING_MODE="${2:-release}"

print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║   Trading System + Observability Launcher           ║"
    echo "║                                                      ║"
    echo "║   Observability: $MODE mode                         ║"
    echo "║   Trading:       $TRADING_MODE build                ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
}

check_prerequisites() {
    echo_info "Checking prerequisites..."

    # Check Rust/Cargo
    if ! command -v cargo &> /dev/null; then
        echo_error "Cargo not found. Please install Rust."
        exit 1
    fi
    echo_success "Rust/Cargo found"

    # Check Docker (if needed)
    if [ "$MODE" = "docker" ] || [ "$MODE" = "dev" ]; then
        if ! command -v docker &> /dev/null; then
            echo_error "Docker not found. Please install Docker."
            exit 1
        fi

        if ! docker info &> /dev/null; then
            echo_error "Docker daemon not running."
            exit 1
        fi

        echo_success "Docker found and running"
    fi

    # Check .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo_warning ".env file not found. Creating from .env.example..."
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            echo_success "Created .env file"
        else
            echo_error ".env.example not found!"
            exit 1
        fi
    else
        echo_success ".env file exists"
    fi
}

start_observability() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " STEP 1: Starting Observability Stack"
    echo "═══════════════════════════════════════════════════════"

    case "$MODE" in
        docker)
            echo_info "Starting Docker Compose observability stack..."
            cd "$DOCKER_DIR"

            # Check if already running
            if docker-compose -f docker-compose.observability.yml ps | grep -q "Up"; then
                echo_warning "Services already running. Restarting..."
                docker-compose -f docker-compose.observability.yml restart
            else
                docker-compose -f docker-compose.observability.yml up -d
            fi

            echo_success "Observability stack started!"
            ;;

        dev)
            echo_info "Starting Docker Compose in development mode..."
            cd "$DOCKER_DIR"
            docker-compose -f docker-compose.observability.yml -f docker-compose.dev.yml up -d
            echo_success "Development observability stack started!"
            ;;

        native)
            echo_info "Starting observability in native mode..."
            cd "$PROJECT_ROOT"

            # Export environment
            export DUCKDB_PATH="$PROJECT_ROOT/data/metrics.duckdb"
            export LOG_PATH="$PROJECT_ROOT/logs"

            # Start API in background
            cd src/observability
            nohup "$PROJECT_ROOT/scripts/start_go_observability.sh" > "$PROJECT_ROOT/logs/observability-api.log" 2>&1 &
            echo $! > /tmp/observability-api.pid
            echo_success "Native observability API started (PID: $(cat /tmp/observability-api.pid))"
            ;;

        skip)
            echo_warning "Skipping observability stack (using existing services)"
            ;;

        *)
            echo_error "Unknown mode: $MODE"
            echo "Usage: $0 [docker|native|dev|skip] [release|debug]"
            exit 1
            ;;
    esac
}

wait_for_services() {
    if [ "$MODE" = "skip" ]; then
        return 0
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " Waiting for Observability Services"
    echo "═══════════════════════════════════════════════════════"

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        # Check Prometheus
        if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            echo_success "Prometheus is healthy"
            break
        fi

        echo_info "Waiting for services... ($attempt/$max_attempts)"
        sleep 2
    done

    # Final health check
    echo ""
    echo_info "Checking service health..."

    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo_success "Prometheus: http://localhost:9090"
    else
        echo_warning "Prometheus: Not responding"
    fi

    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo_success "Grafana: http://localhost:3000"
    else
        echo_warning "Grafana: Not responding"
    fi

    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        echo_success "Observability API: http://localhost:8081"
    else
        echo_warning "Observability API: Not responding"
    fi

    echo_success "Services are ready!"
}

build_trading_system() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " STEP 2: Building Trading System"
    echo "═══════════════════════════════════════════════════════"

    cd "$PROJECT_ROOT"

    if [ "$TRADING_MODE" = "release" ]; then
        echo_info "Building trading system (release mode)..."
        cargo build --release
        echo_success "Release build complete"
    else
        echo_info "Building trading system (debug mode)..."
        cargo build
        echo_success "Debug build complete"
    fi
}

start_trading_system() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " STEP 3: Starting Trading Engine"
    echo "═══════════════════════════════════════════════════════"

    cd "$PROJECT_ROOT"

    echo_info "Starting trading engine..."
    echo_warning "Press Ctrl+C to stop"
    echo ""

    if [ "$TRADING_MODE" = "release" ]; then
        cargo run --release --bin trading_engine
    else
        cargo run --bin trading_engine
    fi
}

cleanup() {
    echo ""
    echo_info "Shutting down..."

    if [ "$MODE" = "native" ] && [ -f /tmp/observability-api.pid ]; then
        echo_info "Stopping native observability API..."
        kill $(cat /tmp/observability-api.pid) 2>/dev/null || true
        rm /tmp/observability-api.pid
        echo_success "Native API stopped"
    fi

    if [ "$MODE" = "docker" ] || [ "$MODE" = "dev" ]; then
        echo_info "Docker services still running. Stop with: cd docker && make down"
    fi

    echo_success "Cleanup complete"
}

# Trap Ctrl+C
trap cleanup EXIT INT TERM

show_info() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " Access Points"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "  📊 Grafana Dashboard:     http://localhost:3000"
    echo "  🔍 Prometheus:            http://localhost:9090"
    echo "  📡 Observability API:     http://localhost:8081"
    echo "  📚 Health Endpoint:       http://localhost:8081/health"
    echo "  🚨 Alertmanager:          http://localhost:9093"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo " Logs & Monitoring"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "  View logs:        cd docker && make logs"
    echo "  Check health:     cd docker && make health"
    echo "  Stop services:    cd docker && make down"
    echo "  Restart services: cd docker && make restart"
    echo ""
    echo "═══════════════════════════════════════════════════════"
}

# Main execution
main() {
    print_banner
    check_prerequisites
    start_observability
    wait_for_services
    show_info
    build_trading_system
    start_trading_system
}

# Run main
main "$@"
