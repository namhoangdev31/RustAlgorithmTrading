package executor

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	verificationarchive "trading/control-gateway/internal/modules/verification/archive"
	"trading/control-gateway/internal/modules/verification/domain"
	platformconfig "trading/control-gateway/internal/platform/config"
)

type localEvidence struct {
	Kind, Path, ContentType string
}

type engineOutput struct {
	Status          string             `json:"status"`
	Findings        []domain.Finding   `json:"findings"`
	Metrics         map[string]float64 `json:"metrics"`
	Coverage        float64            `json:"coverage"`
	Completeness    float64            `json:"completeness"`
	Reproducibility float64            `json:"reproducibility"`
	EngineHealth    float64            `json:"engineHealth"`
	ErrorCode       string             `json:"errorCode,omitempty"`
	ErrorMessage    string             `json:"errorMessage,omitempty"`
	Evidence        []localEvidence    `json:"evidence,omitempty"`
}

type EngineRunner struct {
	store         *ObjectStore
	browserRunner string
}

func NewEngineRunner(store *ObjectStore, browserRunner string) *EngineRunner {
	if browserRunner == "" {
		browserRunner = "/opt/lepoship/browser-runner.mjs"
	}
	return &EngineRunner{store: store, browserRunner: browserRunner}
}

func (r *EngineRunner) Execute(ctx context.Context, dispatch domain.Dispatch, archivePath, workspace string) domain.ResultEnvelope {
	started := time.Now().UTC()
	result := domain.ResultEnvelope{
		SchemaVersion: "verification-result.v1", AttemptID: dispatch.AttemptID, LeaseOwner: dispatch.LeaseOwner,
		EngineDigest: dispatch.EngineDigest, ArtifactChecksum: dispatch.Artifact.ChecksumSHA256,
		Status: "infrastructure_failed", Findings: []domain.Finding{}, Evidence: []domain.Evidence{}, Metrics: map[string]float64{},
		StartedAt: started,
	}
	extracted := filepath.Join(workspace, "bundle")
	if err := os.MkdirAll(extracted, 0o700); err != nil {
		return failedResult(result, "WORKSPACE_FAILED", err)
	}
	if _, err := verificationarchive.Extract(archivePath, extracted); err != nil {
		result.Status = "bundle_failed"
		result.Findings = []domain.Finding{finding("security", "critical", "MALICIOUS_ARCHIVE", err.Error(), true)}
		result.Coverage, result.Completeness, result.Reproducibility, result.EngineHealth = 1, 1, 1, 1
		result.CompletedAt = time.Now().UTC()
		return result
	}
	var output engineOutput
	switch dispatch.Engine {
	case "bundle-validator":
		output = validateBundle(extracted)
	case "security-suite":
		output = runSecurity(ctx, workspace, extracted)
	case "playwright-runtime", "axe-accessibility", "lighthouse-performance":
		output = r.runBrowser(ctx, dispatch, workspace, extracted)
	default:
		output = engineOutput{Status: "infrastructure_failed", ErrorCode: "ENGINE_NOT_SUPPORTED", ErrorMessage: "unsupported engine: " + dispatch.Engine}
	}
	result.Status, result.Findings, result.Metrics = output.Status, output.Findings, output.Metrics
	result.Coverage, result.Completeness = output.Coverage, output.Completeness
	result.Reproducibility, result.EngineHealth = output.Reproducibility, output.EngineHealth
	result.ErrorCode, result.ErrorMessage = output.ErrorCode, output.ErrorMessage
	for _, item := range output.Evidence {
		evidence, err := r.store.UploadEvidence(ctx, dispatch.RunID, dispatch.AttemptID, item.Kind, item.ContentType, item.Path)
		if err != nil {
			return failedResult(result, "EVIDENCE_UPLOAD_FAILED", err)
		}
		result.Evidence = append(result.Evidence, evidence)
	}
	result.CompletedAt = time.Now().UTC()
	return result
}

func validateBundle(root string) engineOutput {
	count := 0
	hasIndex := false
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return errors.New("symlink is not permitted in a verified bundle")
		}
		if !entry.IsDir() {
			count++
			hasIndex = hasIndex || strings.EqualFold(filepath.Base(path), "index.html")
		}
		if count > 20_000 {
			return errors.New("bundle file limit exceeded")
		}
		return nil
	})
	if err != nil {
		return bundleFailure("BUNDLE_STRUCTURE_INVALID", err.Error())
	}
	if !hasIndex {
		return bundleFailure("MISSING_ENTRYPOINT", "bundle does not contain index.html")
	}
	return healthyOutput(map[string]float64{"files": float64(count)})
}

