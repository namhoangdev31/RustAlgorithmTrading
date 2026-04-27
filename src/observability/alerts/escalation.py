"""
Incident Escalation Manager.

Handles incident lifecycle: alert -> acknowledge -> triage -> mitigation -> verify -> closeout -> postmortem.
Enforces SLA targets: P0 <= 5m, P1 <= 15m.
"""
import asyncio
import time
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4

from loguru import logger


class IncidentSeverity(Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class IncidentStatus(Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    TRIAGED = "TRIAGED"
    MITIGATED = "MITIGATED"
    VERIFIED = "VERIFIED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Incident:
    """Standardized Incident model."""

    def __init__(
        self,
        alert_id: str,
        severity: IncidentSeverity,
        component: str,
        reason_code: str,
        correlation_id: str,
    ):
        self.incident_id = f"W11-INC-{int(time.time())}-{uuid4().hex[:4].upper()}"
        self.alert_id = alert_id
        self.severity = severity
        self.component = component
        self.reason_code = reason_code
        self.correlation_id = correlation_id
        self.status = IncidentStatus.NEW
        self.created_at = time.time()
        self.acknowledged_at: Optional[float] = None
        self.mitigated_at: Optional[float] = None
        self.verified_at: Optional[float] = None
        self.resolved_at: Optional[float] = None
        self.owner: Optional[str] = None
        self.verify_evidence: Optional[str] = None
        self.actions: List[Dict[str, any]] = []

    def to_dict(self) -> dict:
        return {
            "incident_id": self.incident_id,
            "alert_id": self.alert_id,
            "severity": self.severity.value,
            "status": self.status.value,
            "component": self.component,
            "reason_code": self.reason_code,
            "correlation_id": self.correlation_id,
            "uptime_seconds": time.time() - self.created_at,
            "owner": self.owner,
            "ack_time": self.acknowledged_at - self.created_at if self.acknowledged_at else None,
            "verify_evidence": self.verify_evidence,
        }


class EscalationManager:
    """Manage incident escalations and SLA enforcement."""

    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.escalation_matrix = {
            IncidentSeverity.P0: {"owner": "primary_on_call", "backup": "manager", "sla_ack": 300},  # 5m
            IncidentSeverity.P1: {"owner": "secondary_on_call", "backup": "primary_on_call", "sla_ack": 900},  # 15m
        }

    async def create_incident(self, alert_data: dict) -> Incident:
        """Create a new incident from alert data."""
        severity = IncidentSeverity[alert_data.get("severity", "P2").upper()]
        incident = Incident(
            alert_id=alert_data.get("alert_id", "UNKNOWN"),
            severity=severity,
            component=alert_data.get("component", "UNKNOWN"),
            reason_code=alert_data.get("reason_code", "UNKNOWN"),
            correlation_id=alert_data.get("correlation_id", "UNKNOWN"),
        )
        self.incidents[incident.incident_id] = incident
        
        logger.warning(
            f"[cid:{incident.correlation_id}] Incident CREATED: {incident.incident_id} "
            f"({severity.value}) for {incident.component}"
        )
        return incident

    async def acknowledge_incident(self, incident_id: str, owner: str):
        """Acknowledge an incident and stop SLA timer."""
        if incident_id in self.incidents:
            incident = self.incidents[incident_id]
            incident.status = IncidentStatus.ACKNOWLEDGED
            incident.acknowledged_at = time.time()
            incident.owner = owner
            
            ack_time = incident.acknowledged_at - incident.created_at
            sla_target = self.escalation_matrix.get(incident.severity, {}).get("sla_ack", 3600)
            
            status = "PASS" if ack_time <= sla_target else "FAIL"
            logger.info(
                f"[cid:{incident.correlation_id}] Incident ACKNOWLEDGED by {owner}: {incident_id} "
                f"(Ack Time: {ack_time:.1f}s, SLA: {status})"
            )
            return True
        return False

    async def resolve_incident(self, incident_id: str, verify_evidence: str):
        """Resolve incident - REQUIRES evidence (Lane C)."""
        if incident_id in self.incidents:
            incident = self.incidents[incident_id]
            if not verify_evidence:
                raise ValueError("Resolution REQUIRES verify_evidence (W11 hard-gate)")
                
            incident.status = IncidentStatus.RESOLVED
            incident.verify_evidence = verify_evidence
            incident.resolved_at = time.time()
            
            logger.success(
                f"[cid:{incident.correlation_id}] Incident RESOLVED: {incident_id} "
                f"(Evidence: {verify_evidence})"
            )
            return True
        return False
