USE equigenero;

INSERT INTO oportunidades
  (etiqueta, color, titulo, texto, fecha, url, enlace_texto, informacion_url, activo, orden, createdAt, updatedAt)
VALUES
  (
    'Orientación · Colombia',
    'violet',
    'Línea 155 para orientación a mujeres',
    'Canal nacional de orientación sobre violencias basadas en género. Si hay una emergencia o peligro inmediato, llama al 123.',
    'Recurso permanente',
    'tel:155',
    'Llamar al 155',
    'https://www.policia.gov.co/patrulla-purpura',
    1,
    1,
    NOW(),
    NOW()
  ),
  (
    'Evento anual',
    'brand',
    'Día para Eliminar la Violencia contra la Mujer',
    'El 25 de noviembre comienza la campaña anual de 16 días de activismo, que termina el 10 de diciembre.',
    'Cada 25 de noviembre',
    'https://www.un.org/es/observances/ending-violence-against-women-day',
    'Consultar información de la ONU',
    NULL,
    1,
    2,
    NOW(),
    NOW()
  ),
  (
    'Voluntariado',
    'gold',
    'Voluntariado en línea de Naciones Unidas',
    'Explora asignaciones de voluntariado en línea; las oportunidades disponibles y sus requisitos pueden cambiar.',
    'Convocatorias según disponibilidad',
    'https://app.unv.org/',
    'Explorar oportunidades',
    NULL,
    1,
    3,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  etiqueta = VALUES(etiqueta),
  color = VALUES(color),
  texto = VALUES(texto),
  fecha = VALUES(fecha),
  url = VALUES(url),
  enlace_texto = VALUES(enlace_texto),
  informacion_url = VALUES(informacion_url),
  activo = VALUES(activo),
  orden = VALUES(orden),
  updatedAt = NOW();
