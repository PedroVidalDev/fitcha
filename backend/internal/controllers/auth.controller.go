package controllers

import (
	dtos "fitcha/internal/dtos/user"
	"fitcha/internal/services"
	"html/template"
	"net/http"
	"strings"

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

func (c *AuthController) ResendVerificationEmail(ctx *gin.Context) {
	var input dtos.ResendVerificationEmailType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.ResendVerificationEmail(input.Email); err != nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "nao foi possivel reenviar o e-mail de verificacao",
		})
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{
		"message": "se existir uma conta pendente para este e-mail, enviaremos um novo link de verificacao",
	})
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

func (c *AuthController) RequestPasswordReset(ctx *gin.Context) {
	var input dtos.RequestPasswordResetType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.RequestPasswordReset(input.Email); err != nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "nao foi possivel enviar o e-mail de redefinicao",
		})
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{
		"message": "se existir uma conta para este e-mail, enviaremos um link para redefinir sua senha",
	})
}

func (c *AuthController) ResetPassword(ctx *gin.Context) {
	var input dtos.ResetPasswordType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.ResetPassword(input.Token, input.NewPassword); err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "senha redefinida com sucesso"})
}

func (c *AuthController) ResetPasswordPage(ctx *gin.Context) {
	token := strings.TrimSpace(ctx.Query("token"))
	if token == "" {
		renderVerificationHTML(
			ctx,
			http.StatusBadRequest,
			"Link invalido",
			"O link de redefinicao de senha esta incompleto ou expirado.",
		)
		return
	}

	renderResetPasswordHTML(ctx, token)
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

func renderResetPasswordHTML(ctx *gin.Context, token string) {
	escapedToken := template.JSEscapeString(token)

	ctx.Header("Content-Type", "text/html; charset=utf-8")
	ctx.Status(http.StatusOK)
	_, _ = ctx.Writer.WriteString(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir senha</title>
  <style>
    :root{color-scheme:light}
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,sans-serif;background:#f7f1ea;color:#1f130c;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{width:min(100%,520px);background:#fff;border:1px solid #eadfd3;border-radius:20px;padding:32px;box-shadow:0 18px 40px rgba(31,19,12,.08)}
    h1{margin:0 0 10px;font-size:28px}
    p{margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f4a3d}
    label{display:block;font-size:12px;font-weight:700;color:#5f4a3d;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 8px}
    input{width:100%;padding:15px 16px;border-radius:14px;border:1px solid #d8c5b6;background:#fcfaf7;color:#1f130c;font-size:16px}
    input:focus{outline:2px solid #c47d4f;outline-offset:1px}
    button{width:100%;margin-top:22px;padding:16px;border:0;border-radius:14px;background:linear-gradient(90deg,#c47d4f,#d89f70);color:#fff;font-size:16px;font-weight:800;cursor:pointer}
    button[disabled]{opacity:.7;cursor:wait}
    .hint{margin-top:10px;font-size:12px;color:#7a6557}
    .notice{display:none;margin-top:16px;padding:14px 16px;border-radius:14px;font-size:14px;line-height:1.5}
    .notice.error{background:#fce8e6;color:#8b2f2c;border:1px solid #efb6b2}
    .notice.success{background:#edf7ef;color:#275d32;border:1px solid #b8d9bf}
  </style>
</head>
<body>
  <main class="card">
    <h1>Redefinir senha</h1>
    <p>Escolha uma nova senha para sua conta. Depois disso, basta voltar ao app e fazer login normalmente.</p>
    <form id="reset-form">
      <label for="password">Nova senha</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required minlength="6" />

      <label for="confirm-password">Confirmar nova senha</label>
      <input id="confirm-password" name="confirm-password" type="password" autocomplete="new-password" required minlength="6" />

      <button id="submit-button" type="submit">Salvar nova senha</button>
      <div class="hint">A senha precisa ter pelo menos 6 caracteres.</div>
    </form>

    <div id="error-box" class="notice error" role="alert"></div>
    <div id="success-box" class="notice success" role="status"></div>
  </main>

  <script>
    const token = "` + escapedToken + `";
    const form = document.getElementById("reset-form");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm-password");
    const submitButton = document.getElementById("submit-button");
    const errorBox = document.getElementById("error-box");
    const successBox = document.getElementById("success-box");

    const hideMessages = () => {
      errorBox.style.display = "none";
      successBox.style.display = "none";
      errorBox.textContent = "";
      successBox.textContent = "";
    };

    const showError = (message) => {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    };

    const showSuccess = (message) => {
      successBox.textContent = message;
      successBox.style.display = "block";
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessages();

      const password = passwordInput.value.trim();
      const confirmPassword = confirmInput.value.trim();

      if (password.length < 6) {
        showError("A nova senha precisa ter pelo menos 6 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        showError("As senhas nao coincidem.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Salvando...";

      try {
        const response = await fetch("/password/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token,
            newPassword: password
          })
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload && payload.error ? payload.error : "Nao foi possivel redefinir sua senha.");
        }

        form.style.display = "none";
        showSuccess("Senha redefinida com sucesso. Agora voce ja pode voltar ao app e fazer login.");
      } catch (error) {
        showError(error instanceof Error ? error.message : "Nao foi possivel redefinir sua senha.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Salvar nova senha";
      }
    });
  </script>
</body>
</html>`)
}
