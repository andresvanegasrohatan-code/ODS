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
| `DB_SSL`, `DB_SSL_CA` | Opcional para MySQL remoto. Con `DB_SSL=true`, se exige el certificado CA y se valida el certificado del servidor |
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

## Denuncia anónima cifrada: estado de implementación

La Fase 3 reemplaza el prototipo anterior: `/api/anonimos` fue retirado porque su consulta enviaba la frase al servidor. El flujo actual de creación cifra el título, el tipo y la descripción en el navegador; `POST /api/casos` recibe solo campos criptográficos y devuelve un código aleatorio de 12 caracteres. El servidor guarda el hash bcrypt del verificador derivado, nunca la frase.

La Fase 1 añade utilidades Web Crypto y pruebas unitarias. La Fase 2 permite a una administradora configurar una llave RSA-OAEP de 3072 bits en `/app/llaves`. La llave privada se cifra en el navegador con AES-GCM y PBKDF2/SHA-256 (600.000 iteraciones); solo se envía al servidor el resultado cifrado. El respaldo descargable también contiene únicamente la llave privada cifrada y debe guardarse fuera de línea, separado de la frase maestra. El JWT de la sesión web se guarda en `sessionStorage` y el token legado en `localStorage` se elimina al abrir la aplicación; los tokens de sesiones previas deben volver a autenticarse.

La llave AES del caso se envuelve para la organización con RSA-OAEP y para la persona denunciante con AES-KW derivado de su frase secreta. El servidor también aplica bcrypt con costo 12 al verificador PBKDF2 derivado. La tabla `casos_anonimos` no almacena título, tipo ni descripción en claro.

La Fase 4 añade seguimiento del lado denunciante: `GET /api/casos/:codigo/sales` devuelve la misma forma para casos existentes y no existentes, usando sales falsas deterministas cuando el código no existe. `POST /api/casos/:codigo/acceso` recibe únicamente el verificador PBKDF2 derivado, compara con bcrypt y entrega datos cifrados solo si la autenticación pasa. Se permiten cinco intentos por hora por código; el sexto se bloquea. Los contadores se guardan usando un HMAC del código en `accesos_caso`, no el código en claro.

La Fase 5 añade el panel administrativo `/app/casos-anonimos`, el chat cifrado consultado cada 10 segundos y las evidencias cifradas. El acceso correcto emite un token de caso de una hora que se guarda solo en memoria de la página; si caduca, vuelve a autenticarse con código y frase. La administradora usa su sesión normal. Los mensajes y los metadatos de archivo se cifran con la llave AES del caso en el navegador; el servidor solo guarda su ciphertext e IV. Las evidencias se cifran antes de ir directamente del navegador a un bucket privado de Supabase. El servidor genera tokens de carga y enlaces de descarga con vigencia de 60 segundos. El nombre y el MIME del archivo también se cifran.

Para activar evidencias en Supabase:

1. Crea un bucket **privado** llamado `equigenero-evidencias` (o configura el mismo nombre en cliente y servidor).
2. Establece el límite de tamaño del bucket en **10.485.776 bytes** (10 MiB más la etiqueta GCM de 16 bytes). La aplicación también rechaza tamaños mayores y verifica el tamaño del objeto al completar la carga. El cliente acepta únicamente imágenes PNG, JPEG, WebP o GIF y PDF; el tipo y el nombre se almacenan cifrados.
3. En `server/.env`, configura `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_EVIDENCIAS_BUCKET`. La clave `service_role` solo va en el servidor/Vercel, nunca en el cliente.
4. En `client/.env` o las variables de compilación de Vercel, configura `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_EVIDENCIAS_BUCKET`. La clave `anon` puede ser pública y se limita a consumir los tokens de carga firmados.
5. Si tu configuración del proyecto Supabase aplica restricciones de origen, permite el dominio del frontend. Las cargas son binarias (`application/octet-stream`), no se envía el archivo a Express ni a la función de Vercel.

Los modelos para casos, llaves, accesos, mensajes y evidencias se crean/ajustan con el mecanismo existente `sequelize.sync()` al iniciar el servidor o con `npm run migrate --prefix server`; no se agregó un gestor de migraciones. El SQL en `database/schema.mysql.sql` también incluye estas tablas para instalaciones manuales.

La Fase 6 añade una salida rápida visible y doble `Escape` (dos pulsaciones dentro de 1,5 segundos). Ambos limpian el estado de la denuncia/sesión administrativa y usan `window.location.replace` para sustituir la ruta actual por una pantalla neutra local, sin contactar otro sitio.

### Limitaciones y recuperación

