package controllers

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
)

func getAuthenticatedUserID(ctx *gin.Context) (uint, error) {
	value, exists := ctx.Get("userID")
	if !exists {
		return 0, errors.New("usuario nao autenticado")
	}

	switch userID := value.(type) {
	case uint:
		return userID, nil
	case int:
		return uint(userID), nil
	case int64:
		return uint(userID), nil
	case float64:
		return uint(userID), nil
	case string:
		parsed, err := strconv.ParseUint(userID, 10, 64)
		if err != nil {
			return 0, err
		}

		return uint(parsed), nil
	default:
		return 0, errors.New("usuario nao autenticado")
	}
}

func getIntParam(ctx *gin.Context, key string) (int, error) {
	value := ctx.Param(key)
	if value == "" {
		return 0, errors.New("parametro nao informado")
	}

	return strconv.Atoi(value)
}
