# Base de datos de EquiGénero

El esquema sigue los modelos Sequelize del backend y está preparado para MySQL 8 con InnoDB y `utf8mb4`.

## Archivos

- `schema.mysql.sql`: creación de la base `equigenero` y sus tablas, restricciones y relación.
- `sample-data.mysql.sql`: oportunidades públicas iniciales, sin cuentas ni contraseñas.
- `diagrama-er.svg`: diagrama entidad-relación vectorial para incluir en el informe.

## Restaurar en MySQL

Desde PowerShell, en la raíz del proyecto:

```powershell
cmd /c """C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"" -u root -p < database\schema.mysql.sql"
cmd /c """C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"" -u root -p < database\sample-data.mysql.sql"
```

Se solicitará la contraseña de MySQL de forma interactiva. No la escribas en el comando ni la guardes en el repositorio.
También puedes abrir cada archivo `.sql` desde MySQL Workbench y ejecutar el script con el botón del rayo.

Alternativamente, configura las variables en `server/.env` y ejecuta desde la raíz:

```powershell
npm run migrate
npm run seed
npm run seed --prefix server -- --demo
```

El comando `seed` crea el administrador con los valores privados `ADMIN_EMAIL` y `ADMIN_PASSWORD` del archivo `server/.env`, y agrega oportunidades iniciales. `--demo` crea un usuario y situaciones ficticias para pruebas.

## Copia de respaldo

Para entregar un respaldo MySQL de una base ya poblada, exporta solo datos de prueba (nunca reportes personales ni credenciales reales):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p --databases equigenero --no-tablespaces --result-file=database\equigenero-sample.sql
```

El dump generado debe revisarse y limpiarse de cuentas o información personal antes de subirlo. No se incluye un dump de producción en este repositorio; `schema.mysql.sql` y `sample-data.mysql.sql` son los artefactos seguros para reconstruir el esquema y contenido público de ejemplo.

## Modelo

`situaciones.usuarioId` referencia `usuarios.id`. Al eliminar un usuario, sus situaciones se eliminan en cascada. `oportunidades` es un catálogo independiente. El diagrama `diagrama-er.svg` representa las mismas entidades y cardinalidades.