- Si la persona denunciante olvida su frase secreta, no puede abrir su copia AES-KW de la llave del caso; la administradora todavía puede leer el caso con su llave privada.
- Si la administradora pierde la frase maestra, la copia de la llave privada guardada en el servidor no se puede descifrar; los casos quedan inaccesibles para la organización salvo que exista una copia independiente recuperable de la llave privada. Para el informe se recomienda conservar una copia impresa de la llave privada fuera de línea, bajo custodia física. La pantalla actual permite descargar un respaldo **cifrado**, pero no imprime ni exporta la llave privada en claro; por eso cumplir esa recomendación requiere un procedimiento de recuperación independiente, con acceso controlado y custodia separada de la frase maestra. Imprimir solo el respaldo cifrado no recupera una frase perdida.
- El navegador descarga el código JavaScript desde el mismo servidor que entrega la aplicación. Un servidor comprometido podría entregar JavaScript alterado para capturar una frase o contenido antes/después del cifrado. Este diseño no protege frente a un cliente web manipulado.
- La salida rápida solo sustituye la entrada de historial actual y descarga el estado en memoria al abandonar la página. No borra navegación anterior, historial previo, caché/descargas, capturas, rastros del dispositivo ni registros de red/hosting (incluidos Vercel y Supabase).
- La implementación no debe describirse como “100 % segura” ni como cumplimiento de obligaciones legales. Cifra contenido, mensajes, metadatos de evidencias y archivos antes de enviarlos; no oculta necesariamente metadatos de conexión ni protege frente a un dispositivo comprometido, JavaScript alterado o frases/llaves expuestas.

**Al migrar una base previa:** haz primero una copia de seguridad. Las denuncias guardadas por el prototipo antiguo no se cifran automáticamente; los registros históricos pueden contener texto en claro y requieren una decisión explícita de conservación o eliminación antes de migrar. El almacenamiento privado y sus claves de entorno deben configurarse y probarse en el entorno de despliegue antes de habilitar la carga de evidencias.

La aplicación no incorpora un middleware que registre IP en las rutas anónimas. Los logs de Vercel, Supabase, el proxy o la infraestructura pueden registrar IP y metadatos de conexión; no se pueden controlar desde el código de esta aplicación.

---

## API REST

Todas las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crea cuenta (siempre rol `usuario`) |
| POST | `/api/auth/login` | Público | Devuelve `{ usuario, token }` |
| GET | `/api/auth/me` | Autenticado | Perfil del usuario actual |
| GET | `/api/oportunidades` | Público | Lista oportunidades activas desde la base de datos |
| GET | `/api/llaves-organizacion/publica` | Público | Obtiene la llave RSA-OAEP pública activa |
| GET | `/api/llaves-organizacion/administradora` | Admin | Obtiene la copia cifrada de la llave privada |
| POST | `/api/llaves-organizacion` | Admin | Guarda el par de llaves; la privada debe llegar cifrada |
| POST | `/api/casos` | Público | Crea una denuncia con campos criptográficos; devuelve código de seguimiento |
| GET | `/api/casos/:codigo/sales` | Público | Entrega sales reales o falsas deterministas sin revelar existencia |
| POST | `/api/casos/:codigo/acceso` | Público | Verifica el derivado con bcrypt; limita intentos y devuelve ciphertext |
| GET | `/api/casos/administracion` | Admin | Lista casos cifrados para el panel administrativo |
| PATCH | `/api/casos/administracion/:id/estado` | Admin | Actualiza el estado del caso |
| GET/POST | `/api/casos/:codigo/mensajes` | Sesión del caso o Admin | Consulta/envía mensajes cifrados |
| GET | `/api/casos/:codigo/evidencias` | Sesión del caso o Admin | Lista metadatos cifrados de evidencias disponibles |
| POST | `/api/casos/:codigo/evidencias/cargas` | Sesión del caso o Admin | Emite un token de carga para subir ciphertext directo a Supabase |
| POST | `/api/casos/:codigo/evidencias/:id/descarga` | Sesión del caso o Admin | Emite URL de descarga válida por 60 segundos |
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

Las evidencias de denuncias anónimas se cifran en el navegador y se cargan directamente a Supabase Storage privado con tokens de carga firmados; Express nunca recibe el archivo. Las descargas usan URL firmada de 60 segundos y solo se descifran en el navegador que tiene la llave del caso.

## Pruebas del flujo anónimo

En CMD, desde la raíz del proyecto:

```cmd
npm test --prefix client
npm test --prefix server
npm run build --prefix client
```

Las pruebas usan mensajes y archivos ficticios. El cliente debe aprobar pruebas de cifrado AES-GCM, mensajes, metadatos de evidencia, PBKDF2, AES-KW y RSA-OAEP. El servidor debe aprobar pruebas de sales falsas, denegación de acceso y bloqueo del sexto intento, almacenamiento de mensajes solo cifrados y cambio de estado. El build debe terminar correctamente; Vite puede mostrar una advertencia de tamaño de bundle.

Prueba manual adicional con datos ficticios:

