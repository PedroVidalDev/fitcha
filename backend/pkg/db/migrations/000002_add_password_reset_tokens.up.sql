CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tb_password_reset_tokens_deleted_at
    ON tb_password_reset_tokens (deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_password_reset_tokens_user_id
    ON tb_password_reset_tokens (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_password_reset_tokens_token_hash
    ON tb_password_reset_tokens (token_hash);
