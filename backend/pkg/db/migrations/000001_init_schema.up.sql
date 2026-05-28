DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_users'
    ) THEN
        ALTER TABLE users RENAME TO tb_users;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'idx_users_deleted_at'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'idx_tb_users_deleted_at'
    ) THEN
        ALTER INDEX idx_users_deleted_at RENAME TO idx_tb_users_deleted_at;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_machines'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_user_machines'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_machines'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE tb_machines RENAME TO tb_user_machines;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'idx_tb_machines_category_key'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_user_machines'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_machines'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'idx_tb_user_machines_category_key'
    ) THEN
        ALTER INDEX idx_tb_machines_category_key RENAME TO idx_tb_user_machines_category_key;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_day_machines'
          AND column_name = 'machine_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_day_machines'
          AND column_name = 'user_machine_id'
    ) THEN
        ALTER TABLE tb_day_machines RENAME COLUMN machine_id TO user_machine_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_history_entries'
          AND column_name = 'machine_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_history_entries'
          AND column_name = 'user_machine_id'
    ) THEN
        ALTER TABLE tb_history_entries RENAME COLUMN machine_id TO user_machine_id;
    END IF;
END $$;

DROP TABLE IF EXISTS tb_plans;

ALTER TABLE IF EXISTS tb_users DROP COLUMN IF EXISTS plan_active;

CREATE TABLE IF NOT EXISTS tb_users (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    credits BIGINT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tb_users_deleted_at
    ON tb_users (deleted_at);

CREATE TABLE IF NOT EXISTS tb_email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tb_email_verification_tokens_deleted_at
    ON tb_email_verification_tokens (deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_email_verification_tokens_user_id
    ON tb_email_verification_tokens (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_email_verification_tokens_token_hash
    ON tb_email_verification_tokens (token_hash);

CREATE TABLE IF NOT EXISTS tb_payments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    external_reference VARCHAR(120) NOT NULL,
    provider_payment_id VARCHAR(120),
    credit_quantity BIGINT NOT NULL,
    unit_amount_cents BIGINT NOT NULL,
    transaction_amount_cents BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    payer_document VARCHAR(30),
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,
    payment_expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    credits_applied_at TIMESTAMPTZ,
    last_webhook_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tb_payments_user_id
    ON tb_payments (user_id);

CREATE INDEX IF NOT EXISTS idx_tb_payments_status
    ON tb_payments (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_payments_external_reference
    ON tb_payments (external_reference);

CREATE INDEX IF NOT EXISTS idx_tb_payments_provider_payment_id
    ON tb_payments (provider_payment_id);

CREATE TABLE IF NOT EXISTS tb_machines (
    id VARCHAR(16) CONSTRAINT pk_tb_machines PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    photo TEXT,
    category_key VARCHAR(30) NOT NULL,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_machines_slug
    ON tb_machines (slug);

CREATE INDEX IF NOT EXISTS idx_tb_machines_category_key
    ON tb_machines (category_key);

CREATE TABLE IF NOT EXISTS tb_user_machines (
    id VARCHAR(16) PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL,
    machine_id VARCHAR(16),
    name VARCHAR(120),
    description TEXT,
    photo TEXT,
    category_key VARCHAR(30)
);

ALTER TABLE IF EXISTS tb_user_machines
    ADD COLUMN IF NOT EXISTS machine_id VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_tb_user_machines_user_id
    ON tb_user_machines (user_id);

CREATE INDEX IF NOT EXISTS idx_tb_user_machines_machine_id
    ON tb_user_machines (machine_id);

CREATE INDEX IF NOT EXISTS idx_tb_user_machines_category_key
    ON tb_user_machines (category_key);

CREATE TABLE IF NOT EXISTS tb_days (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL,
    day_index BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_day_user_day
    ON tb_days (user_id, day_index);

CREATE TABLE IF NOT EXISTS tb_day_machines (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    day_id BIGINT NOT NULL,
    user_machine_id VARCHAR(16) NOT NULL,
    position BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_day_machine
    ON tb_day_machines (day_id, user_machine_id);

CREATE INDEX IF NOT EXISTS idx_tb_day_machines_user_machine_id
    ON tb_day_machines (user_machine_id);

CREATE TABLE IF NOT EXISTS tb_history_entries (
    id VARCHAR(16) PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_machine_id VARCHAR(16) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL,
    set1 DOUBLE PRECISION,
    set2 DOUBLE PRECISION,
    set3 DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_history_machine_performed
    ON tb_history_entries (user_machine_id, performed_at);
