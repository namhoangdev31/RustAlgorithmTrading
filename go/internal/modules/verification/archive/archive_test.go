package archive

import "testing"

func TestSafeNameRejectsTraversal(t *testing.T) {
	for _, name := range []string{"../secret", "assets/../../secret", "/etc/passwd", "C:\\Windows\\system.ini"} {
		if _, err := safeName(name); err == nil {
			t.Fatalf("expected %q to be rejected", name)
		}
	}
	if _, err := safeName("assets/index.js"); err != nil {
		t.Fatal(err)
	}
}
