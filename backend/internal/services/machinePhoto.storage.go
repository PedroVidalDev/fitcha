package services

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const maxMachinePhotoSize = 5 << 20

type MachinePhotoStorage struct {
	rootDir string
}

func NewMachinePhotoStorage(rootDir string) (*MachinePhotoStorage, error) {
	rootDir = strings.TrimSpace(rootDir)
	if rootDir == "" {
		rootDir = filepath.Join("uploads", "machines")
	}

	absoluteDir, err := filepath.Abs(rootDir)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(absoluteDir, 0o755); err != nil {
		return nil, err
	}

	return &MachinePhotoStorage{rootDir: absoluteDir}, nil
}

func (s *MachinePhotoStorage) RootDir() string {
	return s.rootDir
}

func (s *MachinePhotoStorage) Save(machineID string, fileHeader *multipart.FileHeader) (string, error) {
	machineID = strings.TrimSpace(machineID)
	if machineID == "" || filepath.Base(machineID) != machineID {
		return "", errors.New("maquina invalida")
	}
	if fileHeader == nil || fileHeader.Size <= 0 {
		return "", errors.New("foto nao informada")
	}
	if fileHeader.Size > maxMachinePhotoSize {
		return "", errors.New("a foto deve ter no maximo 5 MB")
	}

	source, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer source.Close()

	header := make([]byte, 512)
	readCount, readErr := io.ReadFull(source, header)
	if readErr != nil && !errors.Is(readErr, io.ErrUnexpectedEOF) {
		return "", readErr
	}
	header = header[:readCount]

	contentType := http.DetectContentType(header)
	extension := ""
	switch contentType {
	case "image/jpeg":
		extension = ".jpg"
	case "image/png":
		extension = ".png"
	case "image/webp":
		extension = ".webp"
	default:
		return "", errors.New("formato de foto invalido; use JPG, PNG ou WebP")
	}

	randomValue := make([]byte, 16)
	if _, err := rand.Read(randomValue); err != nil {
		return "", err
	}
	filename := machineID + "-" + hex.EncodeToString(randomValue) + extension
	destinationPath := filepath.Join(s.rootDir, filename)
	destination, err := os.OpenFile(destinationPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", err
	}

	reader := io.MultiReader(bytes.NewReader(header), source)
	written, copyErr := io.Copy(destination, io.LimitReader(reader, maxMachinePhotoSize+1))
	closeErr := destination.Close()
	if copyErr != nil || closeErr != nil || written > maxMachinePhotoSize {
		_ = os.Remove(destinationPath)
		if copyErr != nil {
			return "", copyErr
		}
		if closeErr != nil {
			return "", closeErr
		}
		return "", errors.New("a foto deve ter no maximo 5 MB")
	}

	return "/uploads/machines/" + filename, nil
}

func (s *MachinePhotoStorage) DeleteByURL(machineID string, photoURL string) {
	parsedURL, err := url.Parse(strings.TrimSpace(photoURL))
	if err != nil || !strings.HasPrefix(parsedURL.Path, "/uploads/machines/") {
		return
	}

	filename := filepath.Base(parsedURL.Path)
	if filename == "." ||
		filename == string(filepath.Separator) ||
		filename == "" ||
		!strings.HasPrefix(filename, strings.TrimSpace(machineID)+"-") {
		return
	}

	_ = os.Remove(filepath.Join(s.rootDir, filename))
}