func runSecurity(ctx context.Context, workspace, root string) engineOutput {
	gitleaksPath := filepath.Join(workspace, "gitleaks.json")
	trivyPath := filepath.Join(workspace, "trivy.json")
	sbomPath := filepath.Join(workspace, "sbom.cdx.json")
	osvPath := filepath.Join(workspace, "osv.json")
	semgrepPath := filepath.Join(workspace, "semgrep.json")

	tools := []struct {
		name         string
		args         []string
		findingOnOne bool
		outputPath   string
	}{
		{"clamscan", []string{"--recursive", "--infected", "--no-summary", root}, true, ""},
		{"gitleaks", []string{"detect", "--source", root, "--no-git", "--report-format", "json", "--report-path", gitleaksPath}, true, gitleaksPath},
		{"trivy", []string{"fs", "--quiet", "--format", "json", "--output", trivyPath, root}, false, trivyPath},
		{"syft", []string{"scan", "dir:" + root, "-o", "cyclonedx-json=" + sbomPath}, false, sbomPath},
		{"osv-scanner", []string{"scan", "source", "--recursive", root, "--format", "json", "--output", osvPath}, false, osvPath},
		{"semgrep", []string{"scan", "--config", "/opt/lepoship/semgrep-rules.yaml", "--json", "--json-output", semgrepPath, root}, false, semgrepPath},
	}
	summary := make(map[string]string, len(tools))
	findings := []domain.Finding{}

	for _, tool := range tools {
		output, err := command(ctx, workspace, 8<<20, tool.name, tool.args...)
		summary[tool.name] = output

		if err != nil {
			var exitErr *exec.ExitError
			if errors.As(err, &exitErr) {
				// If tool writes a structured output and file is valid, we can parse it anyway (even if exit code was non-zero)
				if tool.outputPath != "" {
					if fileInfo, statErr := os.Stat(tool.outputPath); statErr == nil && fileInfo.Size() > 0 {
						continue
					}
				}
				// Special exit code logic for findingOnOne
				if tool.findingOnOne && exitErr.ExitCode() == 1 {
					findings = append(findings, finding("security", "critical", "CONFIRMED_CRITICAL_" + strings.ToUpper(tool.name), tool.name + " reported a confirmed finding", true))
					continue
				}
			}
			return engineOutput{
				Status:       "infrastructure_failed",
				Metrics:      map[string]float64{},
				ErrorCode:    "SECURITY_TOOL_FAILED",
				ErrorMessage: tool.name + ": " + err.Error(),
			}
		}
	}

	// Now parse outputs of successfully run tools
	if gitleaksFindings, err := parseGitleaks(gitleaksPath); err == nil {
		findings = append(findings, gitleaksFindings...)
	}
	if trivyFindings, err := parseTrivy(trivyPath); err == nil {
		findings = append(findings, trivyFindings...)
	}
	if osvFindings, err := parseOSV(osvPath); err == nil {
		findings = append(findings, osvFindings...)
	}
	if semgrepFindings, err := parseSemgrep(semgrepPath); err == nil {
		findings = append(findings, semgrepFindings...)
	}

	// Prepare evidence files
	evidence := []localEvidence{
		writeJSONEvidence(workspace, "security-summary.json", summary, "security-log"),
	}

	outputFiles := []struct {
		path string
		kind string
		mime string
	}{
		{gitleaksPath, "gitleaks-report", "application/json"},
		{trivyPath, "trivy-report", "application/json"},
		{sbomPath, "sbom-report", "application/json"},
		{osvPath, "osv-report", "application/json"},
		{semgrepPath, "semgrep-report", "application/json"},
	}

	for _, file := range outputFiles {
		if _, err := os.Stat(file.path); err == nil {
			evidence = append(evidence, localEvidence{
				Kind:        file.kind,
				Path:        file.path,
				ContentType: file.mime,
			})
		}
	}

	// Check if we have critical/high security findings
	status := "succeeded"
	for _, f := range findings {
		if f.Confirmed && (f.Severity == "critical" || f.Severity == "high") {
			status = "bundle_failed"
			break
		}
	}

	return engineOutput{
		Status:          status,
		Findings:        findings,
		Metrics:         map[string]float64{"scanners": float64(len(tools))},
		Coverage:        1,
		Completeness:    1,
		Reproducibility: 1,
		EngineHealth:    1,
		Evidence:        evidence,
	}
}

