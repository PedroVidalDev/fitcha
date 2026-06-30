ALTER TABLE tb_machines
    ADD COLUMN IF NOT EXISTS tracking_type VARCHAR(30) NOT NULL DEFAULT 'sets';

ALTER TABLE tb_machines
    ADD COLUMN IF NOT EXISTS requires_weight BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tb_user_machines
    ADD COLUMN IF NOT EXISTS tracking_type VARCHAR(30) NOT NULL DEFAULT 'sets';

ALTER TABLE tb_user_machines
    ADD COLUMN IF NOT EXISTS requires_weight BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tb_history_sets
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0;

UPDATE tb_machines
SET tracking_type = 'duration',
    requires_weight = FALSE
WHERE category_key = 'cardio'
   OR slug IN ('prancha', 'prancha-lateral');

UPDATE tb_machines
SET tracking_type = 'sets',
    requires_weight = FALSE
WHERE slug IN (
    'flexao-de-braco',
    'barra-fixa',
    'triceps-banco',
    'mergulho-paralelas',
    'elevacao-pernas-barra',
    'elevacao-joelhos-paralela',
    'crunch-solo',
    'bicicleta-no-ar',
    'abdominal-infra-banco'
);

UPDATE tb_user_machines AS user_machines
SET tracking_type = catalog.tracking_type,
    requires_weight = catalog.requires_weight
FROM tb_machines AS catalog
WHERE user_machines.machine_id = catalog.id;
