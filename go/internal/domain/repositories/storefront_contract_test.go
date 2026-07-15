package repositories

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestCatalogChildPayloadMatchesSwiftCodables(t *testing.T) {
	payload, err := json.Marshal(CatalogBundle{
		Tags:           []BundleTagView{{ID: "tag-1", Name: "Utilities"}},
		Languages:      []BundleLanguageView{{ID: "lang-1", BundleID: "bundle-1", LanguageCode: "en", IsDefault: true}},
		Screenshots:    []BundleScreenshotView{},
		InAppPurchases: []BundleInAppPurchaseView{},
	})
	if err != nil {
		t.Fatalf("marshal catalog payload: %v", err)
	}
	encoded := string(payload)
	for _, expected := range []string{`"name":"Utilities"`, `"languageCode":"en"`, `"isDefault":true`} {
		if !strings.Contains(encoded, expected) {
			t.Fatalf("catalog payload %s does not contain %s", encoded, expected)
		}
	}
	for _, legacy := range []string{`"tag":`, `"languageName":`} {
		if strings.Contains(encoded, legacy) {
			t.Fatalf("catalog payload contains incompatible key %s: %s", legacy, encoded)
		}
	}
}