func parseGitleaks(path string) ([]domain.Finding, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var leaks []struct {
		Description string `json:"Description"`
		RuleID      string `json:"RuleID"`
		File        string `json:"File"`
		StartLine   int    `json:"StartLine"`
	}
	if err := json.Unmarshal(data, &leaks); err != nil {
		return nil, err
	}
	var findings []domain.Finding
	for _, leak := range leaks {
		findings = append(findings, domain.Finding{
			Fingerprint: makeFingerprint(fmt.Sprintf("gitleaks:%s:%s:%d", leak.RuleID, leak.File, leak.StartLine)),
			Dimension:   "security",
			Severity:    "critical",
			Confidence:  1.0,
			RuleID:      leak.RuleID,
			Title:       fmt.Sprintf("GitLeaks: %s in %s (line %d)", leak.Description, leak.File, leak.StartLine),
			Confirmed:   true,
		})
	}
	return findings, nil
}

func parseTrivy(path string) ([]domain.Finding, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var report struct {
		Results []struct {
			Target          string `json:"Target"`
			Vulnerabilities []struct {
				VulnerabilityID string `json:"VulnerabilityID"`
				PkgName         string `json:"PkgName"`
				Title           string `json:"Title"`
				Severity        string `json:"Severity"`
			} `json:"Vulnerabilities"`
		} `json:"Results"`
	}
	if err := json.Unmarshal(data, &report); err != nil {
		return nil, err
	}
	var findings []domain.Finding
	for _, res := range report.Results {
		for _, vuln := range res.Vulnerabilities {
			sev := strings.ToLower(vuln.Severity)
			if sev == "high" {
				sev = "high"
			} else if sev == "critical" {
				sev = "critical"
			} else if sev == "medium" {
				sev = "medium"
			} else {
				sev = "low"
			}
			findings = append(findings, domain.Finding{
				Fingerprint: makeFingerprint(fmt.Sprintf("trivy:%s:%s", vuln.VulnerabilityID, vuln.PkgName)),
				Dimension:   "security",
				Severity:    sev,
				Confidence:  1.0,
				RuleID:      vuln.VulnerabilityID,
				Title:       fmt.Sprintf("Trivy: %s in package %s (%s)", vuln.Title, vuln.PkgName, vuln.VulnerabilityID),
				Confirmed:   true,
			})
		}
	}
	return findings, nil
}

func parseOSV(path string) ([]domain.Finding, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var report struct {
		Results []struct {
			Source struct {
				Path string `json:"path"`
			} `json:"source"`
			Packages []struct {
				Package struct {
					Name    string `json:"name"`
					Version string `json:"version"`
				} `json:"package"`
				Vulnerabilities []struct {
					ID      string `json:"id"`
					Summary string `json:"summary"`
				} `json:"vulnerabilities"`
			} `json:"packages"`
		} `json:"results"`
	}
	if err := json.Unmarshal(data, &report); err != nil {
		return nil, err
	}
	var findings []domain.Finding
	for _, res := range report.Results {
		for _, pkg := range res.Packages {
			for _, vuln := range pkg.Vulnerabilities {
				findings = append(findings, domain.Finding{
					Fingerprint: makeFingerprint(fmt.Sprintf("osv:%s:%s", vuln.ID, pkg.Package.Name)),
					Dimension:   "security",
					Severity:    "high",
					Confidence:  1.0,
					RuleID:      vuln.ID,
					Title:       fmt.Sprintf("OSV: %s in %s@%s (%s)", vuln.Summary, pkg.Package.Name, pkg.Package.Version, vuln.ID),
					Confirmed:   true,
				})
			}
		}
	}
	return findings, nil
}

func parseSemgrep(path string) ([]domain.Finding, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var report struct {
		Results []struct {
			CheckID string `json:"check_id"`
			Path    string `json:"path"`
			Start   struct {
				Line int `json:"line"`
			} `json:"start"`
			Extra struct {
				Message  string `json:"message"`
				Severity string `json:"severity"`
			} `json:"extra"`
		} `json:"results"`
	}
	if err := json.Unmarshal(data, &report); err != nil {
		return nil, err
	}
	var findings []domain.Finding
	for _, res := range report.Results {
		sev := "high"
		if res.Extra.Severity == "ERROR" {
			sev = "critical"
		} else if res.Extra.Severity == "WARNING" {
			sev = "high"
		} else if res.Extra.Severity == "INFO" {
			sev = "medium"
		}
		findings = append(findings, domain.Finding{
			Fingerprint: makeFingerprint(fmt.Sprintf("semgrep:%s:%s:%d", res.CheckID, res.Path, res.Start.Line)),
			Dimension:   "security",
			Severity:    sev,
			Confidence:  1.0,
			RuleID:      res.CheckID,
			Title:       fmt.Sprintf("Semgrep: %s in %s (line %d)", res.Extra.Message, res.Path, res.Start.Line),
			Confirmed:   true,
		})
	}
	return findings, nil
}

