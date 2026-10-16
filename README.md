# EquiGénero

Plataforma web para promover la **igualdad de género (ODS 5)**: información educativa, oportunidades, y un sistema de registro, seguimiento y reportes de situaciones de discriminación o desigualdad.

**Stack:** React 18 + Vite + Tailwind CSS · Node.js + Express · Sequelize ORM · SQLite (por defecto), MySQL o PostgreSQL · JWT + bcrypt · Recharts.

> Las oportunidades se cargan desde la base de datos y se pueden administrar en la tabla `oportunidades` con MySQL Workbench cuando se usa MySQL.

---

## Estructura del proyecto

```
equigenero-app/
├── package.json              # Scripts para ejecutar todo desde la raíz
├── .gitignore
├── README.md
├── server/                   # API REST (Express + Sequelize)
│   ├── package.json
│   ├── server.js             # Punto de entrada
│   ├── .env.example
│   └── src/
│       ├── app.js            # Express, CORS, helmet, rutas
│       ├── migrate.js        # Crea/ajusta las tablas
│       ├── seed.js           # Crea el administrador (y datos demo)
│       ├── config/           # database.js, constants.js
│       ├── models/           # Usuario, Situacion, index (relaciones)
│       ├── middleware/       # auth (JWT + roles), errorHandler
│       ├── controllers/      # auth, situaciones, reportes
│       └── routes/           # authRoutes, situacionRoutes, reporteRoutes
├── database/                 # Esquema SQL, datos de ejemplo y diagrama ER
│   ├── schema.mysql.sql
│   ├── sample-data.mysql.sql
│   └── diagrama-er.svg
└── client/                   # Frontend (React + Tailwind)
    ├── package.json
    ├── vite.config.js        # Proxy /api -> localhost:4000
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx · App.jsx · index.css
        ├── services/         # api.js (Axios + JWT), auth, situaciones, reportes
        ├── context/          # AuthContext.jsx
        ├── components/       # AppLayout, ProtectedRoute, Badge, StatCard...
        ├── pages/            # Home, Auth, Dashboard, RegistrarSituacion,
        │                     # Seguimiento, AdminSituaciones, Reportes...
        └── data/             # Contenido educativo y oportunidades
```

---

## Requisitos

- **Node.js 18 o superior** (`node -v`)
- npm 9+
- (Opcional) MySQL 8+ con MySQL Workbench, o PostgreSQL 14+

---

## Instalación paso a paso

### 1. Instalar dependencias

Desde la carpeta raíz:

```bash
npm run install:all
```

(Equivale a ejecutar `npm install` dentro de la raíz, `server/` y `client/`.)

### 2. Configurar las variables de entorno

**Backend:**

```bash
cd server
cp .env.example .env        # En Windows: copy .env.example .env
```

Abre `server/.env` y ajusta:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (por defecto `4000`) |
| `CLIENT_URL` | URL(s) del frontend permitidas por CORS, separadas por coma |
| `JWT_SECRET` | **Obligatorio.** Cadena larga y aleatoria. Genera una con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Duración del token (ej. `8h`) |
| `DB_DIALECT` | `sqlite` (por defecto), `mysql` o `postgres` |
| `SQLITE_PATH` | Ruta del archivo SQLite |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Solo MySQL. Host, puerto, esquema y credenciales |
| `DATABASE_URL` | Solo PostgreSQL: `postgres://usuario:clave@localhost:5432/equigenero` |
| `DB_SSL` | `true` si tu proveedor de PostgreSQL exige SSL |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Datos del administrador inicial |

**Frontend (opcional en desarrollo):**

```bash
cd client
cp .env.example .env
```

En desarrollo no necesitas cambiar nada: Vite redirige `/api` hacia `http://localhost:4000`.

### 3. Migrar la base de datos

```bash
npm run migrate
```

Crea/actualiza las tablas `usuarios`, `situaciones` y `oportunidades`. Con SQLite se genera el archivo `server/database.sqlite`.

> Para PostgreSQL, crea antes la base vacía: `createdb equigenero`.

### Usar MySQL con MySQL Workbench

Workbench es la interfaz para conectarte y administrar un **servidor MySQL**; instalar Workbench por sí solo no instala ni inicia ese servidor.

1. Asegúrate de tener MySQL Server instalado y en ejecución. En Workbench, crea una conexión con el botón **+**: host `localhost`, puerto `3306` y el usuario de MySQL que configuraste. Usa **Test Connection** para verificarla.
2. En esa conexión, abre una pestaña SQL y crea el esquema:

   ```sql
   CREATE DATABASE equigenero
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

3. En `server/.env`, cambia `DB_DIALECT=sqlite` a `DB_DIALECT=mysql` y configura `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. No publiques ni compartas ese archivo: contiene la contraseña.
4. Instala/actualiza dependencias y crea las tablas/datos iniciales:

   ```bash
   npm install --prefix server
   npm run migrate
   npm run seed
   ```

5. Reinicia la API con `npm run dev`. En Workbench actualiza el esquema `equigenero`; verás las tablas `usuarios`, `situaciones` y `oportunidades`. La web obtiene las oportunidades de `GET /api/oportunidades`.

La base SQLite actual no se copia automáticamente a MySQL. El cambio de dialecto inicia una base MySQL separada; los usuarios y situaciones previos seguirán en el archivo SQLite. El comando `seed` agrega oportunidades iniciales solo si aún no existen. Después puedes revisar y administrar las oportunidades en la tabla `oportunidades` desde Workbench; los cambios en `activo`, `orden`, texto y enlaces se reflejan en la web.

En Workbench puedes consultar las oportunidades publicadas:

```sql
SELECT id, etiqueta, titulo, fecha, url, activo
FROM oportunidades
ORDER BY orden, id;
```

