from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

_AUTO_TIMESTAMP = object()


class StagingHardeningRecord(BaseModel):
    run_id: str
    scenario_id: str
    disposition: str
    reason_code: str
    component: str
    correlation_id: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)
    owner: str
    eta: str
    latency_sec: Optional[float] = None
    rollback_success: Optional[bool] = None
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)


class StagingHardeningManager:
    """Manager for staging hardening verification and evidence capture."""

    def __init__(self, owner: str = "tester"):
        self.owner = owner
        self.records: List[StagingHardeningRecord] = []

    def build_record(
        self,
        run_id: str,
        scenario_id: str,
        disposition: str,
        reason_code: str,
        component: str,
        correlation_id: Optional[str] = None,
        evidence_ids: Optional[List[str]] = None,
        eta: str = "IMMEDIATE",
        latency_sec: Optional[float] = None,
        rollback_success: Optional[bool] = None,
        timestamp: Any = _AUTO_TIMESTAMP,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> StagingHardeningRecord:
        evidence_ids = evidence_ids or []
        metadata = metadata or {}
        record_timestamp = datetime.now(timezone.utc) if timestamp is _AUTO_TIMESTAMP else timestamp

        # Policy enforcement
        if not correlation_id:
            disposition = "BLOCKED"
            reason_code = "MISSING_CORRELATION_ID"

        if "ROLLBACK" in scenario_id.upper() and rollback_success is None:
            disposition = "BLOCKED"
            reason_code = "MISSING_ROLLBACK_EVIDENCE"

        if "KILL_SWITCH" in scenario_id.upper() and (
            latency_sec is None or record_timestamp is None
        ):
            disposition = "BLOCKED"
            reason_code = "MISSING_LATENCY_METRIC"

        record = StagingHardeningRecord(
            run_id=run_id,
            scenario_id=scenario_id,
            disposition=disposition,
            reason_code=reason_code,
            component=component,
            correlation_id=correlation_id,
            evidence_ids=evidence_ids,
            owner=self.owner,
            eta=eta,
            latency_sec=latency_sec,
            rollback_success=rollback_success,
            timestamp=record_timestamp,
            metadata=metadata,
        )
        self.records.append(record)
        return record

    def get_summary(self) -> Dict[str, Any]:
        """Calculate metrics based on captured records."""
        kill_switch_latencies = [
            r.latency_sec
            for r in self.records
            if r.latency_sec is not None and "KILL_SWITCH" in r.scenario_id.upper()
        ]
        rollback_results = [
            r.rollback_success
            for r in self.records
            if r.rollback_success is not None and "ROLLBACK" in r.scenario_id.upper()
        ]

        max_kill_switch_latency = max(kill_switch_latencies) if kill_switch_latencies else 0.0
        rollback_success_rate = (
            sum(1 for r in rollback_results if r) / len(rollback_results)
            if rollback_results
            else 1.0
        )
        alert_records = [r for r in self.records if "ALERT" in r.scenario_id.upper()]
        alert_fp_rate = max(
            (float(r.metadata.get("fp_rate", 0.0)) for r in alert_records), default=0.0
        )
        critical_fn_count = sum(int(r.metadata.get("fn_count", 0)) for r in alert_records)
        throughput_watermark = max(
            (int(r.metadata.get("throughput", 0)) for r in self.records), default=0
        )

        return {
            "kill_switch_latency_sec": max_kill_switch_latency,
            "rollback_success_rate": rollback_success_rate,
            "alert_fp_rate": alert_fp_rate,
            "critical_fn_count": critical_fn_count,
            "throughput_watermark": throughput_watermark,
            "total_records": len(self.records),
            "blocked_count": sum(1 for r in self.records if r.disposition == "BLOCKED"),
            "pass_count": sum(1 for r in self.records if r.disposition == "PASS"),
        }