func makeFingerprint(key string) string {
	digest := sha256.Sum256([]byte(key))
	return hex.EncodeToString(digest[:])
}

func (r *EngineRunner) runBrowser(ctx context.Context, dispatch domain.Dispatch, workspace, root string) engineOutput {
	inputPath := filepath.Join(workspace, "browser-input.json")
	payload, _ := json.Marshal(map[string]any{"engine": dispatch.Engine, "root": root, "workspace": workspace, "attemptId": dispatch.AttemptID, "configuration": json.RawMessage(dispatch.Configuration)})
	if err := os.WriteFile(inputPath, payload, 0o600); err != nil {
		return engineOutput{Status: "infrastructure_failed", ErrorCode: "BROWSER_INPUT_FAILED", ErrorMessage: err.Error()}
	}
	raw, err := command(ctx, workspace, 8<<20, "node", r.browserRunner, "--input", inputPath)
	if err != nil {
		return engineOutput{Status: "infrastructure_failed", ErrorCode: "BROWSER_RUNNER_FAILED", ErrorMessage: strings.TrimSpace(raw + " " + err.Error())}
	}
	var output engineOutput
	if err := json.Unmarshal([]byte(raw), &output); err != nil {
		return engineOutput{Status: "infrastructure_failed", ErrorCode: "BROWSER_RESULT_INVALID", ErrorMessage: err.Error()}
	}
	return output
}

func command(ctx context.Context, directory string, maxOutput int, name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.Dir = directory
	cmd.Env = platformconfig.SubprocessEnvironment(directory)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	var stdout, stderr limitedBuffer
	stdout.limit, stderr.limit = maxOutput, maxOutput
	cmd.Stdout, cmd.Stderr = &stdout, &stderr

	if err := cmd.Start(); err != nil {
		return "", err
	}

	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		<-done
		return strings.TrimSpace(stdout.String() + "\n" + stderr.String()), ctx.Err()
	case err := <-done:
		return strings.TrimSpace(stdout.String() + "\n" + stderr.String()), err
	}
}

type limitedBuffer struct {
	data  []byte
	limit int
}

func (b *limitedBuffer) Write(p []byte) (int, error) {
	n := len(p)
	remaining := b.limit - len(b.data)
	if remaining > 0 {
		if remaining < len(p) {
			p = p[:remaining]
		}
		b.data = append(b.data, p...)
	}
	return n, nil
}
func (b *limitedBuffer) String() string { return string(b.data) }

func finding(dimension, severity, ruleID, title string, confirmed bool) domain.Finding {
	digest := sha256.Sum256([]byte(dimension + ":" + ruleID + ":" + title))
	return domain.Finding{Fingerprint: hex.EncodeToString(digest[:]), Dimension: dimension, Severity: severity, Confidence: 1, RuleID: ruleID, Title: title, Confirmed: confirmed}
}

func healthyOutput(metrics map[string]float64) engineOutput {
	return engineOutput{Status: "succeeded", Metrics: metrics, Coverage: 1, Completeness: 1, Reproducibility: 1, EngineHealth: 1}
}
func bundleFailure(ruleID, title string) engineOutput {
	return engineOutput{Status: "bundle_failed", Findings: []domain.Finding{finding("bundle", "high", ruleID, title, true)}, Metrics: map[string]float64{}, Coverage: 1, Completeness: 1, Reproducibility: 1, EngineHealth: 1}
}
func failedResult(result domain.ResultEnvelope, code string, err error) domain.ResultEnvelope {
	result.Status = "infrastructure_failed"
	result.ErrorCode = code
	result.ErrorMessage = err.Error()
	result.Coverage = 0
	result.Completeness = 0
	result.Reproducibility = 0
	result.EngineHealth = 0
	result.CompletedAt = time.Now().UTC()
	return result
}
func writeJSONEvidence(workspace, name string, value any, kind string) localEvidence {
	path := filepath.Join(workspace, name)
	body, _ := json.Marshal(value)
	_ = os.WriteFile(path, body, 0o600)
	return localEvidence{Kind: kind, Path: path, ContentType: "application/json"}
}

var _ = fmt.Sprintf
