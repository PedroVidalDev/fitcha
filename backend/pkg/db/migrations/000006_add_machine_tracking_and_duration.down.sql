ALTER TABLE IF EXISTS tb_history_sets
    DROP COLUMN IF EXISTS duration_seconds;

ALTER TABLE IF EXISTS tb_user_machines
    DROP COLUMN IF EXISTS requires_weight;

ALTER TABLE IF EXISTS tb_user_machines
    DROP COLUMN IF EXISTS tracking_type;

ALTER TABLE IF EXISTS tb_machines
    DROP COLUMN IF EXISTS requires_weight;

ALTER TABLE IF EXISTS tb_machines
    DROP COLUMN IF EXISTS tracking_type;
