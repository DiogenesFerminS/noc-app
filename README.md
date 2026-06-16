# NOC - Centro de Operaciones de Red

Servicio en segundo plano que monitorea servicios web. Ejecuta tareas cron que
revisan la salud de URLs cada pocos segundos, guarda logs con nivel de severidad
en tres backends a la vez (sistema de archivos, MongoDB y PostgreSQL) y envía por
correo los logs acumulados de forma programada.

Los dominios a revisar y los correos a notificar **ya no están escritos en el
código**: se administran desde un módulo de Odoo 18 (`odoo-addons/noc_monitoring`)
y el NOC los lee mediante un endpoint HTTP, con recarga automática cada 5 minutos.

## Arquitectura general

```
Odoo 18 (módulo noc_monitoring)
  - noc.domain            (dominios/URLs a revisar)
  - noc.notification.email (correos a notificar)
  - GET /noc/config  ->  JSON con dominios activos + sus correos
        │  fetch()
        ▼
NOC (Node.js / TypeScript)
  - Lee la config al arrancar y la recarga cada 5 min
  - Crea un cron de chequeo (cada 5s) por cada dominio
  - Ante una caída, alerta por correo a los destinatarios de ese dominio
  - Escribe los logs en File System + MongoDB + PostgreSQL
```

## Pasos para iniciar el proyecto

### 1. Instalar dependencias
```
pnpm install
```

### 2. Configurar las variables de entorno
Copia `.env.template` a `.env` y asigna los valores. Cada campo está documentado
en detalle dentro de la propia plantilla.
```
cp .env.template .env
```
Las credenciales locales deben coincidir con las de `docker-compose.yml`. Para
enviar correos de verdad, coloca en `MAILER_SECRET_KEY` una contraseña de
aplicación real de Gmail (la app igual arranca sin ella).

```
MAILER_SERVICE=gmail
MAILER_EMAIL=tu-correo@gmail.com
MAILER_SECRET_KEY=tu-app-password

MONGO_URL=mongodb://mongo-user:123456@127.0.0.1:27017
MONGO_DB_NAME=NOC
MONGO_USER=mongo-user
MONGO_PASS=123456

POSTGRES_USER=postgres
POSTGRES_DB=NOC
POSTGRES_PASSWORD=123456

DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5430/NOC?schema=public

# Endpoint del módulo de Odoo que expone los dominios y correos a monitorear.
NOC_CONFIG_URL=http://127.0.0.1:8080/noc/config
```

> **Importante (hosts):** se usa `127.0.0.1` en lugar de `localhost` a propósito.
> En algunos equipos `localhost` resuelve solo a IPv6 (`::1`) y el loopback IPv6
> puede quedar inestable al apagar/encender el wifi, provocando *timeouts* de
> conexión a Mongo/Postgres. `127.0.0.1` fuerza IPv4 y evita ese problema.

### 3. Levantar las bases de datos (MongoDB + PostgreSQL)
```
docker compose up -d
```

> PostgreSQL se publica en el puerto **5430** del host (mapeado al 5432 del
> contenedor) para no chocar con una instancia local de Odoo que use el 5432.

### 4. Preparar Prisma (solo la primera vez, o tras editar el esquema)
```
npx prisma generate    # genera el cliente en src/generated/prisma
npx prisma db push     # crea la tabla en PostgreSQL
```

### 5. Configurar Odoo (origen de los dominios y correos)
1. Instala/actualiza el módulo `noc_monitoring` (la carpeta `odoo-addons` debe
   estar en el `addons_path` de Odoo):
   ```
   odoo -d tu_bd -u noc_monitoring --addons-path=.../odoo-addons,.../addons
   ```
2. En Odoo, ve a **NOC Monitoring → Domains** y agrega los dominios con su URL.
3. En **NOC Monitoring → Recipients** agrega los correos y asígnalos a cada dominio.
4. Verifica el endpoint (ajusta el puerto al de tu Odoo):
   ```
   curl http://127.0.0.1:8080/noc/config
   ```

### 6. Iniciar la app en modo desarrollo
```
pnpm dev
```

