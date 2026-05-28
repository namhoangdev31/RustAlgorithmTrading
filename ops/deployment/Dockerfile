# Generic Rust service image. Build from repository root.
# Example:
# docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .

FROM rust:1-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    cmake \
    g++ \
    libssl-dev \
    libzmq3-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY rust ./rust
WORKDIR /workspace/rust

ARG BIN=market-data
RUN cargo build --release --bin ${BIN}

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libzmq5 \
    && rm -rf /var/lib/apt/lists/*

ARG BIN=market-data
ENV SERVICE_BIN=${BIN}
WORKDIR /workspace

COPY --from=builder /workspace/rust/target/release/${BIN} /usr/local/bin/${BIN}
COPY ops/config ./ops/config

ENTRYPOINT ["sh", "-c", "exec /usr/local/bin/${SERVICE_BIN}"]
