"""
Model Validation Framework

Provides comprehensive validation for ML trading models including:
- Train/test split validation
- Out-of-time validation
- Walk-forward validation
- Performance metrics
"""

import numpy as np
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from .governance import GovernanceEvidence, StrategyGovernanceGate, StrategyDecision


@dataclass
class ValidationConfig:
    """Configuration for model validation."""

    test_size: float = 0.2
    validation_size: float = 0.1
    shuffle: bool = False  # Never shuffle time series
    random_state: int = 42


class ModelValidator:
    """
    Comprehensive model validation framework for trading strategies.

    Implements multiple validation strategies:
    - Simple train/test split
    - Train/validation/test split
    - Out-of-time validation
    - Walk-forward validation

    Example:
        >>> validator = ModelValidator()
        >>> results = validator.validate_model(model, X, y, method='walk_forward')
        >>> print(f"Test accuracy: {results['test_metrics']['accuracy']:.3f}")
    """

    def __init__(self, config: Optional[ValidationConfig] = None):
        """
        Initialize model validator.

        Args:
            config: Validation configuration
        """
        self.config = config or ValidationConfig()
        self.validation_results: Dict = {}
        self.governance_gate = StrategyGovernanceGate()
        self.last_decision: Optional[StrategyDecision] = None

    def train_test_split(
        self, X: np.ndarray, y: np.ndarray, test_size: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data into train and test sets (time-aware).

        Args:
            X: Feature array
            y: Target array
            test_size: Proportion of data for testing

        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        test_size = test_size or self.config.test_size
        split_idx = int(len(X) * (1 - test_size))

        X_train = X[:split_idx]
        X_test = X[split_idx:]
        y_train = y[:split_idx]
        y_test = y[split_idx:]

        return X_train, X_test, y_train, y_test

    def train_val_test_split(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: Optional[float] = None,
        val_size: Optional[float] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data into train, validation, and test sets.

        Args:
            X: Feature array
            y: Target array
            test_size: Proportion for testing
            val_size: Proportion for validation

        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        test_size = test_size or self.config.test_size
        val_size = val_size or self.config.validation_size

        # Split off test set
        test_idx = int(len(X) * (1 - test_size))
        X_temp, X_test = X[:test_idx], X[test_idx:]
        y_temp, y_test = y[:test_idx], y[test_idx:]

        # Split train and validation
        val_idx = int(len(X_temp) * (1 - val_size / (1 - test_size)))
        X_train, X_val = X_temp[:val_idx], X_temp[val_idx:]
        y_train, y_val = y_temp[:val_idx], y_temp[val_idx:]

        return X_train, X_val, X_test, y_train, y_val, y_test

    def validate_model(
        self, model, X: np.ndarray, y: np.ndarray, method: str = "train_test", **kwargs
    ) -> Dict:
        """
        Validate model using specified method.

        Args:
            model: ML model to validate (must have train, predict, evaluate methods)
            X: Feature array
            y: Target array
            method: Validation method ('train_test', 'train_val_test', 'walk_forward')
            **kwargs: Additional parameters for validation method

        Returns:
            Dictionary with validation results
        """
        if method == "train_test":
            results = self._validate_train_test(model, X, y, **kwargs)
        elif method == "train_val_test":
            results = self._validate_train_val_test(model, X, y, **kwargs)
        elif method == "walk_forward":
            results = self._validate_walk_forward(model, X, y, **kwargs)
        else:
            raise ValueError(f"Unknown validation method: {method}")

        # WEEK 13: Enforce Strategy Governance Gate
        evidence = self._capture_governance_evidence(results)
        strategy_id = getattr(model, "name", "unknown_strategy")
        decision = self.governance_gate.evaluate_strategy(strategy_id, evidence)
        self.last_decision = decision

        # Log decision for traceability
        log_path = os.path.join(
            os.getcwd(), "docs/roadmap/week13/STRATEGY_GOVERNANCE_DECISION_LOG.jsonl"
        )
        self.governance_gate.log_decision(decision, log_path)

        results["governance_decision"] = {
            "verdict": decision.verdict.value,
            "rationale": decision.rationale,
            "timestamp": decision.timestamp.isoformat(),
        }

        return results

    def _capture_governance_evidence(self, results: Dict) -> GovernanceEvidence:
        evidence = GovernanceEvidence()

        method = results.get("method")
        if method == "train_test":
            evidence.oos_results = results.get("test_metrics", {})
            evidence.drift_metrics = {
                "max_pct_drift": 0.0,
                "risk_impact_flag": False,
            }
        elif method == "train_val_test":
            evidence.oos_results = results.get("test_metrics", {})
            evidence.drift_metrics = {
                "max_pct_drift": 0.0,
                "risk_impact_flag": False,
            }
        elif method == "walk_forward":
            avg_metrics = results.get("avg_metrics", {})
            fold_results = results.get("fold_results", [])
            evidence.walk_forward_results = {
                "avg_metrics": avg_metrics,
                "consistency_score": self._calculate_consistency(fold_results),
            }
            evidence.oos_results = avg_metrics
            evidence.drift_metrics = {
                "max_pct_drift": self._calculate_max_pct_drift(fold_results, avg_metrics),
                "risk_impact_flag": False,
            }

        return evidence

    def _calculate_consistency(self, fold_results: List[Dict]) -> float:
        if not fold_results:
            return 0.0

        passed_folds = 0
        for fold in fold_results:
            metrics = fold.get("test_metrics", {})
            if metrics.get("sharpe_ratio", 0) > 0 or metrics.get("accuracy", 0) > 0.5:
                passed_folds += 1

        return passed_folds / len(fold_results)

    def _calculate_max_pct_drift(self, fold_results: List[Dict], avg_metrics: Dict) -> float:
        if not fold_results or not avg_metrics:
            return 0.0

        max_drift = 0.0
        for fold in fold_results:
            metrics = fold.get("test_metrics", {})
            for key, avg_value in avg_metrics.items():
                fold_value = metrics.get(key)
                if isinstance(fold_value, (int, float)) and isinstance(avg_value, (int, float)):
                    denominator = max(abs(float(avg_value)), 1e-9)
                    drift = abs(float(fold_value) - float(avg_value)) / denominator
                    if drift > max_drift:
                        max_drift = drift
        return max_drift

    def _validate_train_test(self, model, X: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Validate using simple train/test split."""
        X_train, X_test, y_train, y_test = self.train_test_split(
            X, y, test_size=kwargs.get("test_size")
        )

        # Train model
        train_metrics = model.train(X_train, y_train)

        # Evaluate on test set
        test_metrics = model.evaluate(X_test, y_test)

        results = {
            "method": "train_test",
            "train_size": len(X_train),
            "test_size": len(X_test),
            "train_metrics": train_metrics,
            "test_metrics": test_metrics,
            "model_metadata": model.get_metadata(),
        }

        self.validation_results = results
        return results

    def _validate_train_val_test(self, model, X: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Validate using train/validation/test split."""
        X_train, X_val, X_test, y_train, y_val, y_test = self.train_val_test_split(
            X, y, test_size=kwargs.get("test_size"), val_size=kwargs.get("val_size")
        )

        # Train model
        train_metrics = model.train(X_train, y_train)

        # Evaluate on validation set (for hyperparameter tuning)
        val_metrics = model.evaluate(X_val, y_val)

        # Final evaluation on test set
        test_metrics = model.evaluate(X_test, y_test)

        results = {
            "method": "train_val_test",
            "train_size": len(X_train),
            "val_size": len(X_val),
            "test_size": len(X_test),
            "train_metrics": train_metrics,
            "val_metrics": val_metrics,
            "test_metrics": test_metrics,
            "model_metadata": model.get_metadata(),
        }

        self.validation_results = results
        return results

    def _validate_walk_forward(
        self,
        model,
        X: np.ndarray,
        y: np.ndarray,
        n_splits: int = 5,
        min_train_size: int = 100,
        **kwargs,
    ) -> Dict:
        """
        Walk-forward validation (expanding window).

        Args:
            model: Model to validate
            X: Features
            y: Targets
            n_splits: Number of forward steps
            min_train_size: Minimum training samples

        Returns:
            Validation results with metrics from each fold
        """
        step_size = (len(X) - min_train_size) // n_splits
        fold_results = []

        for i in range(n_splits):
            # Expanding window
            train_end = min_train_size + (i * step_size)
            test_start = train_end
            test_end = test_start + step_size

            if test_end > len(X):
                break

            X_train = X[:train_end]
            y_train = y[:train_end]
            X_test = X[test_start:test_end]
            y_test = y[test_start:test_end]

            # Train and evaluate
            model.train(X_train, y_train)
            test_metrics = model.evaluate(X_test, y_test)

            fold_results.append(
                {
                    "fold": i + 1,
                    "train_size": len(X_train),
                    "test_size": len(X_test),
                    "test_metrics": test_metrics,
                }
            )

        # Aggregate metrics
        avg_metrics = self._aggregate_fold_metrics(fold_results)

        results = {
            "method": "walk_forward",
            "n_splits": len(fold_results),
            "fold_results": fold_results,
            "avg_metrics": avg_metrics,
            "std_metrics": self._std_fold_metrics(fold_results),
            "model_metadata": model.get_metadata(),
        }

        self.validation_results = results
        return results

    def _aggregate_fold_metrics(self, fold_results: List[Dict]) -> Dict:
        if not fold_results:
            return {}
        metric_keys = fold_results[0]["test_metrics"].keys()
        avg_metrics = {}
        for key in metric_keys:
            values = [fold["test_metrics"][key] for fold in fold_results]
            avg_metrics[key] = np.mean(values)

        return avg_metrics

    def _std_fold_metrics(self, fold_results: List[Dict]) -> Dict:
        if not fold_results:
            return {}

        metric_keys = fold_results[0]["test_metrics"].keys()

        std_metrics = {}
        for key in metric_keys:
            values = [fold["test_metrics"][key] for fold in fold_results]
            std_metrics[key] = np.std(values)

        return std_metrics

    def get_validation_report(self) -> str:
        """
        Generate a validation report.

        Returns:
            Formatted string with validation results
        """
        if not self.validation_results:
            return "No validation results available"

        report = []
        report.append("=" * 60)
        report.append("MODEL VALIDATION REPORT")
        report.append("=" * 60)
        report.append(f"Method: {self.validation_results['method']}")
        report.append("")

        if self.validation_results["method"] == "walk_forward":
            report.append(f"Number of folds: {self.validation_results['n_splits']}")
            report.append("")
            report.append("Average Test Metrics:")
            for key, value in self.validation_results["avg_metrics"].items():
                std = self.validation_results["std_metrics"][key]
                report.append(f"  {key}: {value:.4f} (±{std:.4f})")
        else:
            report.append("Test Metrics:")
            for key, value in self.validation_results["test_metrics"].items():
                report.append(f"  {key}: {value:.4f}")

        report.append("")
        report.append("Model Assumptions:")
        for assumption in self.validation_results["model_metadata"]["assumptions"]:
            report.append(f"  - {assumption}")

        report.append("")
        report.append("Model Limitations:")
        for limitation in self.validation_results["model_metadata"]["limitations"]:
            report.append(f"  - {limitation}")

        report.append("=" * 60)

        return "\n".join(report)
