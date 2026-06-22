# Production Readiness & System Risk Review

Tài liệu này đánh giá khả năng đưa cấu hình `ops/` lên production cho nền tảng managed SaaS phục vụ nhiều nhóm user: developer, trader và regular user. Mục tiêu của stack hiện tại là vận hành như dịch vụ tập trung, không phải bộ source để khách hàng tự kéo về chạy local.

## Kết luận nhanh

Trạng thái hiện tại: **có thể tiến tới staging production-like**, nhưng **chưa nên bật live trading cho user thật nếu chưa hoàn tất các production gate bên dưới**.

Các phần đã đi đúng hướng:

- Public ingress tập trung qua `edge-gateway`; `nextjs-frontend` chỉ dùng `expose: 3000`, không publish host port.
- Redis đã được thiết kế là managed dependency qua `REDIS_URL`, không còn single Redis container trong production Compose.
- Risk limit chính giữa `system.production.json` và `risk_limits.toml` đã đồng bộ các ngưỡng quan trọng: exposure, open positions, stop loss và daily loss.
- Alpaca market data production đang dùng SIP feed: `wss://stream.data.alpaca.markets/v2/sip`.
- Next.js image dùng standalone output và migration job riêng `database-migrate`.
- Rust service image dùng multi-stage build; production image chỉ giữ runtime binary và thư viện cần thiết.

Điểm chưa đủ để live release:

- Chưa có bằng chứng full end-to-end với managed PostgreSQL, managed Redis, broker account live, billing webhook và auth provider thật.
- Prisma migration path đã được wiring, nhưng release cần kiểm tra có migration files được track và chạy thành công trên database production-like.
- Trading services cần test failover thực tế: Redis failover, broker reconnect, ZMQ stall, process hang, order rejection, rate limit và circuit breaker.
- Secrets, mTLS/cert rotation, WAF policy và observability alerting cần được xác nhận ở orchestrator thực tế, không chỉ Docker Compose.

## Production gates bắt buộc

| Gate | Trạng thái | Release rule |
|---|---:|---|
| Edge-only public traffic | Pass trong Compose | Chỉ publish `edge-gateway` ports 8088/8443. Không publish `nextjs-frontend:3000`. |
| Managed PostgreSQL | Cần môi trường thật | `DATABASE_URL` phải trỏ tới managed PostgreSQL có backup, PITR và migration policy. |
| Managed Redis | Cần môi trường thật | `REDIS_URL` phải là TLS endpoint có replication/failover. Không dùng Redis container đơn lẻ. |
| Risk config consistency | Pass ở file hiện tại | Block release nếu mapped values giữa `system.production.json` và `risk_limits.toml` lệch nhau. |
| Alpaca SIP entitlement | Cần xác nhận tài khoản | Live trading chỉ bật khi account có SIP data entitlement. |
| Database migrations | Cần xác nhận repo/env | `database-migrate` phải chạy `prisma migrate deploy` thành công trước frontend. |
| Broker secrets | Cần secret store | Không set broker key trong file. Chỉ inject qua secret store/orchestrator. |
| Healthchecks | Cải thiện một phần | Rust services đang dùng metrics endpoint nếu `HEALTHCHECK_URL` được set; cần thêm alert theo business liveness. |
| Rollback | Cần image tags bất biến | Mỗi release phải có `IMAGE_TAG` bất biến và runbook rollback. |

## Rủi ro hệ thống

### 1. Network exposure và bypass edge

Mức rủi ro: **High nếu cấu hình bị revert**.

Hiện trạng tốt: `nextjs-frontend` không publish host port, chỉ `expose: 3000`; public ports nằm ở `edge-gateway` qua `EDGE_HTTP_PORT` và `EDGE_TLS_PORT`.

Nguy cơ còn lại:

- Nếu deploy platform tự động publish service port, user có thể bypass WAF/challenge/cert handling của edge.
- Nếu internal service mesh route sai, `nextjs-frontend` có thể bị truy cập trực tiếp.

Mitigation:

- Chặn inbound tới mọi service trừ `edge-gateway`.
- Dùng private network/security group cho `nextjs-frontend`, `go-control-plane` và Rust services.
- Thêm external scan trong pre-release: chỉ 8088/8443 hoặc 80/443 qua load balancer được mở.

