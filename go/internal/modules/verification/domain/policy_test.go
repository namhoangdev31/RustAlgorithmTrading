package domain

import (
	"context"
	"encoding/json"
	"testing"
)

func TestEvaluatePolicyHardGateWins(t *testing.T) {
	definition := json.RawMessage(`{"schemaVersion":1,"language":"cel","rules":[{"id":"warning","effect":"warn","expression":"overallScore < 90.0"},{"id":"archive","effect":"reject","expression":"findings.exists(f, f.ruleId == 'MALICIOUS_ARCHIVE')"}]}`)
	result, err := EvaluatePolicy(context.Background(), definition, []Finding{{RuleID: "MALICIOUS_ARCHIVE", Severity: "critical"}}, 0, 85, 100)
	if err != nil {
		t.Fatal(err)
	}
	if result.Decision != "reject" {
		t.Fatalf("expected reject, got %s", result.Decision)
	}
}
