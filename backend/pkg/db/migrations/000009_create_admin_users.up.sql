CREATE TABLE IF NOT EXISTS tb_admin_users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tb_admin_users_role
        CHECK (role IN ('ADMIN', 'USER'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_admin_users_email_lower
    ON tb_admin_users (LOWER(email));