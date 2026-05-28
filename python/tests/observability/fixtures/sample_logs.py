import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple


class StructuredLogValidator:
    @staticmethod
    def validate_log(log: Dict[str, Any]) -> bool:
        required_fields = ["timestamp", "level", "message", "correlation_id", "service"]
        return all(f in log for f in required_fields)

    @staticmethod
    def validate_batch(logs: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        errors = []
        for i, log in enumerate(logs):
            if not StructuredLogValidator.validate_log(log):
                errors.append(f"Log {i} is invalid: {log}")
        return len(errors) == 0, errors


class LogDataGenerator:
    @staticmethod
    def generate_single_log(
        level="INFO",
        service="trading-engine",
        message="Test message",
        metadata=None,
        correlation_id=None,
    ) -> Dict[str, Any]:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat()[:-6] + "Z",
            "level": level,
            "message": message,
            "correlation_id": correlation_id or f"corr-{uuid.uuid4().hex[:8]}",
            "service": service,
            "metadata": metadata or {},
        }

    @staticmethod
    def generate_batch(count=100, correlation_id=None) -> List[Dict[str, Any]]:
        logs = []
        current_corr = correlation_id or f"corr-{uuid.uuid4().hex[:8]}"
        for i in range(count):
            if correlation_id is None and i > 0 and i % 10 == 0:
                current_corr = f"corr-{uuid.uuid4().hex[:8]}"
            logs.append(
                LogDataGenerator.generate_single_log(
                    message=f"Batch log {i}", correlation_id=current_corr
                )
            )
            time.sleep(0.001)  # Ensure monotonic timestamp increases
        return logs

    @staticmethod
    def generate_trade_execution_logs(order_id: str, correlation_id: str) -> List[Dict[str, Any]]:
        stages = ["received", "risk_check", "submitted", "filled"]
        logs = []
        for stage in stages:
            logs.append(
                LogDataGenerator.generate_single_log(
                    message=f"Order {stage}",
                    correlation_id=correlation_id,
                    metadata={"order_id": order_id, "stage": stage},
                )
            )
            time.sleep(0.001)
        return logs

    @staticmethod
    def generate_error_logs(error_type: str, severity: str) -> List[Dict[str, Any]]:
        corr_id = f"corr-{uuid.uuid4().hex[:8]}"
        logs = [
            LogDataGenerator.generate_single_log(
                level="WARNING", message="Retrying...", correlation_id=corr_id
            ),
            LogDataGenerator.generate_single_log(
                level=severity,
                message=f"Failed with {error_type}",
                correlation_id=corr_id,
                metadata={"error": error_type},
            ),
            LogDataGenerator.generate_single_log(
                level="INFO", message="Handled error", correlation_id=corr_id
            ),
        ]
        return logs
