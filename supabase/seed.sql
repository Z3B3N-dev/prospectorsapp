begin;

insert into professional_family (id, code, name)
values
  ('11111111-1111-1111-1111-111111111111', 'INF', 'Informatica y Comunicaciones'),
  ('22222222-2222-2222-2222-222222222222', 'SAN', 'Sanidad'),
  ('33333333-3333-3333-3333-333333333333', 'ADM', 'Administracion y Gestion')
on conflict (id) do update
set code = excluded.code,
    name = excluded.name;

insert into ciclo_formativo (id, professional_family_id, name, source_url, is_active)
values
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Desarrollo de Aplicaciones Web', 'https://todofp.es', true),
  ('51111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Administracion de Sistemas Informaticos en Red', 'https://todofp.es', true),
  ('52222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Cuidados Auxiliares de Enfermeria', 'https://todofp.es', true),
  ('53333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Gestion Administrativa', 'https://todofp.es', true)
on conflict (id) do update
set professional_family_id = excluded.professional_family_id,
    name = excluded.name,
    source_url = excluded.source_url,
    is_active = excluded.is_active;

insert into autonomous_communities (id, code, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CN', 'Canarias')
on conflict (id) do update
set code = excluded.code,
    name = excluded.name;

insert into provinces (id, autonomous_community_id, name)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Las Palmas'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Santa Cruz de Tenerife')
on conflict (id) do update
set autonomous_community_id = excluded.autonomous_community_id,
    name = excluded.name;

insert into fp_centers (id, province_id, code, name, is_active)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CIFP-LPA-001', 'CIFP Las Palmas Digital', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'CIFP-TFE-001', 'CIFP Tenerife Salud', true)
on conflict (id) do update
set province_id = excluded.province_id,
    code = excluded.code,
    name = excluded.name,
    is_active = excluded.is_active;

insert into fp_center_professional_families (fp_center_id, professional_family_id)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222')
on conflict (fp_center_id, professional_family_id) do nothing;

