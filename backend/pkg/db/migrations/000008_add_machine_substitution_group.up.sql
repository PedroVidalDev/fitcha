ALTER TABLE tb_machines
ADD COLUMN IF NOT EXISTS substitution_group varchar(80) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_machines_substitution_group
ON tb_machines (substitution_group);
