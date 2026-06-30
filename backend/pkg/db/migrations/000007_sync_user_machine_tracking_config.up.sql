UPDATE tb_user_machines
SET requires_weight = FALSE
WHERE tracking_type = 'duration'
  AND requires_weight <> FALSE;

UPDATE tb_user_machines AS user_machines
SET tracking_type = catalog.tracking_type,
    requires_weight = catalog.requires_weight
FROM tb_machines AS catalog
WHERE user_machines.machine_id = catalog.id
  AND (
    user_machines.tracking_type IS DISTINCT FROM catalog.tracking_type
    OR user_machines.requires_weight IS DISTINCT FROM catalog.requires_weight
  );
