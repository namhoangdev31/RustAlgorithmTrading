"""
Dedicated tests for Incident Management API.
Covers /incidents, /acknowledge, /resolve and error handling.
"""
import pytest
from fastapi.testclient import TestClient
from ..observability.api.main import app
from ..observability.alerts.escalation import IncidentSeverity

client = TestClient(app)

@pytest.mark.asyncio
async def test_incident_lifecycle_api():
    """Test full incident lifecycle via REST API."""
    from ..observability.api.main import api_state
    from ..observability.metrics.system_collector import SystemCollector
    
    # Initialize system collector for testing
    if "system" not in api_state.collectors:
        api_state.collectors["system"] = SystemCollector()
        await api_state.collectors["system"].start()

    # 1. Check empty incidents
    response = client.get("/incidents")
    assert response.status_code == 200
    assert response.json() == {}

    # 2. Inject an incident (simulated alert)
    # We use a trick here since the API doesn't have a public "create_incident" route
    # but the system collector handles it. For testing, we'll manually trigger it
    # via the app instance if possible, or just mock it.
    from ..observability.api.main import api_state
    system_collector = api_state.collectors.get("system")
    incident = await system_collector.escalation.create_incident({
        "alert_id": "TEST-001",
        "severity": "P0",
        "component": "test_component",
        "reason_code": "TEST_REASON",
        "correlation_id": "TEST-CID-123"
    })
    
    # 3. Verify it shows up in GET /incidents
    response = client.get("/incidents")
    data = response.json()
    assert incident.incident_id in data
    assert data[incident.incident_id]["severity"] == "P0" # Contract match P0
    assert data[incident.incident_id]["status"] == "NEW"

    # 4. Acknowledge it
    response = client.post(f"/incidents/{incident.incident_id}/acknowledge?owner=test_ops")
    assert response.status_code == 200
    assert response.json()["status"] == "ACKNOWLEDGED"

    # 5. Resolve it (should fail without evidence)
    response = client.post(f"/incidents/{incident.incident_id}/resolve?evidence=")
    assert response.status_code == 400 # Validation error

    # 6. Resolve it (should succeed with evidence)
    response = client.post(f"/incidents/{incident.incident_id}/resolve?evidence=verified_via_test")
    assert response.status_code == 200
    assert response.json()["status"] == "RESOLVED"

    # 7. Check final status
    response = client.get("/incidents")
    assert response.json()[incident.incident_id]["status"] == "RESOLVED"

@pytest.mark.asyncio
async def test_incident_not_found():
    """Verify 404 behavior for missing incidents."""
    from ..observability.api.main import api_state
    if "system" not in api_state.collectors:
        from ..observability.metrics.system_collector import SystemCollector
        api_state.collectors["system"] = SystemCollector()
        await api_state.collectors["system"].start()

    response = client.post("/incidents/INVALID-ID/acknowledge?owner=test")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

    response = client.post("/incidents/INVALID-ID/resolve?evidence=test")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
