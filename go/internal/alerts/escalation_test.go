package alerts

import "testing"

func TestIncidentLifecycle(t *testing.T) {
	m := NewManager()
	inc := m.Create(map[string]interface{}{"severity": "P0", "component": "risk", "reason_code": "RISK_BLOCK", "correlation_id": "cid-1"})
	if inc.Status != StatusNew {
		t.Fatalf("expected NEW got %s", inc.Status)
	}
	ack, err := m.Acknowledge(inc.ID, "ops")
	if err != nil {
		t.Fatal(err)
	}
	if ack.Status != StatusAcknowledged {
		t.Fatalf("expected ACKNOWLEDGED got %s", ack.Status)
	}
	res, err := m.Resolve(inc.ID, "verified")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status != StatusResolved {
		t.Fatalf("expected RESOLVED got %s", res.Status)
	}
}

func TestResolveRequiresEvidence(t *testing.T) {
	m := NewManager()
	inc := m.Create(nil)
	_, err := m.Resolve(inc.ID, "")
	if err == nil {
		t.Fatal("expected evidence error")
	}
}
