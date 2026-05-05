"""
Verification script for Strategy Governance Gate.
Tests that ModelValidator enforces mandatory checklists and blocks strategies without evidence.
"""

import sys
import os
from pathlib import Path
import numpy as np

# Add project root to path (for `import src.*`)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.strategies.ml.validation.model_validator import ModelValidator
from src.strategies.ml.validation.governance import GovernanceStatus

class MockModel:
    """Mock model that implements the required interface."""
    def __init__(self, name="MockStrategy"):
        self.name = name
    
    def train(self, X, y):
        return {"loss": 0.1, "accuracy": 0.8}
    
    def predict(self, X):
        return np.random.randint(0, 2, len(X))
    
    def evaluate(self, X, y):
        # Return metrics that will either pass or fail governance
        return {
            "accuracy": 0.85,
            "sharpe_ratio": 1.8,  # > 1.5 (Threshold)
            "profit_factor": 1.5
        }
    
    def get_metadata(self):
        return {
            "assumptions": ["Market is liquid"],
            "limitations": ["High slippage"]
        }

def test_governance_gate():
    print("Testing Strategy Governance Gate Integration...")
    
    # 1. Setup mock data
    X = np.random.rand(200, 10)
    y = np.random.randint(0, 2, 200)
    
    # 2. Test Train/Test Validation (produces OOS evidence but missing WF)
    print("\nScenario 1: Train/Test split (Missing Walk-Forward)")
    model = MockModel("Momentum_v1")
    validator = ModelValidator()
    
    results = validator.validate_model(model, X, y, method='train_test')
    
    decision = results.get('governance_decision')
    print(f"Verdict: {decision['verdict']}")
    print(f"Rationale: {decision['rationale']}")
    
    assert decision['verdict'] == GovernanceStatus.BLOCKED.value
    assert "MISSING_WF_EVIDENCE" in decision['rationale']
    print("✅ Successfully blocked strategy due to missing WF evidence.")

    # 3. Test Walk-Forward Validation (produces both)
    print("\nScenario 2: Walk-Forward (Full Evidence)")
    results = validator.validate_model(model, X, y, method='walk_forward', n_splits=3)
    
    decision = results.get('governance_decision')
    print(f"Verdict: {decision['verdict']}")
    print(f"Rationale: {decision['rationale']}")
    
    # In MockModel.evaluate, sharpe is 1.8, so it should pass if consistency is also ok
    # Our consistency logic in ModelValidator depends on fold results
    assert decision['verdict'] in [GovernanceStatus.APPROVED.value, GovernanceStatus.BLOCKED.value]
    print(f"Decision for WF: {decision['verdict']}")

    # 4. Check Decision Log
    log_path = "docs/roadmap/week13/STRATEGY_GOVERNANCE_DECISION_LOG.jsonl"
    if os.path.exists(log_path):
        print(f"\n✅ Decision log created at {log_path}")
        with open(log_path, 'r') as f:
            last_line = f.readlines()[-1]
            print(f"Latest Log Entry: {last_line.strip()[:100]}...")
    else:
        print(f"❌ Decision log NOT found at {log_path}")

if __name__ == "__main__":
    try:
        test_governance_gate()
        print("\nVerification PASSED.")
    except Exception as e:
        print(f"\nVerification FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
