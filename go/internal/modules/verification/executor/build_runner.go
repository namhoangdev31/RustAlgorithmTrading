package executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"trading/control-gateway/internal/modules/verification/domain"
)

var safeBranch = regexp.MustCompile(`^[A-Za-z0-9._/-]+$`)

type buildEvent struct {
	SchemaVersion int `json:"schemaVersion"`
	Job           struct {
		ProjectID, BundleID, Version, TrackID, ReleaseID, BuildJobID string
		BuildNumber                                                  int `json:"buildNumber"`
		Config                                                       struct {
			Platform, GitRepoURL, GitBranch, FlutterTargetPlatform, FlutterBuildMode, FlutterFlavor string
		} `json:"config"`
	} `json:"job"`
}

type BuildRunner struct {
	repository BuildRepository
	store      *ObjectStore
	worker     string
}

type BuildCompletion struct {
	ProjectID, BundleID, ReleaseID, BuildJobID, SourceCommit, EventKey string
	BuildNumber                                                        int
	Artifact                                                           domain.ArtifactIdentity
}

type BuildRepository interface {
	Claim(context.Context, string, string) (bool, error)
	EnforcementMode(context.Context) (string, error)
	Complete(context.Context, BuildCompletion) error
	Heartbeat(context.Context, string, string) error
	AppendLog(context.Context, string, string, string) error
	Fail(context.Context, string, string, string, error) error
}

func NewBuildRunner(repository BuildRepository, store *ObjectStore, worker string) *BuildRunner {
	if worker == "" {
		worker = "lepoship-go-worker"
	}
	return &BuildRunner{repository: repository, store: store, worker: worker}
}

func (r *BuildRunner) Execute(ctx context.Context, eventKey string, payload json.RawMessage) error {
	var event buildEvent
	if err := json.Unmarshal(payload, &event); err != nil || event.SchemaVersion != 1 || event.Job.BuildJobID == "" {
		return errors.New("invalid bundle.build_requested.v1 payload")
	}
	job := event.Job
	if job.ReleaseID == "" {
		job.ReleaseID = job.TrackID
		event.Job.ReleaseID = job.ReleaseID
	}
	if job.ReleaseID == "" {
		return errors.New("bundle build event has no canonical releaseId")
	}
	claimed, err := r.repository.Claim(ctx, job.BuildJobID, r.worker)
	if err != nil || !claimed {
		return err
	}
	buildCtx, cancel := context.WithTimeout(ctx, 45*time.Minute)
	defer cancel()
	workspace, err := os.MkdirTemp("", "lepoship-build-"+job.BuildJobID+"-")
	if err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "WORKSPACE_FAILED", err)
	}
	defer os.RemoveAll(workspace)
	stopHeartbeat := make(chan struct{})
	go r.heartbeat(stopHeartbeat, job.BuildJobID)
	defer close(stopHeartbeat)
	log := func(level, message string) {
		_ = r.repository.AppendLog(context.Background(), job.BuildJobID, level, message)
	}
	log("info", fmt.Sprintf("Go build executor started build #%d", job.BuildNumber))

	repositoryURL, parseErr := url.Parse(job.Config.GitRepoURL)
	if parseErr != nil || (repositoryURL.Scheme != "https" && repositoryURL.Scheme != "http") || repositoryURL.Host == "" {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "INVALID_REPOSITORY", errors.New("repository must be an absolute HTTP(S) URL"))
	}
	if !safeBranch.MatchString(job.Config.GitBranch) {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "INVALID_BRANCH", errors.New("branch contains unsupported characters"))
	}
	source := filepath.Join(workspace, "source")
	if output, err := command(buildCtx, workspace, 8<<20, "git", "clone", "--depth", "1", "--single-branch", "--branch", job.Config.GitBranch, job.Config.GitRepoURL, source); err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "GIT_CLONE_FAILED", fmt.Errorf("%s: %w", output, err))
	}
	commit, err := command(buildCtx, source, 1<<20, "git", "rev-parse", "HEAD")
	if err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "GIT_COMMIT_FAILED", err)
	}
	commit = strings.TrimSpace(commit)
	log("info", "Source checked out at "+commit)

	outputDir, err := r.compile(buildCtx, source, job.Config.Platform, job.Config.FlutterTargetPlatform, job.Config.FlutterBuildMode, job.Config.FlutterFlavor, log)
	if err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "BUILD_COMMAND_FAILED", err)
	}
	if _, err := os.Stat(filepath.Join(outputDir, "index.html")); err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "BUILD_OUTPUT_INVALID", errors.New("compiled web output does not contain index.html"))
	}
	mode, err := r.repository.EnforcementMode(buildCtx)
	if err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "VERIFICATION_CONFIG_MISSING", err)
	}
	if mode != "enforce" {
		log("info", "Running native legacy security compatibility gate in Go")
		security := runSecurity(buildCtx, workspace, source)
		if security.Status != "succeeded" {
			return r.fail(ctx, job.BuildJobID, job.ReleaseID, "LEGACY_SECURITY_FAILED", errors.New(security.ErrorMessage+firstFindingTitle(security.Findings)))
		}
	}

	archive := filepath.Join(workspace, "full.zip")
	if output, err := command(buildCtx, outputDir, 4<<20, "zip", "-q", "-r", archive, "."); err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "ARCHIVE_FAILED", fmt.Errorf("%s: %w", output, err))
	}
	key := filepath.ToSlash(filepath.Join("releases", job.BundleID, job.ReleaseID, "full.zip"))
	artifact, err := r.store.UploadBundle(buildCtx, "", key, archive, "application/zip")
	if err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "ARTIFACT_UPLOAD_FAILED", err)
	}
	if err := r.repository.Complete(ctx, BuildCompletion{ProjectID: job.ProjectID, BundleID: job.BundleID, ReleaseID: job.ReleaseID, BuildJobID: job.BuildJobID, SourceCommit: commit, EventKey: eventKey, BuildNumber: job.BuildNumber, Artifact: artifact}); err != nil {
		return r.fail(ctx, job.BuildJobID, job.ReleaseID, "BUILD_PERSIST_FAILED", err)
	}
	log("info", "Immutable full.zip uploaded and verification requested")
	return nil
}