### 2. Redis và state backbone

Mức rủi ro: **High**.

Hiện trạng tốt: Compose yêu cầu `REDIS_URL`, định hướng dùng managed Redis TLS thay vì Redis container.

Nguy cơ còn lại:

- Redis failover có thể làm edge cache, telemetry, pub/sub hoặc session-related flows gián đoạn.
- Một số client có thể không reconnect đúng sau failover.

Mitigation:

- Dùng managed Redis Multi-AZ hoặc tương đương.
- Test forced failover trong staging.
- Alert theo Redis latency, reconnect count, dropped pub/sub messages và cache error rate.

### 3. Risk config mismatch

Mức rủi ro: **Critical nếu lệch trong live trading**.

Hiện trạng tốt:

- `system.production.json`: `max_notional_exposure = 10000.0`, `max_open_positions = 2`, `stop_loss_percent = 1.0`, `max_loss_threshold = 1000.0`.
- `risk_limits.toml`: `max_total_exposure = 10000.0`, `max_open_positions = 2`, `default_stop_loss_percent = 1.0`, `max_daily_loss = 1000.0`.

Nguy cơ còn lại:

- Có hai nguồn cấu hình: startup config và reload config.
- Dịch vụ khác nhau có thể đọc source khác nhau nếu automation deploy sai.

Mitigation:

- CI gate so sánh mapped values trước khi build/push image.
- Runtime log phải in config checksum/version.
- Không cho user sửa trực tiếp file config trong container đang chạy.

### 4. Docker runtime và native libraries

Mức rủi ro: **Medium-High**.

Hiện trạng tốt:

- Rust Dockerfile dùng multi-stage build: builder có Rust toolchain, runtime chỉ có binary và runtime libs.
- `signal-bridge` runtime đã có `python3` và `libpython3.13` để tránh crash do PyO3 dynamic library.
- `edge-gateway` build với `CGO_ENABLED=0`.
- Next.js runtime dùng standalone output.

Nguy cơ còn lại:

- Go control plane dùng CGO và DuckDB; cần smoke test image trên đúng architecture production.
- Alpine/Debian mix giữa service images cần được scan CVE và runtime compatibility.
- Nếu `signal-bridge` về sau cần Python model package thật, không được cài full ML requirements bừa vào runtime image.

Mitigation:

- Build và run smoke test từng image trên target architecture.
- Scan image trước release.
- Nếu cần Python model inference trong container, tạo runtime requirements riêng, tối thiểu, có pin version.

### 5. Healthcheck chưa đại diện đầy đủ cho business liveness

Mức rủi ro: **Medium-High**.

Hiện trạng tốt: Rust services đã dùng `HEALTHCHECK_URL` trỏ tới metrics endpoint trong Compose.

Nguy cơ còn lại:

- Metrics endpoint sống không đồng nghĩa broker websocket, ZMQ flow, risk loop hoặc order executor vẫn xử lý đúng.
- Deadlock một task phụ có thể không làm process chết.

Mitigation:

- Thêm readiness theo dependency: broker connection, ZMQ last-message age, Redis connection, DB connection.
- Alert theo stale market data, signal lag, order rejection rate, circuit breaker state.
- Tách liveness và readiness trong orchestrator production.

### 6. Market data quality và live execution

Mức rủi ro: **Critical với trader users**.

Hiện trạng tốt: Production config dùng Alpaca SIP feed thay vì IEX.

Nguy cơ còn lại:

- SIP entitlement chưa được xác nhận ở account thật.
- Slippage, partial fill, rejection, holiday/market-hours behavior chưa được chứng minh bằng live-like test.
- `paper_trading` trong production config là `false`, nên bật profile trading với credential thật có thể tạo lệnh live.

Mitigation:

- Bắt buộc chạy staging paper trading trước.
- Dùng account/live allowlist theo tenant.
- Có kill switch toàn hệ thống và theo tenant.
- Bắt đầu bằng notional rất nhỏ, rollout theo cohort.

### 7. Database migration và SaaS data integrity

Mức rủi ro: **High**.

Hiện trạng tốt: Có `database-migrate` one-shot service chạy trước `nextjs-frontend`.

Nguy cơ còn lại:

