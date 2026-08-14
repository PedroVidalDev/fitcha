package controllers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	defaultPageLimit = 20
	maxPageLimit     = 100
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

func getUintParam(ctx *gin.Context, key string) (uint, error) {
	value, err := getIntParam(ctx, key)
	if err != nil {
		return 0, err
	}

	if value <= 0 {
		return 0, errors.New("parametro invalido")
	}

	return uint(value), nil
}

func getPagination(ctx *gin.Context) (int, int, error) {
	page := 1
	limit := defaultPageLimit

	if rawPage := strings.TrimSpace(ctx.Query("page")); rawPage != "" {
		parsedPage, err := strconv.Atoi(rawPage)
		if err != nil || parsedPage < 1 {
			return 0, 0, errors.New("pagina invalida")
		}
		page = parsedPage
	}

	if rawLimit := strings.TrimSpace(ctx.Query("limit")); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err != nil || parsedLimit < 1 || parsedLimit > maxPageLimit {
			return 0, 0, errors.New("limite invalido")
		}
		limit = parsedLimit
	}

	return page, limit, nil
}

func getOptionalBoolQuery(ctx *gin.Context, key string) (*bool, error) {
	rawValue := strings.TrimSpace(ctx.Query(key))
	if rawValue == "" {
		return nil, nil
	}

	value, err := strconv.ParseBool(rawValue)
	if err != nil {
		return nil, errors.New("filtro booleano invalido")
	}

	return &value, nil
}

func getStringListQuery(ctx *gin.Context, key string) []string {
	rawValue := strings.TrimSpace(ctx.Query(key))
	if rawValue == "" {
		return nil
	}

	values := make([]string, 0)
	for _, value := range strings.Split(rawValue, ",") {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}
