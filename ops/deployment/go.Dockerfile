# Go control-plane image. Build from repository root.
# docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .

FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc g++ musl-dev

WORKDIR /workspace/go
COPY go/go.mod go/go.sum* ./
RUN go mod download
COPY go ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/go-control-plane ./cmd/server/main.go

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /workspace
COPY --from=builder /out/go-control-plane /usr/local/bin/go-control-plane

ENV PORT=8081
ENV HOST=0.0.0.0
ENV DUCKDB_PATH=/data/observability.duckdb

EXPOSE 8081
CMD ["/usr/local/bin/go-control-plane"]