- Nếu migration files thiếu hoặc chưa được review, frontend/control-plane có thể chạy với schema lệch.
- Image rollback không tự rollback schema.

Mitigation:

- Migration phải chạy trên staging clone trước production.
- Mỗi migration cần rollback/forward-fix plan.
- Backup/PITR phải được kiểm tra restore định kỳ.

### 8. Multi-tenant SaaS boundary

Mức rủi ro: **High**.

Hiện trạng tốt: Config đã khai báo `SERVICE_MODE=managed_saas`, `TENANCY_MODE=multi_tenant`, user segments `developer,trader,regular`.

Nguy cơ còn lại:

- Trader workflow có rủi ro tài chính cao hơn developer/regular workflow.
- Nếu tenant isolation, account mapping hoặc broker credential binding sai, có thể rò dữ liệu hoặc đặt lệnh nhầm tài khoản.

Mitigation:

- Broker credential phải được mã hóa bằng app secret store, bind theo tenant/user/account rõ ràng.
- Mọi order intent cần audit log gồm tenant, user, strategy, config version, risk decision và broker response.
- Tách quyền regular/developer/trader bằng authorization policy ở control plane và frontend.

## Khuyến nghị go/no-go

### Có thể làm ngay

- Deploy staging production-like với managed PostgreSQL, managed Redis và image tags bất biến.
- Chạy `docker compose config -q`, build toàn bộ images, smoke test health/metrics từng service.
- Chạy paper trading qua profile `trading` bằng staging broker credentials.

### Chưa nên làm ngay

- Chưa nên bật live trading đại trà cho trader users.
- Chưa nên cho user tự cấu hình risk/live broker nếu chưa có approval workflow và audit trail.
- Chưa nên coi healthcheck hiện tại là đủ để auto-heal trading incident.

### Điều kiện để live release

1. Staging paper trading chạy ổn định ít nhất một chu kỳ market session.
2. Managed Redis failover test pass.
3. Prisma migration deploy pass trên staging clone.
4. Broker live account xác nhận SIP entitlement.
5. Circuit breaker và kill switch được test bằng tình huống giả lập.
6. Observability có alert cho stale market data, order failure, risk rejection, Redis/DB latency và service restart loop.
7. Rollback image tag và database forward-fix runbook được duyệt.

## Lệnh validation đề xuất

```bash
DATABASE_URL='postgresql://ops:ops@db.example:5432/trading' \
REDIS_URL='rediss://default:test@redis.example:6379' \
NEXTAUTH_URL='https://app.example.com' \
AUTH_SECRET='test-only-secret' \
APP_SECRETS_MASTER_KEY='test-master-key' \
LEPOS_INTERNAL_API_KEY='test-internal-key' \
LEPOS_NATIVE_TELEMETRY_KEY='test-telemetry-key' \
STRIPE_SECRET_KEY='sk_test_only' \
STRIPE_CONNECT_WEBHOOK_SECRET='whsec_test_only' \
LEPOS_SERVICE_SECRET='test-service-secret' \
ALPACA_API_KEY='test-alpaca-key' \
ALPACA_SECRET_KEY='test-alpaca-secret' \
docker compose -f ops/docker-compose.yml --profile trading config -q
```

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=signal-bridge -t trading/signal-bridge:smoke .
docker run --rm -p 127.0.0.1:19094:9094 \
  -e SIGNAL_BRIDGE_METRICS_HOST=0.0.0.0 \
  -e HEALTHCHECK_URL=http://127.0.0.1:9094/metrics \
  -e ALPACA_API_KEY=smoke-test-only \
  -e ALPACA_SECRET_KEY=smoke-test-only \
  trading/signal-bridge:smoke
```

## Rollback posture

Rollback ứng dụng: redeploy image tag trước đó với cùng config đã được kiểm chứng.

Rollback config: revert `ops/docker-compose.yml`, `ops/deployment/*.Dockerfile`, `ops/config/system.production.json` và `ops/config/risk_limits.toml` về commit/tag trước đó.

Rollback database: không rollback bằng image. Dùng forward-fix migration hoặc restore theo PITR sau khi được duyệt.

Rollback live trading: ưu tiên kill switch, hủy open orders nếu cần, khóa tenant/account bị ảnh hưởng, sau đó mới rollback service.
