package storage

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEntSchemaCoverage(t *testing.T) {
	entries, err := os.ReadDir("../data/ent/schema")
	if err != nil {
		t.Fatal(err)
	}
	count := 0
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".go") {
			continue
		}
		if entry.Name() == "enums.go" || entry.Name() == "soft_delete_mixin.go" {
			continue
		}
		count++
	}
	if count != 140 {
		t.Fatalf("generated Ent schema count = %d, want 140", count)
	}
}

func TestPostgresCutoverGuards(t *testing.T) {
	root := ".."
	forbidden := []string{"gorm.io", "gorm:\"", "GormDB", ".Raw(", "AutoMigrate", "Schema.Create", "data/ent/migrate"}
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		clean := filepath.ToSlash(path)
		if entry.IsDir() && (strings.Contains(clean, "/data/ent") || strings.Contains(clean, "/repository/questdb")) {
			return filepath.SkipDir
		}
		if entry.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		for _, value := range forbidden {
			if strings.Contains(string(data), value) {
				t.Errorf("forbidden PostgreSQL legacy pattern %q in %s", value, path)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
