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
    ],
  },
  {
    title: "Runtime & Operations",
    items: [
      { title: "Development Setup", slug: "setup/DEVELOPMENT" },
      { title: "Production Deployment", slug: "deployment/PRODUCTION_DEPLOYMENT" },
      { title: "Operations Guide", slug: "operations/OPERATIONS_GUIDE" },
    ],
  },
  {
    title: "Architecture & Interfaces",
    items: [
      { title: "System Architecture", slug: "architecture/SYSTEM_ARCHITECTURE" },
      { title: "Python-Rust Separation", slug: "architecture/python-rust-separation" },
      { title: "Rust Module Structure", slug: "architecture/RUST_MODULE_STRUCTURE" },
      { title: "API Documentation", slug: "API_DOCUMENTATION" },
      { title: "ZMQ Protocol", slug: "api/ZMQ_PROTOCOL" },
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
    title: "Testing",
    items: [
      { title: "Test Execution Guide", slug: "TEST_EXECUTION_GUIDE" },
      { title: "Testing Strategy", slug: "testing/strategy/COMPREHENSIVE_TESTING_STRATEGY" },
    ],
  },
  {
    title: "ML & Strategies",
    items: [
      { title: "Strategy Development", slug: "guides/strategy-development" },
      { title: "ML Strategy Guide", slug: "ml/ML_STRATEGY_GUIDE" },
      { title: "High-Frequency Trading", slug: "research/high-frequency-trading-strategies-microprice-and-avellaneda-stoikov" },
    ],
  },
  {
    title: "Roadmap & Reports",
    items: [
      { title: "Completion Report", slug: "roadmap/COMPLETION_REPORT" },
    ],
  },
];
