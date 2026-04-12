# Codex Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:

1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE Codex'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**

- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Codex)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Codex Task Tool for Agent Execution

**Codex's Task tool is the PRIMARY way to spawn agents:**

```javascript
// ✅ CORRECT: Use Codex's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
```

**MCP tools are ONLY for coordination setup:**

- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**

- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Codex-Flow orchestration for systematic Test-Driven Development.


## 📌 PROJECT-SPECIFIC ADDENDUM (APPEND-ONLY, DO NOT REMOVE TEMPLATE SECTIONS)

### 0) Addendum Contract

- This block extends the generic template with repository-specific routing and diagnostics.
- Do not delete or rewrite template sections above/below this addendum.
- Add new project rules here; keep template examples for orchestration discipline.
- When template guidance and project routing both apply, follow both together.

### 1) Rule Precedence For This Repository

1. Safety and non-destructive edit rules.
2. Template orchestration rules (parallel execution, Task/TodoWrite patterns).
3. This addendum's doc/code/test routing rules.
4. User request scope for current task.

### 2) Canonical Reading Order (Must Follow)

Read in this exact order before making non-trivial changes:

1. `/Users/hoangnam/Developer/RustAlgorithmTrading/docs/DOCS_CANONICAL_MAP.md`
2. `/Users/hoangnam/Developer/RustAlgorithmTrading/README_VI.md`
3. `/Users/hoangnam/Developer/RustAlgorithmTrading/PLAYBOOK.md`
4. Domain docs by scope:
- `docs/`
- `rust/docs/`
- `tests/docs/`
- `medium/`

If a doc path from canonical map is missing in current tree, use nearest maintained equivalent and record it in final report.

### 3) Project Compass: What Owns What

#### Python ownership (`src/`)

- `src/api/`: Alpaca clients, auth/rate-limit handling, paper trading adapters.
- `src/data/`: fetch/load/preprocess/features/technical indicators.
- `src/strategies/`: signal logic and strategy router.
- `src/backtesting/`: engine, execution handler, portfolio/performance/metrics.
- `src/bridge/`: Python side of Rust bridge and ZMQ handoff.
- `src/observability/`: API, storage, logging, metrics collectors, dashboard.
- `src/models/`, `src/utils/`: shared domain objects and utilities.

#### Rust ownership (`rust/*/src`)

- `rust/market-data`: websocket ingest, orderbook, aggregation, publisher.
- `rust/signal-bridge`: indicators/features, Python bridge, signal transform.
- `rust/risk-manager`: limits, stops, pnl, circuit breaker.
- `rust/execution-engine`: router, retry, slippage, stop-loss execution.
- `rust/database`: schema/migrations/models/query/connection.
- `rust/common`: shared types/config/error/messaging/health/metrics/http.

#### Test ownership (`tests/`)

- `tests/unit/`: unit tests for Python and Rust.
- `tests/integration/`: cross-module and cross-runtime behavior.
- `tests/e2e/`: end-to-end system flows.
- `tests/observability/`: observability API/storage/logging checks.
- `tests/docs/`: testing strategy and coverage guidance.

### 4) Build/Test Reality Check For This Repo (Validated 2026-04-13)

- Root `package.json` is absent; template `npm run build/test/lint/typecheck` are generic examples, not primary project commands.
- `python -m pytest --version` works.
- `cd rust && cargo metadata --no-deps -q` works.
- Python tests can fail at collection if optional deps are missing (example: `pandas`).

#### Dependency bootstrap commands

```bash
# Python baseline
python -m pip install -r requirements.txt

# Python dev extras from pyproject
python -m pip install -e ".[dev]"

# Rust toolchain checks
cd rust && cargo --version
cd rust && cargo check --workspace
```

#### Primary execution commands

```bash
# Python slices
python -m pytest tests/unit -q
python -m pytest tests/integration -q
python -m pytest tests/observability -q

# Rust slices
cd rust && cargo test --workspace
cd rust && cargo test -p market-data -p signal-bridge
cd rust && cargo test -p risk-manager -p execution-engine -p database -p common

# Mixed critical path
python -m pytest tests/integration/test_backtest_signal_flow.py -q
python -m pytest tests/integration/test_observability_integration.py -q
cd rust && cargo test -p signal-bridge -p execution-engine
```

### 5) Codex Command Packs (Project-Specific)

Use these as templates when spawning agents or batching operations.

#### Pack A: Diagnose bug in signal pipeline (Python + Rust)

