package zmqbridge

import "testing"

func TestBuildAndDecodeStrict(t *testing.T) {
	e := BuildEnvelope("cid-1", "SignalGenerated", map[string]any{"type": "SignalGenerated"})
	raw, err := Encode(e)
	if err != nil {
		t.Fatal(err)
	}
	decoded, err := Decode(raw, true)
	if err != nil {
		t.Fatal(err)
	}
	if decoded.CorrelationID != "cid-1" {
		t.Fatalf("unexpected cid: %s", decoded.CorrelationID)
	}
}

func TestStrictSchemaMismatch(t *testing.T) {
	e := BuildEnvelope("cid-2", "SignalGenerated", map[string]any{})
	e.SchemaVersion = "v9.9.9"
	raw, _ := Encode(e)
	_, err := Decode(raw, true)
	if err == nil {
		t.Fatal("expected schema mismatch error")
	}
}

func TestMissingFields(t *testing.T) {
	raw := []byte(`{"schema_version":"v1.0.0"}`)
	_, err := Decode(raw, true)
	if err == nil {
		t.Fatal("expected validation error")
	}
}
