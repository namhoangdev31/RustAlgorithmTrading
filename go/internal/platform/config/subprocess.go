package config

import "os"

// SubprocessEnvironment deliberately exposes only non-secret runtime settings
// to build and verification tools. Database, Redis and object-store credentials
// stay in the Go supervisor process.
func SubprocessEnvironment(home string) []string {
	environment := []string{"HOME=" + home, "NO_COLOR=1", "LANG=C.UTF-8"}
	for _, key := range []string{"PATH", "TMPDIR", "PLAYWRIGHT_BROWSERS_PATH", "CHROME_PATH", "SSL_CERT_FILE", "SSL_CERT_DIR"} {
		if value := os.Getenv(key); value != "" {
			environment = append(environment, key+"="+value)
		}
	}
	return environment
}