insert into organizations (id, name, address, city, province, phone, email, created_by, updated_by)
values
  ('10000000-0000-0000-0000-000000000001', 'Grupo Formacion Canarias', 'Calle Triana 10', 'Las Palmas de Gran Canaria', 'Las Palmas', '+34 900 000 001', 'info@grupoformacioncanarias.es', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f'),
  ('10000000-0000-0000-0000-000000000002', 'Innovacion Educativa Atlantico', 'Avenida Maritima 24', 'Santa Cruz de Tenerife', 'Santa Cruz de Tenerife', '+34 900 000 002', 'contacto@innovacionatlantico.es', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f'),
  ('10000000-0000-0000-0000-000000000003', 'Red de Centros Norte', 'Calle Leon y Castillo 45', 'Arucas', 'Las Palmas', '+34 900 000 003', 'gestion@redcentrosnorte.es', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f'),
  ('10000000-0000-0000-0000-000000000004', 'Consorcio Tecnico Sur', 'Calle Castillo 8', 'Adeje', 'Santa Cruz de Tenerife', '+34 900 000 004', 'hola@consorciotecs.es', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f'),
  ('10000000-0000-0000-0000-000000000005', 'Alianza Administrativa Canaria', 'Avenida Canarias 72', 'Telde', 'Las Palmas', '+34 900 000 005', 'contacto@alianzaadmin.es', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', '2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f')
on conflict (id) do update
set name = excluded.name,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    phone = excluded.phone,
    email = excluded.email,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into enterprises (id, organization_id, type, name, normalized_name, address, city, province, tax_id, created_by, updated_by)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'company', 'Tecnologia Atlante S.L.', 'tecnologia atlante sl', 'Calle Mayor 12', 'Las Palmas de Gran Canaria', 'Las Palmas', 'B12345678', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'public', 'Hospital Norte', 'hospital norte', 'Avenida Norte 1', 'Santa Cruz de Tenerife', 'Santa Cruz de Tenerife', 'Q1234567A', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'company', 'Sistemas Blue Ocean S.L.', 'sistemas blue ocean sl', 'Calle Perez Galdos 22', 'Arucas', 'Las Palmas', 'B45678123', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'other', 'Fundacion Empleo Sur', 'fundacion empleo sur', 'Calle Atlantico 14', 'Adeje', 'Santa Cruz de Tenerife', 'G87654321', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'company', 'Servicios Delta Admin S.L.', 'servicios delta admin sl', 'Calle Feria 31', 'Telde', 'Las Palmas', 'B32567891', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'public', 'Ayuntamiento Costa Este', 'ayuntamiento costa este', 'Plaza Mayor 1', 'Las Palmas de Gran Canaria', 'Las Palmas', 'P3501600J', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1')
on conflict (id) do update
set organization_id = excluded.organization_id,
    type = excluded.type,
    name = excluded.name,
    normalized_name = excluded.normalized_name,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    tax_id = excluded.tax_id,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into contacts (id, organization_id, enterprise_id, name, position, phone, second_phone, email, created_by, updated_by)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Laura Martin', 'CTO', '+34 600 100 200', '+34 600 100 201', 'laura@atlante.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Carlos Perez', 'Responsable RRHH', '+34 600 200 300', null, 'carlos@hospitalnorte.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Ana Suarez', 'Responsable IT', '+34 600 300 100', null, 'ana@blueocean.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Marta Diaz', 'Tecnica de Programas', '+34 600 410 210', '+34 600 410 211', 'marta@empleosur.org', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Lucia Fernandez', 'Jefa Administracion', '+34 600 520 320', null, 'lucia@deltaadmin.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'Jorge Moreno', 'Coordinador Municipal', '+34 600 630 430', null, 'jorge@costaeste.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'),
  ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', null, 'Elena Pardo', 'Coordinadora Grupo', '+34 600 740 540', null, 'elena@redcentrosnorte.es', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1')
on conflict (id) do update
set organization_id = excluded.organization_id,
    enterprise_id = excluded.enterprise_id,
    name = excluded.name,
    position = excluded.position,
    phone = excluded.phone,
    second_phone = excluded.second_phone,
    email = excluded.email,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into interactions (
  id,
  organization_id,
  enterprise_id,
  contact_id,
  ciclo_formativo_id,
  type,
  status,
  requested_students,
  notes,
  occurred_at,
  user_id
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '51111111-1111-1111-1111-111111111111',
    'meeting',
    'interested',
    null,
    'Primera reunion para convenio de practicas de DAW.',
    now() - interval '8 days',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    '52222222-2222-2222-2222-222222222221',
    'call',
    'agreement_reached',
    3,
    'Acordadas 3 plazas para FCT en sanidad.',
    now() - interval '3 days',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000003',
    '51111111-1111-1111-1111-111111111112',
    'email',
    'contacted',
    null,
    'Presentacion de propuestas de colaboracion para ASIR.',
    now() - interval '12 days',
    '1f8e2397-a80b-4686-a669-7be460a6e4c5'
  ),
  (
    '60000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000004',
    '53333333-3333-3333-3333-333333333331',
    'visit',
    'not_interested',
    null,
    'No hay capacidad para recibir alumnado este trimestre.',
    now() - interval '18 days',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '60000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000005',
    '53333333-3333-3333-3333-333333333331',
    'meeting',
    'hired',
    2,
    'Se incorporan 2 alumnos de Gestion Administrativa.',
    now() - interval '2 days',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '60000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000006',
    '52222222-2222-2222-2222-222222222221',
    'call',
    'unknown',
    null,
    'Contacto inicial pendiente de concretar reunion.',
    now() - interval '1 day',
    '1f8e2397-a80b-4686-a669-7be460a6e4c5'
  ),
  (
    '60000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    null,
    '40000000-0000-0000-0000-000000000007',
    '51111111-1111-1111-1111-111111111111',
    'other',
    'do_not_contact',
    null,
    'La organizacion solicita pausar comunicaciones por ahora.',
    now() - interval '27 days',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  )
on conflict (id) do update
set organization_id = excluded.organization_id,
    enterprise_id = excluded.enterprise_id,
    contact_id = excluded.contact_id,
    ciclo_formativo_id = excluded.ciclo_formativo_id,
    type = excluded.type,
    status = excluded.status,
    requested_students = excluded.requested_students,
    notes = excluded.notes,
    occurred_at = excluded.occurred_at,
    user_id = excluded.user_id;

insert into interaction_targets (
  id,
  interaction_id,
  autonomous_community_id,
  province_id,
  fp_center_id,
  professional_family_id,
  ciclo_formativo_id
)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '51111111-1111-1111-1111-111111111111'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '22222222-2222-2222-2222-222222222222',
    '52222222-2222-2222-2222-222222222221'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '51111111-1111-1111-1111-111111111112'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000004',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    null,
    '33333333-3333-3333-3333-333333333333',
    '53333333-3333-3333-3333-333333333331'
  ),
  (
    '70000000-0000-0000-0000-000000000005',
    '60000000-0000-0000-0000-000000000005',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '33333333-3333-3333-3333-333333333333',
    '53333333-3333-3333-3333-333333333331'
  ),
  (
    '70000000-0000-0000-0000-000000000006',
    '60000000-0000-0000-0000-000000000006',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '22222222-2222-2222-2222-222222222222',
    '52222222-2222-2222-2222-222222222221'
  ),
  (
    '70000000-0000-0000-0000-000000000007',
    '60000000-0000-0000-0000-000000000007',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '51111111-1111-1111-1111-111111111111'
  )
on conflict (id) do update
set interaction_id = excluded.interaction_id,
    autonomous_community_id = excluded.autonomous_community_id,
    province_id = excluded.province_id,
    fp_center_id = excluded.fp_center_id,
    professional_family_id = excluded.professional_family_id,
    ciclo_formativo_id = excluded.ciclo_formativo_id;

insert into contacts_professional_families (contact_id, professional_family_id, is_primary)
values
  ('40000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', true),
  ('40000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', true),
  ('40000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', true),
  ('40000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', true),
  ('40000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', true),
  ('40000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', true),
  ('40000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', true)
on conflict (contact_id, professional_family_id) do update
set is_primary = excluded.is_primary;

insert into enterprise_professional_family_status (
  enterprise_id,
  professional_family_id,
  quantity_needed,
  quantity_hired,
  notes,
  last_updated_by
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    2,
    0,
    'Buscan perfiles junior de desarrollo web.',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    3,
    1,
    'Alta demanda de auxiliares de enfermeria.',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    4,
    1,
    'Quieren reforzar equipo de sistemas y ciberseguridad.',
    '1f8e2397-a80b-4686-a669-7be460a6e4c5'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '33333333-3333-3333-3333-333333333333',
    1,
    0,
    'Interes puntual en perfiles administrativos.',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '33333333-3333-3333-3333-333333333333',
    3,
    2,
    'Buena experiencia previa con alumnado de FCT.',
    '4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1'
  )
on conflict (enterprise_id, professional_family_id) do update
set quantity_needed = excluded.quantity_needed,
    quantity_hired = excluded.quantity_hired,
    notes = excluded.notes,
    last_updated_at = now(),
    last_updated_by = excluded.last_updated_by;

insert into profiles (user_id, full_name, role, professional_family_id)
values
  ('2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f', 'Administrador', 'admin', null),
  ('4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1', 'Prospector de la consejeria', 'prospector', null),
  ('1f8e2397-a80b-4686-a669-7be460a6e4c5', 'Prospector del centro educativo', 'prospector', null),
  ('0f188ecb-e664-4ec4-ad8c-46ea075d6efb', 'Tutor', 'tutor', '11111111-1111-1111-1111-111111111111')
on conflict (user_id) do update
set full_name = excluded.full_name,
    role = excluded.role,
    professional_family_id = excluded.professional_family_id,
    updated_at = now();

commit;