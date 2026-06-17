CREATE TABLE IF NOT EXISTS tb_workouts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id BIGINT NOT NULL REFERENCES tb_users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    position BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tb_workouts_user_id
    ON tb_workouts (user_id);

CREATE INDEX IF NOT EXISTS idx_tb_workouts_user_position
    ON tb_workouts (user_id, position);

CREATE TABLE IF NOT EXISTS tb_workout_machines (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    workout_id BIGINT NOT NULL REFERENCES tb_workouts(id) ON DELETE CASCADE,
    user_machine_id VARCHAR(16) NOT NULL REFERENCES tb_user_machines(id) ON DELETE CASCADE,
    position BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_machine
    ON tb_workout_machines (workout_id, user_machine_id);

CREATE INDEX IF NOT EXISTS idx_tb_workout_machines_user_machine_id
    ON tb_workout_machines (user_machine_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_days'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'tb_day_machines'
    ) AND NOT EXISTS (
        SELECT 1
        FROM tb_workouts
    ) THEN
        WITH inserted_workouts AS (
            INSERT INTO tb_workouts (created_at, updated_at, user_id, title, description, position)
            SELECT
                d.created_at,
                d.updated_at,
                d.user_id,
                CASE d.day_index
                    WHEN 0 THEN 'Domingo'
                    WHEN 1 THEN 'Segunda'
                    WHEN 2 THEN 'Terca'
                    WHEN 3 THEN 'Quarta'
                    WHEN 4 THEN 'Quinta'
                    WHEN 5 THEN 'Sexta'
                    WHEN 6 THEN 'Sabado'
                    ELSE 'Treino'
                END,
                'Migrado automaticamente do planejamento semanal anterior.',
                d.day_index
            FROM tb_days d
            INNER JOIN tb_users u
                ON u.id = d.user_id
            RETURNING id, user_id, position
        )
        INSERT INTO tb_workout_machines (created_at, updated_at, workout_id, user_machine_id, position)
        SELECT
            dm.created_at,
            dm.updated_at,
            iw.id,
            dm.user_machine_id,
            dm.position
        FROM tb_day_machines dm
        INNER JOIN tb_days d
            ON d.id = dm.day_id
        INNER JOIN tb_user_machines um
            ON um.id = dm.user_machine_id
           AND um.user_id = d.user_id
        INNER JOIN inserted_workouts iw
            ON iw.user_id = d.user_id
           AND iw.position = d.day_index;
    END IF;
END $$;

DROP TABLE IF EXISTS tb_day_machines;
DROP TABLE IF EXISTS tb_days;
