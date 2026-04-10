package services

import "errors"

type AuthErrorCode string

const (
	AuthErrorInvalidCredentials     AuthErrorCode = "AUTH_INVALID_CREDENTIALS"
	AuthErrorEmailAlreadyExists     AuthErrorCode = "AUTH_EMAIL_ALREADY_EXISTS"
	AuthErrorUserNotFound           AuthErrorCode = "AUTH_USER_NOT_FOUND"
	AuthErrorCurrentPasswordInvalid AuthErrorCode = "AUTH_CURRENT_PASSWORD_INVALID"
)

type AuthError struct {
	Code    AuthErrorCode
	Message string
}

func (e *AuthError) Error() string {
	return e.Message
}

func newAuthError(code AuthErrorCode, message string) *AuthError {
	return &AuthError{
		Code:    code,
		Message: message,
	}
}

func AsAuthError(err error) (*AuthError, bool) {
	var authErr *AuthError
	if !errors.As(err, &authErr) {
		return nil, false
	}

	return authErr, true
}
