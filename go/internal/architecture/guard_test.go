package architecture

import (
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
)

func TestModularArchitectureBoundaries(t *testing.T) {
	_, current, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(current), "..", ".."))
	for _, legacy := range []string{"domain", "delivery", "repository", "storage", "usecase", "worker", "server", "middleware", "alerts", "health", "ws", "edge", "config"} {
		if _, err := os.Stat(filepath.Join(root, "internal", legacy)); !os.IsNotExist(err) {
			t.Errorf("legacy package still exists: internal/%s", legacy)
		}
	}

	err := filepath.WalkDir(filepath.Join(root, "internal"), func(path string, entry os.DirEntry, walkErr error) error {
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
		if strings.Contains(filepath.ToSlash(path), "/domain/") && (strings.Contains(text, "`json:") || strings.Contains(text, "`form:")) {
			t.Errorf("domain file %s contains transport tags", path)
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, content, parser.ImportsOnly)
		if err != nil {
			return err
		}
		for _, spec := range file.Imports {
			importPath, _ := strconv.Unquote(spec.Path.Value)
			checkImportBoundary(t, filepath.ToSlash(path), importPath)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func checkImportBoundary(t *testing.T, file, imported string) {
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
