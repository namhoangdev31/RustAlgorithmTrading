FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc g++ musl-dev

WORKDIR /workspace/go
COPY go/go.mod go/go.sum* ./
RUN go mod download
COPY go ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/edge-gateway ./cmd/edge-gateway/main.go

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /workspace
COPY --from=builder /out/edge-gateway /usr/local/bin/edge-gateway

ENV PORT=8088
ENV HOST=0.0.0.0

EXPOSE 8088
CMD ["/usr/local/bin/edge-gateway"]
