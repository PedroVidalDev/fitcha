CREATE TABLE IF NOT EXISTS tb_history_sets (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    history_entry_id VARCHAR(16) NOT NULL,
    position BIGINT NOT NULL,
    weight DOUBLE PRECISION NOT NULL,
    reps BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_history_sets_entry_position
    ON tb_history_sets (history_entry_id, position);

CREATE INDEX IF NOT EXISTS idx_tb_history_sets_history_entry_id
    ON tb_history_sets (history_entry_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = current_schema()
          AND table_name = 'tb_history_sets'
          AND constraint_name = 'fk_tb_history_sets_history_entry'
    ) THEN
        ALTER TABLE tb_history_sets
        ADD CONSTRAINT fk_tb_history_sets_history_entry
        FOREIGN KEY (history_entry_id)
        REFERENCES tb_history_entries (id)
        ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tb_history_entries'
          AND column_name = 'set1'
    ) THEN
        INSERT INTO tb_history_sets (
            history_entry_id,
            position,
            weight,
            reps,
            created_at,
            updated_at
        )
        SELECT
            id,
            1,
            set1,
            0,
            created_at,
            updated_at
        FROM tb_history_entries
        WHERE set1 IS NOT NULL
          AND set1 > 0
        ON CONFLICT (history_entry_id, position) DO NOTHING;

        INSERT INTO tb_history_sets (
            history_entry_id,
            position,
            weight,
            reps,
            created_at,
            updated_at
        )
        SELECT
            id,
            2,
            set2,
            0,
            created_at,
            updated_at
        FROM tb_history_entries
        WHERE set2 IS NOT NULL
          AND set2 > 0
        ON CONFLICT (history_entry_id, position) DO NOTHING;

        INSERT INTO tb_history_sets (
            history_entry_id,
            position,
            weight,
            reps,
            created_at,
            updated_at
        )
        SELECT
            id,
            3,
            set3,
            0,
            created_at,
            updated_at
        FROM tb_history_entries
        WHERE set3 IS NOT NULL
          AND set3 > 0
        ON CONFLICT (history_entry_id, position) DO NOTHING;

        ALTER TABLE tb_history_entries DROP COLUMN IF EXISTS set1;
        ALTER TABLE tb_history_entries DROP COLUMN IF EXISTS set2;
        ALTER TABLE tb_history_entries DROP COLUMN IF EXISTS set3;
    END IF;
END $$;
