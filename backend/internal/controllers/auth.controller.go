package controllers

import (
	dtos "fitcha/internal/dtos/user"
	"fitcha/internal/services"
	"html/template"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	service *services.AuthService
}

func authErrorResponse(err error) (int, gin.H) {
	if authErr, ok := services.AsAuthError(err); ok {
		status := http.StatusBadRequest

		switch authErr.Code {
		case services.AuthErrorInvalidCredentials:
			status = http.StatusUnauthorized
		case services.AuthErrorEmailAlreadyExists:
			status = http.StatusConflict
		case services.AuthErrorEmailNotVerified:
			status = http.StatusForbidden
		case services.AuthErrorUserNotFound:
			status = http.StatusNotFound
		}

		return status, gin.H{
			"error": authErr.Message,
			"code":  authErr.Code,
		}
	}

	return http.StatusBadRequest, gin.H{"error": err.Error()}
}

func NewAuthController(s *services.AuthService) *AuthController {
	return &AuthController{service: s}
}

func (c *AuthController) Register(ctx *gin.Context) {
	var input dtos.CreateUserType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	registerResponse, err := c.service.Register(input.Name, input.Email, input.Password)
	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusCreated, registerResponse)
}

func (c *AuthController) Login(ctx *gin.Context) {
	var input dtos.LoginType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResponse, err := c.service.Login(input.Email, input.Password)
	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusOK, authResponse)
}

func (c *AuthController) VerifyEmail(ctx *gin.Context) {
	err := c.service.VerifyEmail(ctx.Query("token"))
	if err != nil {
		status, payload := authErrorResponse(err)
		renderVerificationHTML(ctx, status, "Falha na verificacao", payload["error"].(string))
		return
	}

	renderVerificationHTML(
		ctx,
		http.StatusOK,
		"E-mail verificado",
		"Sua conta foi verificada com sucesso. Agora voce ja pode voltar ao app e fazer login.",
	)
}

func (c *AuthController) ChangePassword(ctx *gin.Context) {
	var input dtos.ChangePasswordType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = c.service.ChangePassword(userID, input.CurrentPassword, input.NewPassword)
	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "senha atualizada com sucesso"})
}

func renderVerificationHTML(ctx *gin.Context, status int, title, message string) {
	ctx.Header("Content-Type", "text/html; charset=utf-8")
	ctx.Status(status)
	_, _ = ctx.Writer.WriteString(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>` + template.HTMLEscapeString(title) + `</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;background:#f7f1ea;color:#1f130c;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{max-width:520px;background:#fff;border:1px solid #eadfd3;border-radius:20px;padding:32px;box-shadow:0 18px 40px rgba(31,19,12,.08)}
    h1{margin:0 0 12px;font-size:28px}
    p{margin:0;font-size:16px;line-height:1.6;color:#5f4a3d}
  </style>
</head>
<body>
  <main class="card">
    <h1>` + template.HTMLEscapeString(title) + `</h1>
    <p>` + template.HTMLEscapeString(message) + `</p>
  </main>
</body>
</html>`)
}
