export interface DocNavItem {
  title: string;
  slug: string;
}

export interface DocNavGroup {
  title: string;
  items: DocNavItem[];
}

export const docsNavigation: DocNavGroup[] = [
  {
    title: "Mandatory Reading",
    items: [
      { title: "Canonical Map", slug: "DOCS_CANONICAL_MAP" },
      { title: "Workspace Playbook", slug: "PLAYBOOK" },
      { title: "README (VI)", slug: "README_VI" },
      { title: "README (EN)", slug: "README" },
      { title: "Reading Guide (VI)", slug: "READING_VI" },
      { title: "Documentation Index", slug: "DOCUMENTATION_INDEX" },
      { title: "Storage Guide", slug: "STORAGE_GUIDE" },
      { title: "Python Backtesting Guide", slug: "python-backtesting-guide" },
    ],
  },
  {
    title: "Setup & Installation",
    items: [
      { title: "Development Setup", slug: "setup/DEVELOPMENT" },
    ],
  },
  {
    title: "Runtime & Operations",
    items: [
      { title: "Operations Guide", slug: "operations/OPERATIONS_GUIDE" },
    ],
  },
  {
    title: "Architecture & Interfaces",
    items: [
      { title: "System Architecture", slug: "architecture/SYSTEM_ARCHITECTURE" },
      { title: "Python-Rust Separation", slug: "architecture/python-rust-separation" },
      { title: "Rust Module Structure", slug: "architecture/RUST_MODULE_STRUCTURE" },
      { title: "Alpaca Data Pipeline", slug: "architecture/ALPACA_DATA_PIPELINE_ARCHITECTURE" },
      { title: "Alpaca Pipeline Diagram", slug: "architecture/ALPACA_DATA_PIPELINE_DIAGRAM" },
      { title: "Observability Summary", slug: "architecture/OBSERVABILITY_ARCHITECTURE_SUMMARY" },
      { title: "Detailed Design", slug: "architecture/detailed-design" },
      { title: "Component Interfaces", slug: "architecture/component-interfaces" },
      { title: "Integration Patterns", slug: "architecture/integration-patterns" },
      { title: "Integration Layer", slug: "architecture/integration-layer" },
      { title: "Architecture Readme", slug: "architecture/README" },
      { title: "Architecture Deployment", slug: "architecture/deployment" },
      { title: "Architecture Index", slug: "architecture/ARCHITECTURE_INDEX" },
    ],
  },
  {
    title: "APIs & Protocols",
    items: [
      { title: "API Documentation", slug: "API_DOCUMENTATION" },
      { title: "ZMQ Protocol", slug: "api/ZMQ_PROTOCOL" },
      { title: "Alpaca API", slug: "api/ALPACA_API" },
      { title: "Database Module", slug: "api/DATABASE_MODULE" },
      { title: "Rust API Reference", slug: "api/rust" },
      { title: "Python API Reference", slug: "api/python" },
    ],
  },
  {
    title: "Observability & Data Plane",
    items: [
      { title: "Observability Overview", slug: "observability/OBSERVABILITY_OVERVIEW" },
      { title: "Metrics Catalog", slug: "observability/METRICS_CATALOG" },
      { title: "Storage Operations", slug: "observability/STORAGE_OPERATIONS" },
      { title: "Logging Standards", slug: "observability/LOGGING_STANDARDS" },
      { title: "Backend API", slug: "observability/BACKEND_API" },
      { title: "Phase 3 Runbook", slug: "observability/PHASE3_CUTOVER_RUNBOOK" },
      { title: "Phase 3 Parity Matrix", slug: "observability/PHASE3_API_PARITY_MATRIX" },
    ],
  },
  {
    title: "Security & Optimization",
    items: [
      { title: "Security Standards", slug: "security/SECURITY_STANDARDS" },
      { title: "Performance Guide", slug: "optimization/PERFORMANCE_GUIDE" },
    ],
  },
  {
    title: "Testing & Quality Assurance",
    items: [
      { title: "Test Execution Guide", slug: "TEST_EXECUTION_GUIDE" },
      { title: "Testing Strategy", slug: "testing/strategy/COMPREHENSIVE_TESTING_STRATEGY" },
      { title: "Testing Guide", slug: "testing/README" },
      { title: "API Testing Guide", slug: "testing/README_API_TESTS" },
      { title: "Test Summary", slug: "testing/TEST_SUMMARY" },
      { title: "Coverage Report", slug: "testing/COVERAGE_REPORT" },
      { title: "Test Suite Summary", slug: "testing/TEST_SUITE_SUMMARY" },
    ],
  },
  {
    title: "Deployment",
    items: [
      { title: "Production Deployment", slug: "deployment/PRODUCTION_DEPLOYMENT" },
      { title: "Staging Deployment", slug: "deployment/STAGING_DEPLOYMENT" },
      { title: "Deployment Index", slug: "deployment/DEPLOYMENT_INDEX" },
      { title: "Dependency Installation", slug: "deployment/DEPENDENCY_INSTALLATION" },
    ],
  },
  {
    title: "Machine Learning",
    items: [
      { title: "ML Strategy Guide", slug: "ml/ML_STRATEGY_GUIDE" },
      { title: "ML Quickstart", slug: "ml/QUICKSTART" },
      { title: "ML Overview", slug: "ml/README" },
    ],
  },
  {
    title: "Strategy & Guides",
    items: [
      { title: "Strategy Development", slug: "guides/strategy-development" },
      { title: "Backtesting Guide", slug: "guides/backtesting" },
      { title: "Error Handling Patterns", slug: "guides/ERROR_HANDLING_PATTERNS" },
      { title: "Alpaca Data Guide", slug: "guides/ALPACA_DATA_GUIDE" },
      { title: "Risk Management Guide", slug: "guides/RISK_MANAGEMENT_GUIDE" },
      { title: "Alpaca Integration", slug: "guides/ALPACA_INTEGRATION" },
    ],
  },
  {
    title: "Roadmaps & Reports",
    items: [
      { title: "Completion Report", slug: "roadmap/COMPLETION_REPORT" },
    ],
  },
  {
    title: "Developer Section",
    items: [
      { title: "Contributing Guidelines", slug: "developer/contributing" },
      { title: "Troubleshooting", slug: "developer/troubleshooting" },
    ],
  },
  {
    title: "Research & Case Studies",
    items: [
      { title: "HFT Strategies", slug: "research/high-frequency-trading-strategies-microprice-and-avellaneda-stoikov" },
      { title: "Stat-Arb 779% Return", slug: "research/how-statistical-arbitrage-desks-made-779-during-the-april-tariff-crash" },
      { title: "Production-Ready Systems", slug: "research/building-production-ready-trading-systems-from-research-sophistication-to-operational-reliability" },
      { title: "Quantum Options Anomaly", slug: "research/quantum-options-anomaly-detection-research-system" },
      { title: "Monte Carlo & HRP", slug: "research/monte-carlo-simulation-in-quantitative-finance-hrp-optimization-with-stochastic-volatility" },
      { title: "Identifying Inefficiencies", slug: "research/how-quants-identify-market-inefficiencies" },
      { title: "Two Sigma Model Failure", slug: "research/the-400m-gain-165m-loss-how-two-sigmas-model-governance-failures-created-asymmetric-pl-impact" },
      { title: "RSI Trading Framework", slug: "research/rsi-trading-strategy-framework-a-comprehensive-backtesting-implementation-with-bias-prevention" },
      { title: "Portfolio Optimization", slug: "research/the-brutal-truth-about-portfolio-optimization-why-your-backtest-lies-to-you" },
      { title: "Hedge Funds ML Derivatives", slug: "research/how-hedge-funds-use-machine-learning-for-derivatives-pricing-and-where-they-make-money" },
      { title: "Momentum Strategy", slug: "research/building-a-sophisticated-momentum-strategy-residual-alpha-yang-zhang-volatility" },
      { title: "QOADRS Math Breakdown", slug: "research/qoadrs-mathematical-implementation-a-step-by-step-breakdown-of-quantum-options-anomaly-detection" },
      { title: "Why Ignore Backtests", slug: "research/why-you-should-ignore-most-backtested-trading-strategies-and-what-works" },
      { title: "Ito's Lemma Intro", slug: "research/embracing-market-uncertainty-with-japanese-serenity-an-introduction-to-itos-lemma" },
      { title: "Heston Model 4144% Return", slug: "research/how-quants-made-4144-returns-in-2020-while-markets-crashed-the-heston-model-edge" },
      { title: "Trading Market Regimes", slug: "research/trading-market-regimes-a-gaussian-mixture-model-approach-to-risk-adjusted-returns" },
      { title: "Meta-Learning & PPO", slug: "research/meta-learning-for-trading-a-dual-head-ppo-implementation-for-dynamic-model-selection" },
      { title: "Brownian Motion Modeling", slug: "research/brownian-motion-in-finance-modeling-the-chaos-of-market-movements" },
      { title: "Martingale Paradox", slug: "research/the-martingale-paradox-why-mathematically-perfect-trading-strategies-fail-in-real-markets" },
      { title: "Quant Hedge Fund Brain", slug: "research/inside-the-brain-of-a-quant-hedge-fund-how-math-and-code-run-wall-street" },
      { title: "Quantum-Enhanced Options", slug: "research/real-time-quantum-enhanced-options-analysis-a-complete-ml-pipeline-for-spy-volatility-surface-analysis" },
      { title: "Renaissance Technologies", slug: "research/renaissance-technologies-the-100-billion-built-on-statistical-arbitrage" },
      { title: "We Backtested Viral Strategy", slug: "research/we-backtested-a-viral-trading-strategy-the-results-will-teach-you-a-lesson" },
      { title: "Hidden Rhythm of Brownian", slug: "research/the-hidden-rhythm-of-brownian-motion" },
    ],
  },
];
