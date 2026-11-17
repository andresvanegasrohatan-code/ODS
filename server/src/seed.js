require('dotenv').config();
const { sequelize, Usuario, Situacion, Oportunidad } = require('./models');

const OPORTUNIDADES_INICIALES = [
  {
    etiqueta: 'Orientación · Colombia',
    color: 'violet',
    titulo: 'Línea 155 para orientación a mujeres',
    texto: 'Canal nacional de orientación sobre violencias basadas en género. Si hay una emergencia o peligro inmediato, llama al 123.',
    fecha: 'Recurso permanente',
    url: 'tel:155',
    enlaceTexto: 'Llamar al 155',
    informacionUrl: 'https://www.policia.gov.co/patrulla-purpura',
    orden: 1,
  },
  {
    etiqueta: 'Evento anual',
    color: 'brand',
    titulo: 'Día para Eliminar la Violencia contra la Mujer',
    texto: 'El 25 de noviembre comienza la campaña anual de 16 días de activismo, que termina el 10 de diciembre.',
    fecha: 'Cada 25 de noviembre',
    url: 'https://www.un.org/es/observances/ending-violence-against-women-day',
    enlaceTexto: 'Consultar información de la ONU',
    orden: 2,
  },
  {
    etiqueta: 'Voluntariado',
    color: 'gold',
    titulo: 'Voluntariado en línea de Naciones Unidas',
    texto: 'Explora asignaciones de voluntariado en línea; las oportunidades disponibles y sus requisitos pueden cambiar.',
    fecha: 'Convocatorias según disponibilidad',
    url: 'https://app.unv.org/',
    enlaceTexto: 'Explorar oportunidades',
    orden: 3,
  },
];

async function sembrar() {
  try {
    const correoAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const contrasenaAdmin = process.env.ADMIN_PASSWORD;
    if (!correoAdmin || !contrasenaAdmin) {
      throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD antes de ejecutar el seed');
    }
    if (contrasenaAdmin.length < 12) {
      throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres');
    }

    await sequelize.authenticate();
    await sequelize.sync();

    let admin = await Usuario.findOne({ where: { correo: correoAdmin } });

    if (!admin) {
      admin = await Usuario.create({
        nombre: process.env.ADMIN_NAME || 'Administrador',
        correo: correoAdmin,
        contrasena: contrasenaAdmin,
        rol: 'administrador',
      });
      console.log(`Administrador creado: ${correoAdmin}`);
    } else {
      const cambios = { contrasena: contrasenaAdmin };
      if (admin.rol !== 'administrador') cambios.rol = 'administrador';
      if (process.env.ADMIN_NAME?.trim()) cambios.nombre = process.env.ADMIN_NAME.trim();
      await admin.update(cambios);
      console.log(`Cuenta administradora ${correoAdmin} configurada`);
    }

    for (const oportunidad of OPORTUNIDADES_INICIALES) {
      await Oportunidad.findOrCreate({
        where: { titulo: oportunidad.titulo },
        defaults: oportunidad,
      });
    }
    console.log('Oportunidades iniciales verificadas');

    if (process.argv.includes('--demo')) {
      let demo = await Usuario.findOne({ where: { correo: 'ana@equigenero.com' } });
      if (!demo) {
        demo = await Usuario.create({
          nombre: 'Ana Martínez',
          correo: 'ana@equigenero.com',
          contrasena: 'Usuario123!',
          rol: 'usuario',
        });
      }
      const existentes = await Situacion.count({ where: { usuarioId: demo.id } });
      if (existentes === 0) {
        await Situacion.bulkCreate([
          {
            tipo: 'Discriminación educativa',
            fecha: '2026-09-04',
            lugar: 'Facultad de Ingeniería',
            descripcion: 'Comentarios discriminatorios durante una clase.',
            prioridad: 'Medio',
            estado: 'Activo',
            seguimiento: 'Caso recibido y en revisión por Bienestar.',
            usuarioId: demo.id,
          },
          {
            tipo: 'Desigualdad de oportunidades',
            fecha: '2026-09-03',
            lugar: 'Bienestar Universitario',
            descripcion: 'Convocatoria con criterios que excluyen a un género.',
            prioridad: 'Bajo',
            estado: 'Pendiente',
            seguimiento: '',
            usuarioId: demo.id,
          },
          {
            tipo: 'Acoso',
            fecha: '2026-09-02',
            lugar: 'Cafetería central',
            descripcion: 'Situación de acoso reportada por un estudiante.',
            prioridad: 'Alto',
            estado: 'Resuelto',
            seguimiento: 'Se realizó mediación y seguimiento con las partes.',
            usuarioId: demo.id,
          },
        ]);
        console.log('Datos de demostración creados (usuario ana@equigenero.com / Usuario123!)');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
}

sembrar();
