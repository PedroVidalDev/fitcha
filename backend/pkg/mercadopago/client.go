package mercadopago

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type Client struct {
	accessToken string
	baseURL     string
	httpClient  *http.Client
}

type CreatePixPaymentRequest struct {
	TransactionAmount float64 `json:"transaction_amount"`
	Description       string  `json:"description"`
	PaymentMethodID   string  `json:"payment_method_id"`
	NotificationURL   string  `json:"notification_url,omitempty"`
	ExternalReference string  `json:"external_reference"`
	DateOfExpiration  string  `json:"date_of_expiration,omitempty"`
	Payer             struct {
		Email          string `json:"email"`
		FirstName      string `json:"first_name,omitempty"`
		LastName       string `json:"last_name,omitempty"`
		Identification struct {
			Type   string `json:"type"`
			Number string `json:"number"`
		} `json:"identification"`
	} `json:"payer"`
}

type PixPaymentResponse struct {
	ID                 int64   `json:"id"`
	Status             string  `json:"status"`
	StatusDetail       string  `json:"status_detail"`
	TransactionAmount  float64 `json:"transaction_amount"`
	ExternalReference  string  `json:"external_reference"`
	DateCreated        string  `json:"date_created"`
	DateApproved       string  `json:"date_approved"`
	DateOfExpiration   string  `json:"date_of_expiration"`
	PointOfInteraction struct {
		TransactionData struct {
			QRCodeBase64 string `json:"qr_code_base64"`
			QRCode       string `json:"qr_code"`
			TicketURL    string `json:"ticket_url"`
		} `json:"transaction_data"`
	} `json:"point_of_interaction"`
}

type APIError struct {
	Message string
}

func (e APIError) Error() string {
	return e.Message
}

func NewClientFromEnv() (*Client, error) {
	accessToken := strings.TrimSpace(os.Getenv("MERCADO_PAGO_ACCESS_TOKEN"))
	if accessToken == "" {
		return nil, fmt.Errorf("configure MERCADO_PAGO_ACCESS_TOKEN")
	}

	baseURL := strings.TrimSpace(os.Getenv("MERCADO_PAGO_API_URL"))
	if baseURL == "" {
		baseURL = "https://api.mercadopago.com"
	}

	return &Client{
		accessToken: accessToken,
		baseURL:     strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}, nil
}

func (c *Client) CreatePixPayment(payload CreatePixPaymentRequest, idempotencyKey string) (PixPaymentResponse, error) {
	req, err := c.newJSONRequest(http.MethodPost, "/v1/payments", payload)
	if err != nil {
		return PixPaymentResponse{}, err
	}

	req.Header.Set("X-Idempotency-Key", idempotencyKey)

	var response PixPaymentResponse
	if err := c.do(req, &response); err != nil {
		return PixPaymentResponse{}, err
	}

	return response, nil
}

func (c *Client) GetPayment(paymentID string) (PixPaymentResponse, error) {
	req, err := c.newJSONRequest(http.MethodGet, "/v1/payments/"+paymentID, nil)
	if err != nil {
		return PixPaymentResponse{}, err
	}

	var response PixPaymentResponse
	if err := c.do(req, &response); err != nil {
		return PixPaymentResponse{}, err
	}

	return response, nil
}

func (c *Client) newJSONRequest(method, path string, body any) (*http.Request, error) {
	var reader io.Reader

	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}

		reader = bytes.NewBuffer(payload)
	}

	req, err := http.NewRequest(method, c.baseURL+path, reader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	return req, nil
}

func (c *Client) do(req *http.Request, target any) error {
	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}

	if res.StatusCode >= http.StatusBadRequest {
		return APIError{Message: extractAPIErrorMessage(body, res.StatusCode)}
	}

	if target == nil {
		return nil
	}

	return json.Unmarshal(body, target)
}

func extractAPIErrorMessage(body []byte, statusCode int) string {
	type causeItem struct {
		Description string `json:"description"`
	}

	type apiErrorResponse struct {
		Message string      `json:"message"`
		Error   string      `json:"error"`
		Cause   []causeItem `json:"cause"`
	}

	var parsed apiErrorResponse
	if err := json.Unmarshal(body, &parsed); err == nil {
		if parsed.Message != "" {
			return parsed.Message
		}
		if parsed.Error != "" {
			return parsed.Error
		}
		if len(parsed.Cause) > 0 && parsed.Cause[0].Description != "" {
			return parsed.Cause[0].Description
		}
	}

	return fmt.Sprintf("erro no Mercado Pago (status %d)", statusCode)
}
