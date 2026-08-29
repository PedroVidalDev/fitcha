CREATE TABLE IF NOT EXISTS tb_error_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT '',
    path TEXT NOT NULL DEFAULT '',
    status_code INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tb_error_logs_resolved
    ON tb_error_logs (resolved);
