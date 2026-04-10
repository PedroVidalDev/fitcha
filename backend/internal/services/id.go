package services

import (
	"crypto/rand"
	"encoding/hex"
)

func generateID() (string, error) {
	value := make([]byte, 8)

	if _, err := rand.Read(value); err != nil {
		return "", err
	}

	return hex.EncodeToString(value), nil
}
