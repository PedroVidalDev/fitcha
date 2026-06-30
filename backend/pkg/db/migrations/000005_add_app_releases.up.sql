CREATE TABLE IF NOT EXISTS tb_app_releases (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    latest_version VARCHAR(30) NOT NULL,
    minimum_version VARCHAR(30),
    release_tag VARCHAR(120),
    release_url TEXT NOT NULL,
    released_at TIMESTAMPTZ
);
