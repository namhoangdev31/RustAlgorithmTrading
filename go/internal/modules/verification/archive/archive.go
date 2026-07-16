package archive

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const (
	maxFiles = 20_000
	maxBytes = int64(1 << 30)
	maxRatio = uint64(100)
)

type Validation struct {
	Valid      bool   `json:"valid"`
	Format     string `json:"format,omitempty"`
	Files      int    `json:"files"`
	TotalBytes int64  `json:"totalBytes"`
	ErrorCode  string `json:"errorCode,omitempty"`
	Message    string `json:"message,omitempty"`
}

func Extract(archive, destination string) (Validation, error) {
	if archive == "" || destination == "" {
		return Validation{}, errors.New("archive and extract-to are required")
	}
	if err := os.MkdirAll(destination, 0o700); err != nil {
		return Validation{}, err
	}
	if strings.HasSuffix(strings.ToLower(archive), ".tar.gz") || strings.HasSuffix(strings.ToLower(archive), ".tgz") {
		return validateTarGz(archive, destination)
	}
	return validateZIP(archive, destination)
}

func validateZIP(archive, destination string) (Validation, error) {
	reader, err := zip.OpenReader(archive)
	if err != nil {
		return Validation{Format: "zip"}, err
	}
	defer reader.Close()
	result := Validation{Valid: true, Format: "zip"}
	if len(reader.File) == 0 || len(reader.File) > maxFiles {
		return result, errors.New("archive entry count is outside allowed limits")
	}
	for _, entry := range reader.File {
		name, err := safeName(entry.Name)
		if err != nil {
			return result, err
		}
		if entry.Mode()&os.ModeSymlink != 0 {
			return result, fmt.Errorf("symbolic link entry is not allowed: %s", entry.Name)
		}
		if entry.FileInfo().IsDir() {
			if err := os.MkdirAll(filepath.Join(destination, name), 0o700); err != nil {
				return result, err
			}
			continue
		}
		if entry.UncompressedSize64 > uint64(maxBytes) || entry.CompressedSize64 > 0 && entry.UncompressedSize64/entry.CompressedSize64 > maxRatio {
			return result, fmt.Errorf("archive entry exceeds decompression limits: %s", entry.Name)
		}
		result.Files++
		result.TotalBytes += int64(entry.UncompressedSize64)
		if result.TotalBytes > maxBytes {
			return result, errors.New("archive exceeds uncompressed size limit")
		}
		input, err := entry.Open()
		if err != nil {
			return result, err
		}
		err = writeFile(destination, name, input, int64(entry.UncompressedSize64))
		_ = input.Close()
		if err != nil {
			return result, err
		}
	}
	return result, nil
}

func validateTarGz(archive, destination string) (Validation, error) {
	file, err := os.Open(archive)
	if err != nil {
		return Validation{Format: "tar.gz"}, err
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		return Validation{Format: "tar.gz"}, err
	}
	defer gz.Close()
	reader := tar.NewReader(gz)
	result := Validation{Valid: true, Format: "tar.gz"}
	for {
		entry, err := reader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return result, err
		}
		if result.Files >= maxFiles {
			return result, errors.New("archive entry count exceeds limit")
		}
		name, err := safeName(entry.Name)
		if err != nil {
			return result, err
		}
		switch entry.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(filepath.Join(destination, name), 0o700); err != nil {
				return result, err
			}
		case tar.TypeReg:
			if entry.Size < 0 || entry.Size > maxBytes {
				return result, errors.New("archive entry size is invalid")
			}
			result.Files++
			result.TotalBytes += entry.Size
			if result.TotalBytes > maxBytes {
				return result, errors.New("archive exceeds uncompressed size limit")
			}
			if err := writeFile(destination, name, reader, entry.Size); err != nil {
				return result, err
			}
		default:
			return result, fmt.Errorf("unsupported or link entry: %s", entry.Name)
		}
	}
	if result.Files == 0 {
		return result, errors.New("archive has no files")
	}
	return result, nil
}

func safeName(name string) (string, error) {
	name = strings.ReplaceAll(name, "\\", "/")
	clean := filepath.Clean(filepath.FromSlash(name))
	if clean == "." || filepath.IsAbs(clean) || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) || filepath.VolumeName(clean) != "" || (len(clean) >= 2 && clean[1] == ':') || strings.ContainsRune(clean, '\x00') {
		return "", fmt.Errorf("unsafe archive path: %s", name)
	}
	return clean, nil
}

func writeFile(root, name string, input io.Reader, size int64) error {
	target := filepath.Join(root, name)
	if err := os.MkdirAll(filepath.Dir(target), 0o700); err != nil {
		return err
	}
	output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	written, copyErr := io.Copy(output, io.LimitReader(input, size+1))
	closeErr := output.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	if written != size {
		return errors.New("archive entry size does not match header")
	}
	return nil
}
