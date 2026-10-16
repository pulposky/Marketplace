# AGENTS.md — Contexto del proyecto Marketplace

> Archivo de contexto para agentes de IA (lo leo al inicio de cada sesión para no
> releer todo el repo desde cero). **Si cambias estructura, flujos o convenciones,
> actualiza este archivo.** Está en español porque todo el proyecto está en español.
>
> Última revisión completa: 2026-10-16 (revisión de backend, frontend, BD, docs y tests).

---

## 1. Qué es

Marketplace web del **SENA — Centro Agroindustrial Hachón**. El cliente explora un
catálogo, **aparta** (reserva) productos por **1 hora** y va a pagar/reclamar al
**punto de venta (POS)**.

- **No cobra en línea**: solo reserva. El cobro ocurre en el POS
  (app de escritorio aparte, Python/Flet: https://github.com/pulposky/Sistema_POS).
- **Ambos comparten la misma base de datos MySQL** (`usuarios`, `clientes`, `producto`).
  La web usa `producto.limite_venta` (stock online); el POS usa `producto.stock` (físico).

Stack: **Node.js + Express 5**, plantillas **EJS**, **MySQL (mysql2)**, JS/CSS vanilla
sin build step. Seguridad: `helmet`, `compression`, `express-session`,
`express-rate-limit`, `express-validator`, `bcryptjs`, CSRF propio. Reportes: `pdfkit`.
(`qrcode` está en `package.json` pero **no se usa en el código** — dependencia muerta.)

---

## 2. Cómo correrlo y cómo validar cambios

```bash
npm install
npm start          # node server.js  (puerto 3000, o PORT del .env)
npm run dev        # nodemon
npm test           # node --test (35 tests, 4 archivos en test/)
```

Antes de dar por bueno un cambio:
- `node --check <archivo.js>` por cada JS editado.
- `node -e "require('./app.js')"` si tocaste la app (valida que cargue sin DB).
- `npm test` si tocaste `utils/roles.js`, `utils/helpers.js` o `middleware/csrf.js`
  (hay tests para esos tres).

El `.env` (no versionado) define: `BD_HOST/BD_PORT/BD_USER/BD_PASSWORD/BD_DATABASE`,
`PORT`, `SESSION_SECRET`, `NODE_ENV`, `RATE_LIMIT_MAX`. `config/database.js` acepta
tanto `BD_*` como `DB_*`.

Base de datos: `database/schema.sql` crea **`sena_pdv`** (script integrado web+POS
con `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
El nombre real que usa la app es el de `BD_DATABASE` en el `.env`.
Usuario semilla: `admin` / `admin123` (hash bcrypt en el script).

---

## 3. Arquitectura y flujo de una petición

Entrada `server.js` → carga `.env`, importa `app.js`, arranca el job
`services/expirarApartados` y hace `listen`. `app.js` monta los middlewares en
**este orden exacto** (importa el orden):

```
helmet → compression → express.static('public') → urlencoded/json (4mb)
→ limiteGeneral (300 req/15min por IP) → session (1h)
→ iniciarCsrf → contadorVisitas → verificarCsrf → routes → 404 → error handler
```

- `express.json({ limit: '4mb' })` porque las imágenes se suben en **base64**.
- 404: JSON si `req.path` empieza por `/api/`, si no renderiza `error.ejs`.
- Errores: 429/500 en JSON para `/api/`, si no `error.ejs`.

Dos modos de responder: **vista** (`res.render`, navegador) y **API**
(`res.json({ ok, mensaje, ... })`, consumida por `fetch`).

Muchas pantallas del panel renderizan solo el esqueleto EJS y luego llenan tablas
con `fetch` a `/api/admin/...`.

---

## 4. Mapa de archivos

### Raíz
| Archivo | Qué hace |
| --- | --- |
| `server.js` | Punto de entrada: `.env`, app, job de expiración, `listen`, shutdown limpio |
| `app.js` | Construye la app: middlewares, `res.locals.esRolAdmin/esRolPanel/tienePermiso/esSuperAdmin`, rutas |
| `config/` | `database.js` (pool MySQL), `session.js` (cookie 1h), `rateLimit.js` |
| `database/conexion.js` | Pool `mysql2` (connectionLimit 10) + prueba de conexión |
| `database/schema.sql` | DDL integrado web + POS |
| `services/expirarApartados.js` | Job cada 60s: cancela pendientes >1h y devuelve stock |
| `services/permisosService.js` | Caché en memoria de permisos por rol; carga desde MySQL al arrancar (defaults si falla) |
| `services/auditoriaService.js` | `registrar(req, accion, detalle)` fire-and-forget en `auditoria` |
| `services/iniciarModulos.js` | `iniciar()`: asegura `usuarios.activo`, `categorias` y `auditoria`; lo llama `server.js` |
| `test/` | `csrf.test.js`, `helpers.test.js`, `roles.test.js`, `permisos.test.js` |

### `models/` — SOLO SQL (callbacks, salvo `usuarioModel` que usa Promesas)
| Modelo | Responsabilidad |
| --- | --- |
| `productoModel.js` | Catálogo, destacados, ofertas, `restarLimiteVenta`, `devolverStockProducto` |
| `apartadoModel.js` | El corazón: crear/consultar/cambiar estado, expiración |
| `usuarioModel.js` | Login cliente (documento) y staff (usuario+password), perfil, clientes admin, CRUD del personal del panel (`listarStaff`, `crearStaff`, `asegurarEsquema`…) |
| `notificacionModel.js` | Campana del admin (`notificaciones`) |
| `notificacionClienteModel.js` | Notificaciones por cliente (`notificaciones_cliente`) |
| `historicosModel.js` | Analytics del dashboard |
| `permisosModel.js` | SQL de `permisos_rol` (Promesas): crea la tabla, elimina claves obsoletas, siembra defaults, lee y guarda permisos |
| `categoriaModel.js` | SQL de `categorias`: `asegurarTabla`, `sembrarDesdeProductos`, `renombrar` (propaga a `producto`), `eliminar` (bloquea si está en uso) |
| `auditoriaModel.js` | SQL de `auditoria`: asegurar tabla, registrar, listar/contar con filtros |
| `respaldoModel.js` | SQL de solo lectura sobre lista blanca (`TABLAS`): productos, apartados, clientes, usuarios. **No exporta contraseñas** |

### `controllers/` — lógica de negocio (controladores "gordos")
Convención por dominio: subcarpeta con `*VistasController.js` (render) y
`*ApiController.js` (JSON): `sitio/`, `cliente/`, `admin/`, `carrusel/`, `historicos/`.
Controladores 100% API quedan planos: `authController.js`, `productoController.js`,
`apartadoController.js`, `notificacionesController.js`,
`notificacionesClienteController.js`, `reportesController.js`.

### `routes/`
`index.js` monta `publico.js` + `cliente.js` + `admin.js`. Cada ruta lleva su
middleware de auth/rol. **El orden importa**: p. ej. `/api/admin/ofertas/precio/:id`
va antes que `/api/admin/ofertas/:id`.

### `middleware/`
| Archivo | Qué hace |
| --- | --- |
| `csrf.js` | `iniciarCsrf` (genera token 24 bytes hex en sesión → `res.locals.csrfToken`), `verificarCsrf` (exige header `x-csrf-token` o campo `_csrf` en POST/PUT/PATCH/DELETE, si no 403) |
| `verificarUsuario.js` | Sesión obligatoria (401 JSON en AJAX, si no redirect `/`) |
| `verificarAdmin.js` | Exige `esRolPanel` (admin/supervisor/promotor/técnico) |
| `verificarRol.js` | Factory por lista de roles (normaliza con `rolCanonico`) |
| `verificarPermiso.js` | Factory por permiso: `verificarPermiso('clientes')` etc. El admin siempre pasa; 401/403 en API, redirect a `/admin` en páginas |
| `contadorVisitas.js` | Inserta en `page_views` los GET de páginas (no API/img), salta roles del panel; borra >30 días en cada petición (**TODO: mover a cron**) |
| `noCache.js` | `Cache-Control: no-store...` (se aplica a rutas cliente y admin) |
| `validar.js` | `validarLogin` / `validarRegistro` con express-validator + saneo |

### `utils/`
- `roles.js` — **fuente única de verdad de roles**. `ROLES_ADMIN = [admin, supervisor, promotor]` (acceso total), `ROLES_MANTENIMIENTO = [tecnico]`, `ROLES_CARRUSEL = ROLES_ADMIN + tecnico`, `ROLES_PANEL = ROLES_ADMIN + ROLES_MANTENIMIENTO`, `ROLES_STAFF = ROLES_ADMIN + ROLES_MANTENIMIENTO` (roles asignables en `/admin/usuarios`) y `ETIQUETAS_ROL_STAFF`. `EQUIVALENCIAS_ROL` normaliza variantes de la BD (con tildes/mayúsculas). Exporta `ROL_SUPERADMIN` (`'admin'`), `esSuperAdmin`, `esRolAdmin`, `esRolMantenimiento`, `puedeGestionarCarrusel`, `esRolPanel`, `rolCanonico`, `normalizarRol`.
- `permisos.js` — **fuente única de verdad de permisos**. Claves actuales: `productos, ofertas, pedidos, carrusel, clientes, analitica, categorias, respaldo, usuarios, auditoria`. Roles gestionables: `supervisor, promotor, tecnico`. El admin siempre tiene todo. `usuarios`, `auditoria` y `respaldo` no vienen por defecto en ningún rol.
- `helpers.js` — `normalizarCategorias` y `calcularPrecioOferta` (aplica descuento solo si está vigente por fechas; `descuento <= 0 || >= 100` = sin oferta).
- `imagenes.js` — `asociarImagenesAProductos`: empareja producto ↔ imagen de `public/img/upload` **por nombre normalizado** (quita tildes/espacios, minúsculas); `normalizeText` se reusa al guardar imágenes.

---

## 5. Base de datos (tablas clave)

Compartidas web+POS: `usuarios` (staff/POS, `usuario`+`password` bcrypt, `rol`,
y `activo` —columna que agrega la web—), `clientes` (`documento` + `password` bcrypt
para login cliente), `producto`.

- `producto`: `precio`, `stock` (POS), **`limite_venta`** (web), `estado` ('activo'/'inactivo'),
  `categoria`, `descripcion`, `descuento`, `fecha_inicio_oferta`, `fecha_fin_oferta`.
  **`es_huevo` NO existe en `schema.sql`** (puede venir del POS); el código cae al
  fallback de detectar `'huevo'` en el nombre.
- `apartados` (solo web): `nombre_cliente` (**texto, no FK**), `producto` (FK→producto),
  `cantidad`, `precio_aplicado` (precio con descuento **capturado al apartar**),
  `estado` ENUM(`pendiente`,`confirmado`,`cancelado`,`entregado`), `cancelado_por` ENUM(`admin`,`cliente`),
  `confirmado_por`, `fecha`.
- `notificaciones` (admin), `notificaciones_cliente` (FK a `clientes`, cascade),
  `page_views` (`ruta`, `usuario`, `ip`, `user_agent`, `fecha`).
- `permisos_rol` (solo web): `rol`, `permiso`, `permitido` (UNIQUE `rol+permiso`).
  La crea y siembra sola `services/permisosService.js` al arrancar; el admin **no**
  se guarda (siempre tiene todo). Se administra desde `/admin/permisos`.
- `categorias` (solo web): `id` + `nombre` UNIQUE. Se siembra desde `producto.categoria`
  al arrancar. Administrada en `/admin/categorias`.
- `auditoria` (solo web): `usuario`, `rol`, `accion`, `detalle`, `fecha`. La escribe
  `auditoriaService.registrar(...)` (fire-and-forget). Se ve en `/admin/auditoria`.
- `venta.id_apartado` (FK) vincula la venta del POS con el apartado entregado.

**Trampa estructural**: `apartados` guarda el **nombre del cliente como texto** y se
une por `nombre_cliente = c.nombre`. Por eso al renombrar un cliente se actualizan sus
apartados (`usuarioModel.actualizarCliente`) y por eso hay que resolver notificaciones
buscando el cliente **por nombre** (`notificacionClienteModel.buscarClientePorNombre`).

---

## 6. Reglas de negocio críticas

- **Ciclo del apartado**: `pendiente` → (admin confirma) `confirmado` → (POS/entrega)
  `entregado`; puede `cancelar` admin o cliente. Cancelar **siempre devuelve stock**
  (`productoModel.devolverStockProducto`, sube `limite_venta` y pone `estado='activo'`).
- **Huevos**: 1 cubeta = 30 unidades. La cantidad que llega se multiplica ×30 si es
  huevo; el stock se guarda en unidades. La UI muestra cubetas (`Math.floor(x/30)`).
- **Stock online**: al apartar se descuenta `limite_venta` con
  `restarLimiteVenta` (solo si `limite_venta >= cantidad`; `affectedRows===0` = sin stock
  y se revierte el apartado). Si llega a 0 → `estado='inactivo'`.
- **Ofertas**: `calcularPrecioOferta` en el controller; el descuento se "congela" en
  `apartados.precio_aplicado` para que no cambie retroactivamente. `actualizarOferta`
  limita el descuento a `[0, 99.99]` y valida `inicio <= fin`.
- **Expiración**: job cada 60s cancela pendientes con `fecha + 1h < NOW()`, notifica al
  cliente y devuelve stock. El frontend también tiene un countdown que auto-cancela.
- **Roles**: **`tecnico`** (mantenimiento del sitio) gestiona
  productos/stock, precios/ofertas, imágenes de producto y **carrusel**, y destraba
  pedidos; **no** ve clientes, analítica ni reportes. Solo `ROLES_ADMIN`
  (admin/supervisor/promotor) tiene acceso total. El rol `aprendiz` ya **no existe**.
- **Permisos**: el **Administrador** (`ROL_SUPERADMIN`) es el único con acceso total real
  y el único que puede dar/quitar módulos a los demás roles desde `/admin/permisos`.
  Cada ruta del panel se protege con `verificarPermiso('<clave>')` (no con listas de
  roles), incluidos los módulos de usuarios, categorías y auditoría
  (que el admin puede delegar). Los permisos se guardan en `permisos_rol`, se cachean
  en `permisosService` (defaults si la BD no responde) y se aplican al instante al guardar.
  Claves: `productos, ofertas, pedidos, carrusel, clientes, analitica, categorias,
  respaldo, usuarios, auditoria`. `/admin/permisos` (la pantalla de control) sigue
  siendo **exclusiva del admin**. Aunque un rol reciba el permiso `usuarios`, el API
  **no** le deja crear/editar/cambiar contraseña ni activar cuentas de Administrador
  (evita escalado de privilegios).
- **"Más vendidos"** cuenta apartados `confirmado` + `entregado` y **puede incluir
  productos inactivos** (pendiente: filtrar a activos con stock).
- **Analytics** cuentan como venta **solo `entregado`**. CSVs usan separador `;` + BOM
  UTF-8 (para Excel es-CO).

---

## 7. Seguridad

- Contraseñas con **bcrypt** (nunca texto plano ni comparación en SQL).
- SQL siempre **paramétrico** (`?`).
- **CSRF propio**: token por sesión en `res.locals.csrfToken` → `<meta name="csrf-token">`
  → `public/js/csrf.js` parchea `window.fetch` para añadir `x-csrf-token` y
  `credentials:'same-origin'`; ante **403** hace `location.reload()`.
- **Rate-limit**: general 300/15min; `limiteAuth` 5 intentos/15s en login/registro/
  restablecer (mensaje `{ ok:false, tipo:'vacio', mensaje }`).
- Rutas de cliente/admin: `noCache` para que "atrás" del navegador no muestre datos viejos.
- Roles se validan **en servidor** (middlewares) y también dentro de algunos controllers.

---

## 8. Convenciones de código (¡leer antes de escribir!)

- **Comentarios en español, en primera persona**, con bloque banner al inicio del
  archivo explicando *qué* y *por qué*. Toda función nueva lleva su comentario.
- Identificadores en **español sin tildes**, camelCase (JS) / snake_case (SQL):
  `limite_venta`, `obtenerApartadosPorCliente`.
- **Controllers gordos, models flacos**: nada de SQL en controllers ni lógica de negocio
  en models.
- **No mezclar estilos**: si el archivo usa callbacks, usa callbacks; si usa
  async/await (p. ej. `usuarioModel`, `authController`, `clienteApiController`,
  `carruselApiController`), usa async. No reescribir callbacks a promesas de golpe.
- **`return` temprano** en validaciones, con su código HTTP correcto.
- **Ser defensivo**: `try/catch` en async, `console.error` al fallar, nunca tumbar el server.
- Nuevos controladores que mezclen `res.render` + `res.json` → separar en
  `*VistasController` / `*ApiController` en subcarpeta por dominio.
- Al crear funcionalidad: modelo (`?`) → controller → ruta con middleware de rol →
  asegurar CSRF en el frontend → validar/sanear input.
- `node --check` + `require('./app.js')` tras editar; `grep` antes de borrar código.

---

## 9. Frontend (`public/`)

- **Sin bundler**: JS global por `<script>` en el footer, en orden manual
  `csrf.js → toast.js → login.js → <script de la página>`. Sin `defer`.
- `csrf.js` (primero siempre) parchea `fetch`.
- `toast.js` expone `toast(tipo, mensaje)` (`exito|error|advertencia|info`).
  **Ojo**: `admin/mainAdmin.js` tiene su **propio** toast de campana; `login.js`,
  `registro.js` y `olvide.js` usan cajas `#mensaje` (3 mecanismos de mensaje distintos).
- Patrón de fetch repetido: `try/catch` → `respuesta.json()` → `if (ok) toast('exito',…)`
  else `toast('error', …)` → muchas veces `location.reload()` tras un delay.
- `verificarSesion()` = `GET /api/verificar-sesion` → `{ login }`, antes de apartar.
- **Carrito real** (solo `/catalogo`, `productos.js`): `localStorage['carritoMarketplace_v1']`,
  drawer `#carritoDrawer`, badge `#badgeCarritoFijo`; confirmar → `POST /api/apartar-lote`
  `{ items:[{productoId,cantidad}] }`; si no hay sesión abre login y reintenta.
- `main.js` y `productoDetalle.js` usan el flujo **directo** `POST /api/apartar-producto`
  (sin carrito).
- **Login cliente en 3 pasos** (`login.js`, `configurarFormLogin`): `{documento}` →
  `requierePassword` (clave existente) o `necesitaPassword` (crear clave) → `{documento,password}`.
  Staff: `{usuario, password}` directo → `redirect:'/admin'`.
- Roles en vistas: `esRolPanel`/`esRolAdmin` vienen en `res.locals` (definidos en `app.js`)
  y se usan en EJS para mostrar/ocultar secciones. No hay gating por JS.
- Admin: `mainAdmin.js`, `pedidosAdmin.js`, `habilitarProducto.js`, `gestionOfertas.js`, `gestionClientes.js`, `carruselAdmin.js`, `historicos.js` y los módulos delegables `usuariosAdmin.js`, `categoriasAdmin.js`, `auditoriaAdmin.js` y la vista `admin/respaldo.ejs`.
- **Carrusel**: imágenes en `public/img/carrusel/`, se listan dinámicamente
  (`GET /api/carrusel-imagenes`); al subir se prefijan `NNN-` para ordenar.
- **Imágenes de producto**: `public/img/upload/`, asociadas **por nombre normalizado** (si el nombre cambia, se rompe la imagen).

## 10. Deuda técnica conocida (tener cuidado / posibles tareas)

Marcadas en el código:
- `apartadoController.js:115` **FIXME**: el stock se descuenta **después** de crear el
  apartado → race condition con concurrencia (iría `SELECT FOR UPDATE` / transacción).
- `apartadoController.js:290` **FIXME**: en el lote, al revertir por falta de stock no
  se devuelve el stock del último ítem (posible pérdida de stock).
- `apartadoModel.js:163` **FIXME** desactualizado: el modelo dice que falta validar
  propiedad, pero `apartadoController.cancelarApartado` **sí** valida dueño/staff.
- `contadorVisitas.js:37` **TODO**: el `DELETE` de `page_views` corre en cada petición.

Detectadas en la revisión:
- `package.json`: `qrcode` es dependencia **sin uso** (el manual dice que se quitó, pero sigue).
- `main.ejs`: el enlace "¿Olvidaste tu contraseña?" **no funciona** (no carga `olvide.js`
  ni tiene `#modalOlvide`; solo existe en `productos.ejs`).
- **XSS potencial** por `innerHTML` sin escapar en `verApartados.js` y `mainAdmin.js`
  (notificaciones/nombres). `pedidosAdmin.js` y `gestionClientes.js` sí usan `escaparHTML()`.
- Mucho **código duplicado**: modales y tarjetas entre `main.ejs`/`productos.ejs`;
  `verificarSesion`, `escaparHTML`, `mostrarVentanaApartado` duplicados entre JS;
  conversión huevo ×30 repetida en EJS y JS.
- Detección de huevo por nombre hardcodeada (`includes('huevo')`), depende de la
  convención de nombres.
- `.gitignore` ignora `*.sql` pero `database/schema.sql` ya está trackeado (sigue en git).
- `public/img/upload/*` figura en `.gitignore`, pero 16 imágenes están trackeadas (antes
  de la regla). Un clon nuevo sí las trae.

---

## 11. Documentación existente (leer si hace falta más detalle)

- `public/docs/MANUAL_TECNICO.md` — **muy completo** (49 KB): filosofía del autor,
  capas, BD, flujo del apartado, reglas de negocio, seguridad, cómo agregar código,
  problemas comunes. Es la mejor fuente para "cómo se piensa" este repo.
- `public/docs/EXPLICACION_DEL_PROYECTO.txt` — explicación del CSRF y del contenido
  de cada carpeta.
- `README.md` — instalación, tabla de **todos los endpoints**, roles, funcionalidades.
- `database/schema.sql` — comentarios con el reparto de tablas web/POS.

> `ROLES_ADMIN_APRENDIZ.txt` (raíz): aparece como **eliminado** en el working tree
> (trackeado en git, no está en disco). Si el usuario lo borró a propósito, se debe
> commitear el borrado; si fue accidental, recuperar con `git checkout -- ROLES_ADMIN_APRENDIZ.txt`.
> No lo he tocado.

---

## 12. Estado actual de permisos y roles

La matriz vigente se define en `utils/permisos.js`; antes de cambiarla, verificar también `routes/admin.js`, `services/permisosService.js` y las vistas del dashboard.

- **Administrador (`admin`)**: acceso total y único rol que puede consultar/guardar la matriz de permisos. No se puede quitar su acceso.
- **Supervisor y Promotor**: por defecto tienen `productos, ofertas, pedidos, carrusel, clientes, analitica, categorias`. Sus permisos iniciales son iguales; si sus funciones deben diferenciarse, definir primero las responsabilidades de cada cargo.
- **Técnico (`tecnico`)**: por defecto tiene `productos, ofertas, pedidos, carrusel`; no tiene acceso a clientes ni analítica.
- **Usuarios, Auditoría y Respaldo**: no se otorgan por defecto. Respaldo puede incluir datos personales; otorgarlo solo a personal autorizado. La API de usuarios restringe operaciones sensibles sobre cuentas de Administrador.
- **Permisos actuales**: `productos, ofertas, pedidos, carrusel, clientes, analitica, categorias, respaldo, usuarios, auditoria`. Configuración, Contenido y Banners ya no forman parte de la matriz ni del panel.
- Las rutas y APIs se protegen en servidor con `verificarPermiso`; no confiar solo en ocultar tarjetas del dashboard.

No se han definido módulos adicionales. Posibles divisiones futuras si el flujo lo requiere: separar catálogo de stock dentro de Productos, acciones de Pedidos, y consulta de Analítica de exportación. Mantener Usuarios y Respaldo restringidos al Administrador salvo que exista una necesidad operativa explícita.