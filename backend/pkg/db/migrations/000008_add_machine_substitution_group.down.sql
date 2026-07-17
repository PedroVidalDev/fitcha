DROP INDEX IF EXISTS idx_machines_substitution_group;
ALTER TABLE tb_machines DROP COLUMN IF EXISTS substitution_group;