Deberías ver que carga la configuración desde Odoo y comienza a chequear cada
dominio cada 5 segundos, escribiendo en los tres backends:
```
Server started...
Mongo connected
Configuración del NOC aplicada: 2 dominio(s) monitoreado(s).
Mongo log created: 6a3173...
Log created with id: 1899
```

## Uso diario

Si las bases de datos ya están corriendo y Prisma ya está generado, solo necesitas:
```
pnpm dev
```

Si cambias dominios o correos en Odoo, el NOC los toma solo en la siguiente
recarga (cada 5 minutos), sin necesidad de reiniciar.

## Comandos útiles

| Comando | Descripción |
|---|---|
| `docker compose ps` | Ver si las bases de datos están arriba |
| `docker compose down` | Detener las bases de datos |
| `pnpm build` | Compilar a `dist/` |
| `pnpm start` | Compilar y ejecutar en modo producción (`node dist/app.js`) |

## Registro de cambios

### 2026-06-16 — Integración con Odoo, recarga en caliente y estabilidad de conexión

Resumen de los cambios realizados en esta fecha y review de los mismos.

**1. Nuevo módulo de Odoo 18 (`odoo-addons/noc_monitoring/`)**
- Modelo `noc.domain`: dominios/URLs a revisar (`name`, `url`, `active` y la
  relación `notification_email_ids`). Valida que la URL empiece por
  `http://`/`https://` y que sea única.
- Modelo `noc.notification.email`: destinatarios de las alertas (`name`, `email`
  validado y único, `active`), con relación a los dominios.
- Relación *many2many* entre ambos: cada dominio puede notificar a varios correos.
- Controlador HTTP `GET /noc/config` que devuelve en JSON los dominios activos con
  sus correos activos.
- Seguridad (grupos User/Manager + reglas de acceso), vistas list/form/search,
  menús y datos demo.

**2. El NOC ahora lee su configuración desde Odoo**
- `src/config/noc-config.ts`: nuevo loader `getNocConfig()` que consume el
  endpoint. Devuelve la lista de dominios, o `null` si Odoo no responde (para no
  borrar el monitoreo actual ante una caída temporal).
- `src/config/plugins/envs.plugin.ts` + `.env`: nueva variable `NOC_CONFIG_URL`.
- `src/presentation/server.ts`: reescrito. Se eliminaron la URL y el correo
  *hard-codeados*. Ahora crea **un cron de chequeo por dominio**, un resumen cada
  12h dirigido a la unión de todos los correos, y una **recarga en caliente cada
  5 minutos** que reprograma los chequeos solo si la configuración cambió.

**3. Puertos y estabilidad de conexión**
- `docker-compose.yml`: PostgreSQL pasa del puerto **5432 → 5430** en el host para
  no chocar con Odoo.
- `.env`: `DATABASE_URL` actualizado al 5430; `MONGO_URL`, `DATABASE_URL` y
  `NOC_CONFIG_URL` cambiados de `localhost` a **`127.0.0.1`** para forzar IPv4 y
  evitar *timeouts* intermitentes del loopback IPv6 al togglear el wifi.

**Observaciones del review (pendientes / a considerar):**
- *Alertas y logs compartidos:* `sendHighLogEmail` adjunta el archivo
  `logs/logs-high.log` completo (compartido entre todos los dominios), por lo que
  una alerta de un dominio puede incluir fallas de otros. Conviene marcar el
  dominio de origen en el log y filtrar por él.
- *Endpoint público:* `/noc/config` usa `auth='public'` sin token; expone las URLs
  internas y los correos a quien alcance Odoo. Recomendado protegerlo con un token.
- *Validación del JSON:* `getNocConfig` hace un cast sin validar; conviene validar
  que sea un arreglo con `url`/`emails` antes de usarlo.
- *Recarga concurrente:* `reloadConfig` no tiene guard de re-entrada; bajo un Odoo
  lento dos recargas podrían solaparse. Un flag booleano lo resuelve.
- *Normalización:* las restricciones `unique` de `url`/`email` son sensibles a
  mayúsculas y espacios; conviene normalizar el valor al guardar.