1. Registra una denuncia, consérvala con su código y frase ficticios, y consulta el caso. Una frase incorrecta debe ser denegada; el sexto intento dentro de una hora devuelve HTTP 429. Una frase maestra incorrecta debe fallar al desbloquear la llave privada.
2. Envía un mensaje de prueba y agrega una imagen/PDF ficticio. En MySQL Workbench ejecuta:

   ```sql
   SELECT codigo, contenido_cifrado, iv FROM casos_anonimos;
   SELECT autor, contenido_cifrado, iv FROM mensajes_caso;
   SELECT metadatos_cifrados, metadatos_iv, contenido_iv FROM evidencias_caso;
   ```

   Los valores son Base64 cifrados, no el texto original. En la tabla de evidencias no se guarda el nombre ni el MIME en claro.
3. En Supabase Storage, descarga el objeto cifrado directamente (sin pasar por el botón de descifrado de la aplicación): su contenido no debe abrirse como la imagen/documento original. En la aplicación, la descarga solo debe abrirse luego de descifrarse con la llave del caso.
4. En `/denuncia-anonima`, activa la salida rápida con el botón o pulsando `Escape` dos veces dentro de 1,5 segundos. Debe mostrar la página neutra local en `/salida-rapida`; usa Atrás y comprueba que la entrada de la denuncia no queda como entrada actual del historial.

La integración real de cargas y enlaces firmados requiere credenciales y un bucket Supabase configurado; no se puede validar contra el servicio hasta completar esos pasos. No uses reportes, frases ni evidencias reales para estas pruebas.

---

## Despliegue en Vercel con MySQL de Aiven

El proyecto está configurado para publicar el frontend Vite y la API Express como funciones serverless en el mismo proyecto Vercel. `api/[...path].js` atiende rutas API de un solo segmento y `api/auth/[action].js` enruta `/api/auth/*` a Express. Ambas funciones comparten `server/src/serverlessHandler.js`, que verifica la conexión a la base de datos al iniciar una instancia. `vercel.json` incluye explícitamente `server/node_modules/mysql2` en ambas funciones para que el trazado de dependencias de Vercel no omita el controlador MySQL.

1. Importa en Vercel el repositorio de GitHub que contiene la raíz de este proyecto. Deja **Root Directory** vacío (raíz del repositorio). La configuración del proyecto usa `npm run install:all`, `npm run build` y el directorio `client/dist`, definidos en `vercel.json`.
2. En **Project Settings → Environment Variables**, agrega las variables necesarias para Production (y Preview si aplica): `NODE_ENV=production`, `DB_DIALECT=mysql`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`, `DB_SSL_CA`, `CLIENT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_EVIDENCIAS_BUCKET`. Usa los datos de conexión de Aiven; no uses el host ni credenciales del MySQL local. Pega en `DB_SSL_CA` el certificado CA completo. El backend admite saltos de línea reales o `\n` escapados y valida el certificado del servidor.
3. Mantén `VITE_API_URL=/api` para que el navegador llame a la API del mismo dominio. Configura también `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SUPABASE_EVIDENCIAS_BUCKET` como variables disponibles durante la compilación. Nunca definas contraseñas, certificados, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` o credenciales administrativas como variables `VITE_*`, ya que se incorporan al cliente.
4. Antes de desplegar, configura de forma privada las variables Aiven localmente y ejecuta `npm run migrate` y `npm run seed` desde la raíz. Define `ADMIN_EMAIL`, `ADMIN_NAME` y una `ADMIN_PASSWORD` segura de al menos 12 caracteres; no se usan contraseñas predeterminadas. `seed` crea el administrador si no existe; si el correo ya pertenece a un usuario, lo promueve y establece la contraseña configurada. El registro público siempre crea cuentas de usuario normales. No ejecutes `seed --demo` en producción. También puedes cargar `database/schema.mysql.sql` y `database/sample-data.mysql.sql` mediante la consola SQL de Aiven.
5. Despliega o vuelve a desplegar en Vercel. Verifica `https://TU-DOMINIO.vercel.app/api/health`, registro/inicio de sesión, registro y consulta de situaciones y oportunidades.

La función es serverless: valida la conexión en cada instancia fría y reutiliza la conexión durante la vida de esa instancia. Comprueba que el servicio Aiven permita conexiones públicas desde Vercel y revisa los límites y costos del periodo de prueba. Una cuenta MySQL autorizada solo para `localhost` no permite que Vercel se conecte. Guarda secretos solo en las variables privadas de Vercel; nunca en GitHub ni en el navegador.

Para completar la entrega académica, agrega al informe la URL pública final, la URL del repositorio, los integrantes y las credenciales de prueba seguras. No publiques datos personales reales.

## Solución de problemas

- **`Falta JWT_SECRET`**: no creaste `server/.env`.
- **Error de CORS**: `CLIENT_URL` no coincide con la URL desde la que abres el frontend.
- **`sqlite3` no instala**: usa Node 18/20 LTS, o cambia a PostgreSQL (`DB_DIALECT=postgres`).
- **401 al entrar a `/app`**: el token expiró; vuelve a iniciar sesión.

## Licencia

MIT
