package domain

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/cel-go/cel"
)

type PolicyDefinition struct {
	SchemaVersion int          `json:"schemaVersion"`
	Language      string       `json:"language"`
	Rules         []PolicyRule `json:"rules"`
}

type PolicyRule struct {
	ID         string `json:"id"`
	Effect     string `json:"effect"`
	Expression string `json:"expression"`
}

type PolicyResult struct {
	Decision string        `json:"decision"`
	Matches  []PolicyMatch `json:"matches"`
}

type PolicyMatch struct {
	RuleID  string `json:"ruleId"`
	Effect  string `json:"effect"`
	Matched bool   `json:"matched"`
}

func EvaluatePolicy(ctx context.Context, raw json.RawMessage, findings []Finding, requiredFailures int, overallScore, confidence float64) (PolicyResult, error) {
	var definition PolicyDefinition
	if err := json.Unmarshal(raw, &definition); err != nil {
		return PolicyResult{}, fmt.Errorf("decode policy: %w", err)
	}
	if definition.SchemaVersion != 1 || definition.Language != "cel" || len(definition.Rules) == 0 {
		return PolicyResult{}, errors.New("unsupported or empty verification policy")
	}
	environment, err := cel.NewEnv(
		cel.Variable("findings", cel.ListType(cel.DynType)), cel.Variable("requiredFailures", cel.IntType),
		cel.Variable("overallScore", cel.DoubleType), cel.Variable("confidence", cel.DoubleType),
	)
	if err != nil {
		return PolicyResult{}, err
	}
	inputFindings := make([]map[string]any, 0, len(findings))
	for _, finding := range findings {
		inputFindings = append(inputFindings, map[string]any{"ruleId": finding.RuleID, "severity": finding.Severity, "dimension": finding.Dimension, "confidence": finding.Confidence})
	}
	result := PolicyResult{Decision: "allow"}
	precedence := map[string]int{"allow": 0, "warn": 1, "review": 2, "reject": 3}
	for _, rule := range definition.Rules {
		if _, ok := precedence[rule.Effect]; !ok {
			return PolicyResult{}, fmt.Errorf("policy rule %s has unsupported effect %s", rule.ID, rule.Effect)
		}
		ast, issues := environment.Compile(rule.Expression)
		if issues != nil && issues.Err() != nil {
			return PolicyResult{}, fmt.Errorf("compile policy rule %s: %w", rule.ID, issues.Err())
		}
		program, err := environment.Program(ast)
		if err != nil {
			return PolicyResult{}, err
		}
		value, _, err := program.ContextEval(ctx, map[string]any{"findings": inputFindings, "requiredFailures": int64(requiredFailures), "overallScore": overallScore, "confidence": confidence})
		if err != nil {
			return PolicyResult{}, fmt.Errorf("evaluate policy rule %s: %w", rule.ID, err)
		}
		matched, ok := value.Value().(bool)
		if !ok {
			return PolicyResult{}, fmt.Errorf("policy rule %s did not return boolean", rule.ID)
		}
		result.Matches = append(result.Matches, PolicyMatch{RuleID: rule.ID, Effect: rule.Effect, Matched: matched})
		if matched && precedence[rule.Effect] > precedence[result.Decision] {
			result.Decision = rule.Effect
		}
	}
	return result, nil
}
