INSERT INTO tb_admin_users (
    id,
    name,
    email,
    password,
    role,
    is_active
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Administrador Fitcha',
    'admin@fitcha.local',
    '$2a$12$RriIREVm9xok1yy3COapeO.XrigjHdgHxS.NofwFyFMqJtTqiH4ZC',
    'ADMIN',
    TRUE
)
ON CONFLICT DO NOTHING;
