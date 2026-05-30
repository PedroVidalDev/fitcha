ALTER TABLE tb_history_entries
    ADD COLUMN IF NOT EXISTS set1 DOUBLE PRECISION;

ALTER TABLE tb_history_entries
    ADD COLUMN IF NOT EXISTS set2 DOUBLE PRECISION;

ALTER TABLE tb_history_entries
    ADD COLUMN IF NOT EXISTS set3 DOUBLE PRECISION;

UPDATE tb_history_entries AS entries
SET
    set1 = source.set1,
    set2 = source.set2,
    set3 = source.set3
FROM (
    SELECT
        history_entry_id,
        MAX(CASE WHEN position = 1 THEN weight END) AS set1,
        MAX(CASE WHEN position = 2 THEN weight END) AS set2,
        MAX(CASE WHEN position = 3 THEN weight END) AS set3
    FROM tb_history_sets
    GROUP BY history_entry_id
) AS source
WHERE entries.id = source.history_entry_id;

ALTER TABLE IF EXISTS tb_history_sets
    DROP CONSTRAINT IF EXISTS fk_tb_history_sets_history_entry;

DROP INDEX IF EXISTS idx_tb_history_sets_entry_position;
DROP INDEX IF EXISTS idx_tb_history_sets_history_entry_id;

DROP TABLE IF EXISTS tb_history_sets;