```javascript
[Single Message]:
  Task("Signal Research", "Map failing behavior to docs + owner files in src/strategies and rust/signal-bridge.", "researcher")
  Task("Signal Fix", "Patch smallest edit set in strategy/indicator code paths.", "coder")
  Task("Signal Tests", "Run nearest unit+integration tests for signal flow.", "tester")
  TodoWrite { todos: [
    {id: "1", content: "Read canonical docs and signal docs", status: "in_progress", priority: "high"},
    {id: "2", content: "Locate owner files with rg", status: "in_progress", priority: "high"},
    {id: "3", content: "Patch Python strategy if needed", status: "pending", priority: "high"},
    {id: "4", content: "Patch Rust signal bridge if needed", status: "pending", priority: "high"},
    {id: "5", content: "Run unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Run integration flow tests", status: "pending", priority: "medium"},
    {id: "7", content: "Summarize docs->code->test evidence", status: "pending", priority: "medium"}
  ]}
  Bash "rg \"signal|indicator|feature|router\" src rust tests docs"
  Bash "python -m pytest tests/unit/test_strategy_signals.py -q || true"
  Bash "cd rust && cargo test -p signal-bridge || true"
```

#### Pack B: Cross-runtime contract change (bridge/protocol)

```javascript
[Single Message]:
  Task("Protocol Research", "Confirm message contract from docs/api/ZMQ_PROTOCOL.md and code contracts.", "researcher")
  Task("Bridge Python", "Update src/bridge contract serialization/deserialization.", "coder")
  Task("Bridge Rust", "Update rust/signal-bridge and related message types.", "coder")
  Task("Contract Tests", "Run integration tests covering handoff path.", "tester")
  TodoWrite { todos: [
    {id: "1", content: "Open ZMQ protocol doc + architecture doc", status: "in_progress", priority: "high"},
    {id: "2", content: "Patch Python bridge", status: "pending", priority: "high"},
    {id: "3", content: "Patch Rust bridge", status: "pending", priority: "high"},
    {id: "4", content: "Run backtest signal flow integration test", status: "pending", priority: "high"},
    {id: "5", content: "Run rust signal-bridge tests", status: "pending", priority: "medium"}
  ]}
```

#### Pack C: Observability/storage regression

```javascript
[Single Message]:
  Task("Obs Research", "Map issue to observability API/storage/logging ownership.", "researcher")
  Task("Obs Fix", "Patch src/observability owners only.", "coder")
  Task("Obs Validation", "Run tests/observability and integration checks.", "tester")
  Bash "rg \"duckdb|sqlite|metrics|structured_logger|websocket\" src/observability tests docs"
  Bash "python -m pytest tests/observability -q"
  Bash "python -m pytest tests/integration/test_observability_integration.py -q"
```

### 6) Fast Task Routing (Doc -> Code -> Test)

| Task type | Read first | Inspect first | Validate first |
|---|---|---|---|
| Alpaca auth/rate limit/API errors | `docs/api/ALPACA_API.md`, `docs/API_DOCUMENTATION.md` | `src/api/alpaca_client.py`, `src/api/alpaca_paper_trading.py`, `rust/market-data/src/websocket.rs` | `tests/test_alpaca_*.py`, `tests/unit/test_alpaca_*.rs`, `tests/integration/test_alpaca_api.rs` |
| Python-Rust signal handoff | `docs/architecture/python-rust-separation.md`, `docs/api/ZMQ_PROTOCOL.md` | `src/bridge/zmq_bridge.py`, `src/bridge/rust_bridge.py`, `rust/signal-bridge/src/bridge.rs`, `rust/common/src/messaging.rs` | `tests/integration/test_backtest_signal_flow.py`, `tests/integration/test_end_to_end.rs`, `tests/integration/test_risk_execution_observability.rs` |
| Indicator/feature correctness | `docs/guides/strategy-development.md`, `medium/rsi-trading-strategy-framework-a-comprehensive-backtesting-implementation-with-bias-prevention.md` | `src/data/indicators.py`, `src/data/features.py`, `rust/signal-bridge/src/{indicators,features}.rs` | `tests/unit/python/test_features.py`, `tests/unit/test_strategy_signals.py`, `tests/integration/test_momentum_signal_generation.py` |
| Risk logic/stop-loss/limits | `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/{limits,stops,pnl,circuit_breaker}.rs`, `src/strategies/strategy_router.py` | `tests/unit/test_risk_*.rs`, `tests/integration/test_stop_loss_integration.rs`, `tests/unit/test_week3_stop_loss_immediate_exit.py` |
| Execution router/retry/slippage | `docs/architecture/component-interfaces.md` | `rust/execution-engine/src/{router,retry,slippage,stop_loss_executor}.rs`, `src/backtesting/execution_handler.py` | `tests/unit/test_execution_router.rs`, `tests/unit/test_retry.rs`, `tests/unit/test_slippage.rs` |
| Market data/orderbook flow | `docs/architecture/RUST_MODULE_STRUCTURE.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md` | `rust/market-data/src/{websocket,orderbook,aggregation,publisher}.rs`, `src/data/fetcher.py` | `tests/unit/test_orderbook.rs`, `tests/unit/test_market_data_orderbook.rs`, `tests/integration/test_websocket.rs` |
| Backtesting regression | `docs/python-backtesting-guide.md` | `src/backtesting/{engine,portfolio_handler,performance,metrics,transaction_costs}.py`, `src/strategies/strategy_router.py` | `tests/test_backtest_integration.py`, `tests/unit/python/test_backtest_engine.py`, `tests/integration/test_backtest_signal_validation.py` |
| Observability API/storage/logging | `docs/observability/BACKEND_API.md` | `src/observability/api/`, `src/observability/storage/`, `src/observability/logging/`, `src/observability/database/` | `tests/observability/test_*.py`, `tests/integration/test_observability_integration.py`, `tests/integration/test_duckdb_storage.rs` |
| Rust persistence/schema/migrations | `rust/README.md`, `docs/architecture/database-persistence.md` | `rust/database/src/{schema,migrations,query,models,connection,error}.rs` | `rust/database/src/tests.rs`, `tests/integration/test_duckdb_storage.rs` |
| Shared type/contract breakage | `docs/api/ZMQ_PROTOCOL.md`, `docs/architecture/component-interfaces.md` | `rust/common/src/{types,messaging,errors}.rs`, `src/models/*.py` | `tests/unit/test_types.rs`, `tests/unit/test_common_types.rs`, `tests/integration/test_end_to_end.rs` |

