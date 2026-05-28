from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ControlStatus(Enum):
    ALLOW = "ALLOW"
    REJECT = "REJECT"
    DEFER = "DEFER"
    BLOCKED = "BLOCKED"


class ControlType(Enum):
    EXPOSURE = "EXPOSURE"
    CONCENTRATION = "CONCENTRATION"
    ALLOCATION = "ALLOCATION"


class ControlRecord(BaseModel):
    """
    Mandatory W14 Control Record for decision traceability.
    """

    portfolio_check_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    strategy_set_id: str
    control_type: ControlType
    status: ControlStatus
    owner: str
    limit_value: float
    measured_value: float
    breach_flag: bool
    decision_reason: str
    reason_code: Optional[str] = None
    evidence_ids: List[str]
    risk_impact_flag: bool
    next_action: str
    eta: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