Para ocultar una oportunidad sin borrarla:

```sql
UPDATE oportunidades SET activo = FALSE WHERE id = 1;
```

Los cambios se ven en la web al recargarla. Solo los registros con `activo = TRUE` se muestran.

### 4. Crear el administrador

```bash
npm run seed
```

Crea la cuenta definida en `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Para cargar además un usuario y casos de demostración:

```bash
npm run seed --prefix server -- --demo
```

(crea `ana@equigenero.com` / `Usuario123!` con tres situaciones de ejemplo).

### 5. Ejecutar en desarrollo

Todo junto, desde la raíz:

```bash
npm run dev
```

O por separado, en dos terminales:

```bash
npm run dev:server     # API en http://localhost:4000
npm run dev:client     # Web en http://localhost:5173
```

Abre **http://localhost:5173**.

---

## Verificación rápida

1. `http://localhost:4000/api/health` debe responder `{"estado":"ok", ...}`.
2. Crea una cuenta desde la web → entras como **usuario**.
3. Registra una situación → aparece en *Seguimiento* con estado *Pendiente*.
4. Cierra sesión e inicia con el administrador del `.env` → ves *Situaciones* (cambiar estado, notas de seguimiento, eliminar) y *Reportes* (gráficos y exportar CSV).

---

## API REST

Todas las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crea cuenta (siempre rol `usuario`) |
| POST | `/api/auth/login` | Público | Devuelve `{ usuario, token }` |
| GET | `/api/auth/me` | Autenticado | Perfil del usuario actual |
| GET | `/api/oportunidades` | Público | Lista oportunidades activas desde la base de datos |
| GET | `/api/situaciones` | Autenticado | Admin: todas · Usuario: solo las suyas. Filtros: `q`, `estado`, `tipo` |
| GET | `/api/situaciones/stats` | Autenticado | Totales por estado para el dashboard |
| POST | `/api/situaciones` | Autenticado | Registra una situación |
| GET | `/api/situaciones/:id` | Dueño o admin | Detalle |
| PATCH | `/api/situaciones/:id/estado` | Admin | Cambia `estado` y/o `seguimiento` |
| DELETE | `/api/situaciones/:id` | Admin | Elimina la situación |
| GET | `/api/reportes/resumen` | Admin | Estadísticas y registros. Filtros: `desde`, `hasta`, `tipo`, `estado` |

## Base de datos y modelo ER

Para recrear el esquema MySQL, cargar oportunidades de ejemplo, revisar la relación entre las entidades y generar un respaldo de datos de prueba, consulta [`database/README.md`](./database/README.md). El diagrama vectorial está en [`database/diagrama-er.svg`](./database/diagrama-er.svg).

No publiques archivos `.env`, contraseñas, cuentas personales ni reportes reales en el repositorio. El respaldo solicitado para la entrega debe contener únicamente datos ficticios preparados para evaluación.

---

## Decisiones de seguridad (cambios respecto al prototipo)

- **El registro público no permite elegir rol.** En el prototipo cualquiera podía crearse como "Administrador"; en la versión real solo se crean usuarios normales. Los administradores se crean con `npm run seed`.
- Contraseñas con hash **bcrypt** (paquete `bcryptjs`, compatible con `bcrypt` y sin compilación nativa) y tokens **JWT** con expiración.
- `helmet`, CORS restringido a `CLIENT_URL` y límite de intentos en login/registro.
- Los usuarios solo ven sus propias situaciones; cambiar estado y eliminar es exclusivo del administrador.
- Estas situaciones contienen datos sensibles: en producción usa **HTTPS**, un `JWT_SECRET` fuerte y define tu política de privacidad y tratamiento de datos.

## Evidencia / archivos adjuntos

El campo de archivo del prototipo no se persistía. Para no exponer evidencia sensible sin control de acceso, no está incluido en esta versión. Si lo necesitas, se recomienda `multer` con descargas protegidas por JWT.

---

## Despliegue (pendiente de publicación)

La actividad exige una URL pública en **Render o Vercel**. Este repositorio local aún necesita publicarse en GitHub y conectarse a una de esas plataformas antes de que exista un enlace público que pueda compartirse.

La arquitectura actual permite desplegar el cliente compilado y la API Express en un único servicio Node compatible con Render: `npm run build` genera `client/dist` y Express lo sirve en producción junto con `/api`. Configura las variables privadas de la base de datos, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el panel de la plataforma; ejecuta `npm run migrate` y `npm run seed` una vez para preparar el servicio. `VITE_API_URL=/api` conserva el mismo origen para web y API.

El proyecto también admite PostgreSQL mediante `DB_DIALECT=postgres`, `DATABASE_URL` y `DB_SSL`; puede utilizarse si la arquitectura de despliegue elegida ofrece ese motor. La base de desarrollo MySQL local no es automáticamente accesible desde la nube: debe provisionarse una instancia de base de datos remota y cargar allí el esquema/datos de prueba.

Antes de dar la entrega por terminada, agrega aquí la URL pública, el enlace al repositorio GitHub y credenciales de prueba seguras. No publiques secretos en el README ni en variables `VITE_*`. Usa HTTPS y no pongas reportes personales reales en un entorno de evaluación.

## Solución de problemas

- **`Falta JWT_SECRET`**: no creaste `server/.env`.
- **Error de CORS**: `CLIENT_URL` no coincide con la URL desde la que abres el frontend.
- **`sqlite3` no instala**: usa Node 18/20 LTS, o cambia a PostgreSQL (`DB_DIALECT=postgres`).
- **401 al entrar a `/app`**: el token expiró; vuelve a iniciar sesión.

## Licencia

MIT
