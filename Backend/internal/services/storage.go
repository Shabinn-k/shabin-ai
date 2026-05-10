package services

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"golang/internal/config"
)

var allowedExts = map[string]bool{
	".pdf": true, ".txt": true, ".csv": true, ".md": true,
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true,
}

func SaveUploadedFile(file *multipart.FileHeader) (string, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExts[ext] {
		return "", fmt.Errorf("file type %s not allowed", ext)
	}
	if err := os.MkdirAll(config.App.UploadDir, 0755); err != nil {
		return "", err
	}
	filename := uuid.New().String() + ext
	dst := filepath.Join(config.App.UploadDir, filename)

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()

	buf := make([]byte, 32*1024)
	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, werr := out.Write(buf[:n]); werr != nil {
				return "", werr
			}
		}
		if err != nil {
			break
		}
	}
	return "/uploads/" + filename, nil
}