### 7) Diagnostic Workflow: Find Correct File Before Edit

Run this process in order to avoid reading lan man:

1. Triage symptom category: `api`, `signal`, `risk`, `execution`, `backtest`, `observability`, `database`, `contract`.
2. Open canonical docs first; avoid starting from historical reports.
3. Produce an owner shortlist (max 3 modules).
4. Search only within shortlisted modules:
```bash
rg "error_or_keyword" src rust tests docs
rg --files src rust tests docs | rg "module_or_feature_name"
```
5. Confirm owner file by function/class/type hit, not filename guess alone.
6. Identify nearest test file before code change.
7. Reproduce with smallest failing test scope.
8. Apply smallest edit set:
- single-module bug: 1-3 files
- cross-runtime contract bug: patch both sides in one change
9. Re-run nearest tests.
10. Run targeted integration tests.
11. Summarize evidence: doc -> code -> test.

### 8) Path-Triggered Test Matrix (Minimum Required)

When touching these paths, run at least these tests:

- `src/api/**` -> `python -m pytest tests/test_alpaca_*.py -q`
- `src/data/**` -> `python -m pytest tests/unit/python/test_features.py -q`
- `src/strategies/**` -> `python -m pytest tests/unit/test_strategy_signals.py -q`
- `src/backtesting/**` -> `python -m pytest tests/test_backtest_integration.py -q`
- `src/bridge/**` -> `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
- `src/observability/**` -> `python -m pytest tests/observability -q`
- `rust/market-data/**` -> `cd rust && cargo test -p market-data`
- `rust/signal-bridge/**` -> `cd rust && cargo test -p signal-bridge`
- `rust/risk-manager/**` -> `cd rust && cargo test -p risk-manager`
- `rust/execution-engine/**` -> `cd rust && cargo test -p execution-engine`
- `rust/database/**` -> `cd rust && cargo test -p database`
- `rust/common/**` -> `cd rust && cargo test -p common`

For cross-runtime edits (`src/bridge/**`, `rust/signal-bridge/**`, `rust/common/src/messaging.rs`), run both Python integration and Rust crate tests.

### 9) Reading Hygiene (Hard Limits)

Do not spend baseline task time in:

- `docs/legacy/` (contains old: fixes, review, reviews, analysis, research, strategy_comparison, migration, testing, troubleshooting)
- `tests/logs/`
- `**/__pycache__/`
- `rust/target/`, `tests/target/`
- backup snapshots `*.backup`, `*.week3`

Only read `medium/` for strategy rationale or when user asks research context.

### 10) Additional Project Orders (Strict)

1. **Order A - Diagnose Before Edit**: No patch until owner module + target test are identified.
2. **Order B - Canonical Docs First**: Start from canonical map and maintained docs, not reports.
3. **Order C - Contract Symmetry**: Python-Rust message changes must update both sides.
4. **Order D - Minimal Edit Set**: Avoid broad refactor when fixing scoped bug.
5. **Order E - Evidence In Final Report**: Always report docs used, files touched, tests run/skipped.
6. **Order F - PLAYBOOK Sync**: Any new project file must be added to `PLAYBOOK.md` in same change.
7. **Order G - No Root Spillage**: Never create working docs/tests/scripts in repository root.
8. **Order H - Ignore Generated Files**: Never patch caches/build artifacts.
9. **Order I - Test Closest First**: Unit before integration before e2e.
10. **Order J - Stop On Unexpected Drift**: If unrelated in-flight file changes appear, pause and realign.

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

---

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
Whenever a new project file is created (source, config, script, test, or doc), update `PLAYBOOK.md` in the same change to include the new file and its role/class-or-type mapping. Exclude generated artifacts, caches, and runtime outputs.
