package domain

import "testing"

func TestScoreWeakDimensionCannotBeHidden(t *testing.T) {
	_, overall, confidence := Score([]Finding{{Dimension: "security", Severity: "critical", Confidence: 1}}, []float64{1, 1, 1, 1})
	if overall >= 90 {
		t.Fatalf("expected geometric mean to expose weak security score, got %v", overall)
	}
	if confidence != 100 {
		t.Fatalf("expected independent confidence, got %v", confidence)
	}
}

func TestScoreClampsConfidenceInputs(t *testing.T) {
	_, _, confidence := Score(nil, []float64{-1, 2})
	if confidence != 50 {
		t.Fatalf("expected clamped confidence 50, got %v", confidence)
	}
}