func (r *BuildRunner) compile(ctx context.Context, source, platform, flutterTarget, flutterMode, flutterFlavor string, log func(string, string)) (string, error) {
	switch strings.ToLower(platform) {
	case "expo", "react", "react-native":
		if _, err := os.Stat(filepath.Join(source, "package.json")); err != nil {
			return "", errors.New("Expo source has no package.json")
		}
		var name string
		var args []string
		if _, err := os.Stat(filepath.Join(source, "yarn.lock")); err == nil {
			name = "yarn"
			args = []string{"install", "--frozen-lockfile", "--non-interactive"}
		} else if _, err := os.Stat(filepath.Join(source, "pnpm-lock.yaml")); err == nil {
			name = "pnpm"
			args = []string{"install", "--frozen-lockfile"}
		} else {
			name = "npm"
			args = []string{"ci", "--ignore-scripts"}
		}
		log("info", "Installing pinned project dependencies with "+name)
		if output, err := command(ctx, source, 8<<20, name, args...); err != nil {
			return "", fmt.Errorf("dependency install: %s: %w", output, err)
		}
		outputDir := filepath.Join(source, "dist")
		if output, err := command(ctx, source, 8<<20, "npx", "expo", "export", "--output-dir", outputDir); err != nil {
			return "", fmt.Errorf("expo export: %s: %w", output, err)
		}
		return outputDir, nil
	case "flutter":
		if _, err := os.Stat(filepath.Join(source, "pubspec.yaml")); err != nil {
			return "", errors.New("Flutter source has no pubspec.yaml")
		}
		if output, err := command(ctx, source, 8<<20, "flutter", "pub", "get"); err != nil {
			return "", fmt.Errorf("flutter pub get: %s: %w", output, err)
		}
		target := flutterTarget
		if target == "" {
			target = "web"
		}
		mode := flutterMode
		if mode == "" {
			mode = "release"
		}
		args := []string{"build", target, "--" + mode}
		if flutterFlavor != "" {
			args = append(args, "--flavor", flutterFlavor)
		}
		if output, err := command(ctx, source, 8<<20, "flutter", args...); err != nil {
			return "", fmt.Errorf("flutter build: %s: %w", output, err)
		}
		return filepath.Join(source, "build", target), nil
	default:
		return "", fmt.Errorf("unsupported LepoShip platform %q", platform)
	}
}

func (r *BuildRunner) heartbeat(stop <-chan struct{}, jobID string) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			_ = r.repository.Heartbeat(context.Background(), jobID, r.worker)
		}
	}
}
func (r *BuildRunner) fail(ctx context.Context, jobID, releaseID, code string, cause error) error {
	_ = r.repository.Fail(ctx, jobID, releaseID, code, cause)
	return cause
}
func firstFindingTitle(findings []domain.Finding) string {
	if len(findings) == 0 {
		return ""
	}
	return ": " + findings[0].Title
}
