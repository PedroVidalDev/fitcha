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

DROP TABLE IF EXISTS tb_workout_machines;
DROP TABLE IF EXISTS tb_workouts;
