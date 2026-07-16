package architecture

import (
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"testing"
)

func TestModularArchitectureBoundaries(t *testing.T) {
	_, current, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(current), "..", ".."))
	commands, err := os.ReadDir(filepath.Join(root, "cmd"))
	if err != nil {
		t.Fatal(err)
	}
	if len(commands) != 1 || commands[0].Name() != "gateway" {
		t.Errorf("expected exactly one gateway binary, found %v", entryNames(commands))
	}
	for _, legacy := range []string{"domain", "delivery", "repository", "storage", "usecase", "worker", "server", "middleware", "alerts", "health", "ws", "edge", "config"} {
		if _, err := os.Stat(filepath.Join(root, "internal", legacy)); !os.IsNotExist(err) {
			t.Errorf("legacy package still exists: internal/%s", legacy)
		}
	}
	if _, err := os.Stat(filepath.Join(root, "internal", "app", "controlplane")); !os.IsNotExist(err) {
		t.Error("mixed app/controlplane package must not exist; use app/quant and app/ota")
	}

	err = filepath.WalkDir(filepath.Join(root, "internal"), func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			if strings.Contains(filepath.ToSlash(path), "/internal/data/ent") {
				return filepath.SkipDir
			}
			return nil
		}
		if filepath.Ext(path) != ".go" || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		text := string(content)
		for _, forbidden := range []string{"gorm.io/", "gorm:\"", "AutoMigrate(", ".Schema.Create(", "ent/migrate"} {
			if strings.Contains(text, forbidden) {
				t.Errorf("%s contains forbidden persistence token %q", path, forbidden)
			}
		}
		if strings.Contains(text, "os.Getenv(") && !strings.Contains(filepath.ToSlash(path), "/internal/platform/config/") {
			t.Errorf("%s reads environment outside platform/config", path)
		}
		if !rawSQLAllowed(path) {
			for _, forbidden := range []string{".Raw(", "ExecContext(", "QueryContext(", "QueryRowContext("} {
				if strings.Contains(text, forbidden) {
					t.Errorf("%s contains forbidden raw SQL call %q", path, forbidden)
				}
			}
			if regexp.MustCompile(`(?i)\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|DELETE\s+FROM)\b`).MatchString(text) {
				t.Errorf("%s contains a raw SQL statement outside the QuestDB adapter", path)
			}
		}
		// Verification documents are immutable, versioned boundary contracts shared
		// by Redis, policy snapshots and reports; their wire names are part of the domain.
		verificationContract := strings.Contains(filepath.ToSlash(path), "/internal/modules/verification/domain/")
		if strings.Contains(filepath.ToSlash(path), "/domain/") && !verificationContract && (strings.Contains(text, "`json:") || strings.Contains(text, "`form:")) {
			t.Errorf("domain file %s contains transport tags", path)
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, content, parser.ImportsOnly)
		if err != nil {
			return err
		}
		for _, spec := range file.Imports {
			importPath, _ := strconv.Unquote(spec.Path.Value)
			if importPath == "database/sql" && !databaseSQLAllowed(path) {
				t.Errorf("%s imports database/sql outside an approved transport adapter", path)
			}
			checkImportBoundary(t, filepath.ToSlash(path), importPath)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestNoFirebaseServiceAccountSecretsAreCommitted(t *testing.T) {
	_, current, _, _ := runtime.Caller(0)
	repoRoot := filepath.Clean(filepath.Join(filepath.Dir(current), "..", "..", ".."))
	for _, relativeRoot := range []string{"go", "ops"} {
		root := filepath.Join(repoRoot, relativeRoot)
		err := filepath.WalkDir(root, func(path string, entry os.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if entry.IsDir() {
				slash := filepath.ToSlash(path)
				if strings.Contains(slash, "/internal/data/ent") || strings.Contains(slash, "/go/.") {
					return filepath.SkipDir
				}
				return nil
			}
			if shouldSkipSecretScan(path) {
				return nil
			}
			content, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			text := string(content)
			for _, forbidden := range forbiddenFirebaseSecretTokens() {
				if strings.Contains(text, forbidden) {
					t.Errorf("%s contains forbidden Firebase service-account material %q", path, forbidden)
				}
			}
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}
}

func entryNames(entries []os.DirEntry) []string {
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		names = append(names, entry.Name())
	}
	return names
}

func rawSQLAllowed(path string) bool {
	path = filepath.ToSlash(path)
	return strings.Contains(path, "/internal/modules/operations/adapter/questdb/") ||
		strings.Contains(path, "/internal/modules/quantant/adapter/questdb/") ||
		strings.Contains(path, "/internal/modules/quantant/adapter/postgres/") ||
		strings.Contains(path, "/internal/modules/verification/adapter/postgres/")
}

func databaseSQLAllowed(path string) bool {
	path = filepath.ToSlash(path)
	return strings.Contains(path, "/internal/platform/database/postgres.go") ||
		strings.Contains(path, "/internal/platform/database/questdb.go") || rawSQLAllowed(path)
}

func checkImportBoundary(t *testing.T, file, imported string) {
	if strings.Contains(file, "/internal/app/quant/") && importsAnyModule(imported, "catalog", "commerce", "distribution", "engagement", "identity", "edge") {
		t.Errorf("Quant app imports OTA module %s: %s", imported, file)
	}
	if strings.Contains(file, "/internal/app/ota/") && importsAnyModule(imported, "operations", "trading") {
		t.Errorf("OTA app imports Quant module %s: %s", imported, file)
	}
	if strings.Contains(file, "/domain/") && (strings.Contains(imported, "internal/") || isFramework(imported)) {
		t.Errorf("domain file %s imports infrastructure %s", file, imported)
	}
	if strings.Contains(file, "/application/") && (strings.Contains(imported, "/adapter/") || strings.Contains(imported, "/platform/") || strings.Contains(imported, "/data/ent") || isFramework(imported)) {
		t.Errorf("application file %s imports outbound infrastructure %s", file, imported)
	}
	if strings.Contains(imported, "/internal/data/ent") && !strings.Contains(file, "/adapter/postgres/") && !strings.Contains(file, "/adapter/questdb/") && !strings.Contains(file, "/platform/database/") && !strings.Contains(file, "/platform/events/") {
		t.Errorf("Ent leaked outside persistence adapter: %s imports %s", file, imported)
	}
	owner, dependency := moduleName(file), moduleName(imported)
	if owner != "" && dependency != "" && owner != dependency {
		t.Errorf("module %s imports module %s directly: %s", owner, dependency, file)
	}
}

func importsAnyModule(imported string, modules ...string) bool {
	for _, module := range modules {
		if strings.Contains(imported, "/internal/modules/"+module+"/") {
			return true
		}
	}
	return false
}

func moduleName(path string) string {
	marker := "/internal/modules/"
	index := strings.Index(filepath.ToSlash(path), marker)
	if index < 0 {
		return ""
	}
	remainder := filepath.ToSlash(path)[index+len(marker):]
	name, _, _ := strings.Cut(remainder, "/")
	return name
}

func isFramework(imported string) bool {
	return strings.Contains(imported, "gin-gonic") || strings.Contains(imported, "gorm.io") || strings.Contains(imported, "entgo.io")
}

func shouldSkipSecretScan(path string) bool {
	slash := filepath.ToSlash(path)
	if strings.HasSuffix(slash, "go.sum") || strings.HasSuffix(slash, ".lock") {
		return true
	}
	return strings.Contains(slash, "/ops/secrets/")
}

func forbiddenFirebaseSecretTokens() []string {
	return []string{
		`"type": "service_` + `account"`,
		`"private_` + `key"`,
		"-----BEGIN " + "PRIVATE KEY-----",
		"firebase-" + "adminsdk-",
		"reactjs-ts-firebase-" + "adminsdk",
	}
}
