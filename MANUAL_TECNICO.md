<div align="center">

# 📘 Manual Técnico — Marketplace SENA

**Centro Agroindustrial Hachón**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-FFFFFF?style=for-the-badge&logo=ejs&logoColor=black)

> **Guía definitiva para entender cómo está construido este proyecto, cómo piensa y escribe código su autor, y cómo se conectan todas las piezas.** Si llegas nuevo, lee esto de corrido y luego navega al código con esta guía en la mano.

---

### Tabla de Contenidos

| # | Sección | Descripción |
|---|---------|-------------|
| 1 | [Qué es este proyecto](#1-qué-es-este-proyecto) | Visión general y actores del sistema |
| 2 | [La forma de programar del autor](#2-la-forma-de-programar-del-autor) | Convenciones, estilo y filosofía de código |
| 3 | [Tecnologías y por qué](#3-tecnologías-y-por-qué) | Stack tecnológico justificado |
| 4 | [Cómo fluye una petición](#4-cómo-fluye-una-petición) | Cadena de middleware de principio a fin |
| 5 | [Estructura del proyecto](#5-estructura-del-proyecto) | Árbol de archivos y su propósito |
| 6 | [Arranque del servidor](#6-arranque-del-servidor) | `server.js` y `app.js` en detalle |
| 7 | [Capa de configuración](#7-capa-de-configuración-config) | `database.js`, `session.js`, `rateLimit.js` |
| 8 | [Capa de base de datos](#8-capa-de-base-de-datos-database) | Conexión y esquema SQL |
| 9 | [Capa de modelos](#9-capa-de-modelos-models) | Consultas SQL puras |
| 10 | [Capa de controladores](#10-capa-de-controladores-controllers) | Lógica de negocio |
| 11 | [Capa de rutas](#11-capa-de-rutas-routes) | URLs y middlewares |
| 12 | [Capa de middleware](#12-capa-de-middleware-middleware) | Guards, CSRF, validación |
| 13 | [Capa de servicios](#13-capa-de-servicios-services) | Jobs en segundo plano |
| 14 | [Capa de utilidades](#14-capa-de-utilidades-utils) | Helpers compartidos |
| 15 | [Frontend](#15-frontend-public) | JS vanilla, EJS, CSS |
| 16 | [Base de datos en detalle](#16-base-de-datos-en-detalle) | Todas las tablas y sus relaciones |
| 17 | [Flujo de negocio principal](#17-flujo-de-negocio-principal-el-apartado) | Ciclo de vida de una reserva |
| 18 | [Reglas de negocio especiales](#18-reglas-de-negocio-especiales) | Huevos, ofertas, stock atómico |
| 19 | [Seguridad implementada](#19-seguridad-implementada) | Capas de protección activas |
| 20 | [Cómo agregar código nuevo](#20-cómo-agregar-código-nuevo-sigue-estas-reglas) | Reglas para contribuir |
| 21 | [Problemas comunes](#21-problemas-comunes-y-cómo-se-resolvieron) | Bugs resueltos y lecciones |

---

</div>

## 1. Qué es este proyecto

Es una **plataforma web de reserva de productos agrícolas y procesados** (marketplace) del **SENA — Centro Agroindustrial Hachón**. El cliente final explora un catálogo, **aparta** (reserva) productos en línea, y después va al punto de venta físico a pagar y reclamar su pedido.

> **💡 La idea central:** el marketplace NO cobra en línea. Solo *reserva*. La venta y el cobro ocurren presencialmente en el **POS** (una aplicación de escritorio separada en Python/Flet que comparte la misma base de datos MySQL).

Esto es clave para entender todo el código: hay **tres actores** y **un ciclo de vida** de pedidos bien definido.

| Actor | Rol | Permisos |
|-------|-----|----------|
| 👤 **Cliente** | Explora el catálogo, aparta productos, cancela sus reservas, edita su perfil. | Acceso a: catálogo, perfil, mis apartados |
| 🔧 **Admin / Aprendiz** | Gestiona el panel: productos, ofertas, pedidos (confirma/entrega/cancela), clientes, estadísticas. | Admin total / Aprendiz con acceso limitado |
| 🖥️ **POS (Python)** | Cobra y factura presencialmente; marca apartados como `entregado`. | Comparte la BD MySQL, no tiene interfaz web |

---

## 2. La forma de programar del autor (lo más importante)

> **⚠️ Antes de tocar una sola línea, léete esto.** Resume **cómo piensa** quien escribe este código, para que tus aportes se sientan "de la casa" y no rompan nada.

### 2.1 Comentarios en español, explicativos y "con voz"

Todos los archivos arrancan con un bloque de comentario tipo banner que dice **qué hace** ese archivo y **por qué**. Los comentarios están escritos en **primera persona** ("acá me conecto", "lo uso para"). Esto no es casualidad: el autor escribe el código para *su yo del futuro* y para que quien lo lea entienda la intención, no solo el qué.

```js
// =============================================
// CONEXIÓN A LA BASE DE DATOS
// =============================================
// Acá me conecto a MySQL usando mysql2.
// ...
```

> **📐 Regla:** todo archivo nuevo y toda función nueva debe tener un comentario de cabecera que explique el *porqué*.

### 2.2 MVC con capas claras, pero pragmático

No existe un framework. Es **Express** con una separación manual por capas:

| Capa | Carpeta | Responsabilidad |
|------|---------|----------------|
| **Modelos** | `models/` | Solo SQL (consultas puras a la BD) |
| **Controladores** | `controllers/` | Lógica de negocio (validan, orquestan modelos, responden) |
| **Rutas** | `routes/` | Definen las URLs y qué middleware/controlador las atiende |
| **Vistas** | `public/views/` | Plantillas EJS |

> **🎯 Punto clave de la filosofía:** los controllers son "gordos" (tienen la lógica de negocio) y los models son "flacos" (solo SQL). No se mete SQL en los controllers ni lógica de negocio en los models.

### 2.3 Un controller = vistas + APIs separadas (convención reciente)

Hay una convención importante que se introdujo a mano: **cada dominio tiene su carpeta con dos archivos**:

```
controllers/
├── sitio/
│   ├── sitioVistasController.js   ← renderiza páginas (res.render)
│   └── sitioApiController.js      ← devuelve JSON (res.json)
├── cliente/
│   ├── clienteVistasController.js
│   └── clienteApiController.js
└── ...
```

Los controladores que son **100% API** (no renderizan vistas) siguen planos en `controllers/`: `authController.js`, `apartadoController.js`, `productoController.js`, `notificacionesController.js`, etc.

> **📐 Regla para el futuro:** si un controlador mezcla `res.render` con `res.json`, sepáralo en `*VistasController` y `*ApiController` dentro de una subcarpeta por dominio.

### 2.4 Callbacks vs Promesas/async

Es un código de **transición**: el autor está migrando de callbacks a `async/await`, pero **no se ha reescrito todo**. Verás ambos estilos conviviendo:

- **Models:** usan **callbacks** (`conexion.query(sql, valores, callback)`) casi todos. La excepción es `usuarioModel.js`, que ya devuelve **Promesas**.
- **Controllers:** los que trabajan con promesas usan `async/await` (`authController`, `clienteApiController`, `carruselApiController`). Los controllers viejos usan callbacks anidados (`apartadoController`).

> **📐 No "arregles" los callbacks de golpe.** Respeta el patrón del archivo donde estás tocando. Si editas un archivo con callbacks, usa callbacks; si es async, usa async.

### 2.5 Body/símbolos de conveniencia en las respuestas

Los responses tienen dos formas, según quién los consume:

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| **Vistas (páginas)** | `res.render('nombreVista', { datos })` | Renderiza EJS con datos |
| **APIs (JS del frontend)** | `res.json({ ok, mensaje, ... })` | `ok: true/false` + `mensaje` con texto |

Algunos endpoints devuelven `{ error }`.

### 2.6 Español consistente en identificadores

Los nombres de variables, funciones y columnas SQL están en español (pero sin tildes): `limite_venta`, `nombre_cliente`, `obtenerApartadosPorCliente`, `cambiarEstado`, `procesarLogin`. Respeta esta convención: **español sin tildes, claramente descriptivo, en camelCase (JS) / snake_case (BD)**.

### 2.7 Código defensivo y tolerante a fallos

El autor valida casi todo y, cuando algo falla, **no tira el servidor**: devuelve un JSON de error con el código HTTP adecuado (400, 401, 403, 404, 500) y registra en consola con `console.error`. Siempre hay `try/catch` alrededor de operaciones asíncronas que pueden fallar (especialmente SQL).

Los guards usan el patrón temprano:

```js
if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Debe iniciar sesión para apartar un producto.' });
}
```

> **📐 Regla:** ante datos inválidos, `return` temprano con su mensaje y código. Nunca dejes que una función siga con datos incompletos.

### 2.8 Seguridad como hábito

| Práctica | Implementación |
|----------|---------------|
| Contraseñas | **bcrypt** — nunca texto plano |
| SQL | **Prepared statements** (`?`) — nunca concatenar input |
| Sesiones | `express-session` con cookie segura |
| CSRF | Middleware propio en cada petición que cambia estado |
| Rate-limit | Contra fuerza bruta en login/registro |
| Cabeceras | **Helmet** para headers seguros |
| Validación | `express-validator` — saneamiento y formato |

> **📐 Nunca se confía en datos del frontend; se validan en el servidor.**

### 2.9 Comentarios "TODO" honestos

Cuando el autor no está seguro o deja algo a medias, lo anota en el código (ej. `usuario.id_cliente ?? usuario.id` con el comentario "uso ?? por si cambia el nombre"). Esto te dice dónde hay decisiones pendientes o supuestos.

### 2.10 El repo es el contrato

- No se suben **secrets** (`.env` está en `.gitignore`).
- El `README.md` describe instalación y endpoints; este manual describe *cómo se piensa*.
- Solo se borra código que está **confirmado muerto** (comprobado con búsquedas). El autor prefiere dejar comentarios claros antes que romper algo.

---

## 3. Tecnologías y por qué

| Componente | Tecnología | Justificación |
|------------|-----------|---------------|
| **Backend** | `Node.js + Express 5` | Sencillo, JS en todo el stack, enorme ecosistema |
| **Base de datos** | `MySQL` (mysql2) | Compartida con el POS (Python/Flet); inventario y clientes sincronizados |
| **Plantillas** | `EJS` | HTML con lógica de servidor incrustada; familiar y directo |
| **Sesiones** | `express-session` | Estado del usuario logueado con cookie |
| **Seguridad** | `helmet`, `express-rate-limit`, `express-validator`, `bcryptjs` | Cabeceras, fuerza bruta, sanitización e hashing |
| **CSRF** | Middleware propio (`middleware/csrf.js`) | Protección contra falsificación de peticiones |
| **Excel** | `exceljs` | Exportación de analytics con gráficos OOXML |
| **Compresión** | `compression` (gzip) | Respuestas más livianas |
| **Env** | `dotenv` | Variables de entorno (`BD_*`, `PORT`, etc.) |
| **Frontend** | `HTML + CSS + JS vanilla` | Sin frameworks; ligero y sin build step |
| **Dev** | `nodemon` | Recarga automática en desarrollo |

> Ver `package.json` para las versiones exactas.

---

## 4. Cómo fluye una petición

Cuando alguien entra al sitio, una petición recorre esta cadena (todo se monta en `app.js`):

```
  🌐 Navegador
     │
     │  GET /catalogo
     ▼
 ┌──────────────────────────────────────────────────────────┐
 │  [1] helmet            → agrega cabeceras de seguridad   │
 │  [2] compression       → gzip de la respuesta            │
 │  [3] express.static    → sirve CSS/JS/imágenes           │
 │  [4] urlencoded/json   → parsea el body (en POST/PATCH)  │
 │  [5] limiteGeneral     → rate-limit 300 req / 15 min     │
 │  [6] session           → carga la sesión (cookie)        │
 │  [7] iniciarCsrf       → genera token CSRF               │
 │  [8] contadorVisitas   → registra la visita              │
 │  [9] verificarCsrf     → valida token (métodos POST+)    │
 │ [10] routes            → matchea URL → controller        │
 │ [11] vistas/api        → responde (EJS o JSON)           │
 └──────────────────────────────────────────────────────────┘
```

### Los dos "modos" de responder

| Modo | Método | Consumidor |
|------|--------|------------|
| **Página (HTML)** | `res.render('catalogo', {...})` | El navegador pinta la plantilla EJS |
| **API (JSON)** | `res.json({...})` | El JS del frontend hace `fetch` y actualiza dinámicamente |

> Muchas pantallas (pedidos, clientes, históricos) cargan el **esqueleto** como página EJS y luego llenan las tablas/gráficas con `fetch` a endpoints `/api/...`.

---

## 5. Estructura del proyecto

```
Marketplace/
├── server.js                        # Punto de entrada (app + job de expiración + puerto)
├── app.js                           # Construye la app Express (middlewares + rutas)
├── package.json                     # Dependencias y scripts
├── .env                             # Variables de entorno (NO se sube a git)
├── .gitignore                       # Ignora node_modules y .env
│
├── config/                          # ─── Configuración ───
│   ├── database.js                  #   Opciones de conexión MySQL (desde .env)
│   ├── session.js                   #   Opciones de express-session
│   └── rateLimit.js                 #   Límites de peticiones (general + auth)
│
├── database/                        # ─── Base de datos ───
│   ├── conexion.js                  #   Crea la conexión MySQL
│   └── schema.sql                   #   Scripts DDL (tablas web + POS)
│
├── models/                          # ─── CAPA: SOLO SQL ───
│   ├── productoModel.js             #   Productos (catálogo, stock, ofertas)
│   ├── apartadoModel.js             #   Apartados/pedidos (ciclo de vida)
│   ├── usuarioModel.js              #   Clientes y usuarios (login, perfil, admin)
│   ├── notificacionModel.js         #   Notificaciones de la campana del admin
│   ├── notificacionClienteModel.js  #   Notificaciones de cada cliente
│   └── historicosModel.js           #   Estadísticas del dashboard
│
├── controllers/                     # ─── CAPA: lógica de negocio ───
│   ├── sitio/                       #   Dominio público
│   │   ├── sitioVistasController.js
│   │   └── sitioApiController.js
│   ├── cliente/                     #   Dominio cliente
│   │   ├── clienteVistasController.js
│   │   └── clienteApiController.js
│   ├── admin/                       #   Dominio admin
│   │   ├── adminVistasController.js
│   │   └── adminApiController.js
│   ├── historicos/                  #   Estadísticas (solo admin)
│   │   ├── historicosVistasController.js
│   │   └── historicosApiController.js
│   ├── carrusel/                    #   Gestión de imágenes portada
│   │   ├── carruselVistasController.js
│   │   └── carruselApiController.js
│   ├── authController.js            #   Login, logout, registro, sesión
│   ├── productoController.js        #   APIs de productos (catálogo y admin)
│   ├── apartadoController.js        #   Ciclo del apartado/pedido
│   ├── notificacionesController.js  #   Campana del admin
│   ├── notificacionesClienteController.js
│   └── reportesController.js        #   Exportar CSV
│
├── routes/                          # ─── Define URLs → controllers ───
│   ├── index.js                     #   Une los routers
│   ├── publico.js                   #   Rutas públicas
│   ├── cliente.js                   #   Rutas de cliente logueado
│   └── admin.js                     #   Rutas del panel admin
│
├── middleware/                      # ─── Funciones pre-controller ───
│   ├── verificarUsuario.js          #   Exige sesión (protegerRuta)
│   ├── verificarAdmin.js            #   Exige rol admin/aprendiz
│   ├── verificarRol.js              #   Exige un rol específico (factory)
│   ├── csrf.js                      #   Genera y valida token CSRF
│   ├── validar.js                   #   Validación con express-validator
│   └── contadorVisitas.js           #   Registra tráfico
│
├── services/                        # ─── Lógica en segundo plano ───
│   └── expirarApartados.js          #   Job que caduca apartados tras 1 h
│
├── utils/                           # ─── Helpers compartidos ───
│   ├── helpers.js                   #   normalizarCategorias, calcularPrecioOferta
│   └── imagenes.js                  #   Asociación producto ↔ imagen
│
├── public/                          # ─── Todo lo que se sirve al navegador ───
│   ├── views/                       #   Plantillas EJS
│   │   ├── main.ejs                 #   Página principal
│   │   ├── productos.ejs            #   Catálogo
│   │   ├── productoDetalle.ejs      #   Ficha de producto
│   │   ├── verApartados.ejs         #   "Mis apartados" del cliente
│   │   ├── perfil.ejs               #   Perfil del cliente
│   │   ├── error.ejs                #   Página de error 404/500
│   │   └── admin/                   #   Vistas del panel
│   ├── js/                          #   JS del navegador (vanilla)
│   │   ├── csrf.js                  #   Wrapper de fetch con token CSRF
│   │   ├── main.js                  #   Lógica de la portada
│   │   ├── productos.js             #   Lógica del catálogo / carrito
│   │   ├── login.js                 #   Flujo multi-paso de login
│   │   ├── registro.js, perfil.js, verApartados.js, ...
│   │   └── admin/                   #   Scripts del panel
│   ├── css/                         #   Estilos
│   └── img/                         #   Imágenes
│       ├── upload/                  #   Fotos de productos
│       └── carrusel/                #   Imágenes del carrusel de portada
│
└── README.md / MANUAL_TECNICO.md    # Documentación
```

---

## 6. Arranque del servidor

### `server.js` (entrada)

| Paso | Acción |
|------|--------|
| 1 | `console.clear()` |
| 2 | Carga `dotenv` (variables de entorno) |
| 3 | Importa `app` (que construye toda la app Express) |
| 4 | Arranca `expirarApartados.iniciar()` (job en segundo plano) |
| 5 | `app.listen(PORT)` (puerto del `.env` o 3000) |
| 6 | Registra manejadores de errores no capturados (`uncaughtException`, `unhandledRejection`) y cierre limpio (Ctrl+C / SIGTERM) |

### `app.js` (construcción)

Monta, **en este orden exacto** (el orden importa):

```
  ┌─ Seguridad ──────────────────────────────┐
  │  helmet                                    │
  │  compression                               │
  │  express.static('public')                  │
  └────────────────────────────────────────────┘
  ┌─ Motor de plantillas ────────────────────┐
  │  EJS con vistas en public/views           │
  └────────────────────────────────────────────┘
  ┌─ Parsing ────────────────────────────────┐
  │  express.urlencoded (límite 4mb)          │
  │  express.json (límite 4mb)                │
  └────────────────────────────────────────────┘
  ┌─ Limitadores ───────────────────────────┐
  │  limiteGeneral (rate-limit global)        │
  │  session                                  │
  │  iniciarCsrf                              │
  └────────────────────────────────────────────┘
  ┌─ Tracking ──────────────────────────────┐
  │  contadorVisitas                          │
  │  verificarCsrf                            │
  └────────────────────────────────────────────┘
  ┌─ Rutas ─────────────────────────────────┐
  │  routes                                   │
  │  Middleware 404 (JSON si es /api/)        │
  │  Middleware de errores (429/500)          │
  └────────────────────────────────────────────┘
```

---

## 7. Capa de configuración (`config/`)

### `database.js`

Devuelve un objeto con las opciones de conexión. Usa prefijo `BD_*` (con fallback a `DB_*` por compatibilidad).

| Variable | Descripción |
|----------|------------|
| `BD_HOST` | Host de MySQL |
| `BD_USER` | Usuario de MySQL |
| `BD_PASSWORD` | Contraseña de MySQL |
| `BD_DATABASE` | Nombre de la base de datos |
| `BD_PORT` | Puerto de MySQL |

> **Nota:** incluye `connectTimeout: 1000` para no quedar colgado si la BD no responde.

### `session.js`

| Opción | Valor |
|--------|-------|
| `secret` | Desde `SESSION_SECRET` (fallback a una cadena) |
| `cookie.maxAge` | 1 hora |
| `secure` | `true` solo en producción (HTTPS) |
| `httpOnly` | `true` |
| `sameSite` | `'lax'` |

### `rateLimit.js`

| Limite | Configuración | Aplicación |
|--------|--------------|------------|
| `limiteGeneral` | 300 req / IP / 15 min | Toda la app |
| `limiteAuth` | 5 intentos / IP / 15 seg | Login/registro |

> El rate-limit de auth devuelve `{ ok, tipo: 'vacio', mensaje: 'Demasiados intentos...' }` para que el frontend lo muestre bien. Desactiva la validación del header `X-Forwarded-For` para que no falle en desarrollo sin proxy.

---

## 8. Capa de base de datos (`database/`)

### `conexion.js`

Crea una conexión MySQL única (`mysql2.createConnection`) con las opciones de `config/database.js`, prueba la conexión al arrancar y exporta la conexión. **Todos los modelos la importan.** Es una sola conexión compartida.

### `schema.sql`

Script **integrado** con `CREATE TABLE IF NOT EXISTS`: crea tablas de la web y del POS juntas (porque comparten BD). Incluye:

- Usuario por defecto: `admin` / `admin123` (con hash bcrypt)
- Cliente por defecto: "Cliente General"
- Todas las tablas detalladas en la [sección 16](#16-base-de-datos-en-detalle)

---

## 9. Capa de modelos (`models/`)

Cada modelo importa `conexion` y exporta un objeto con métodos. Los métodos reciben parámetros y un **callback** `(error, resultados)`, salvo `usuarioModel` que devuelve **Promesas**.

### `productoModel.js`

| Método | Descripción |
|--------|------------|
| `obtenerTodos` | Todos, menos `COMODIN` y precio 0 |
| `obtenerDestacados` | Los 4 "más vendidos" (por apartados `confirmado`/`entregado`) — **no filtra por estado** |
| `obtenerPorId` | Búsqueda por ID |
| `obtenerConOfertas` | Descuento vigente por fechas |
| `actualizarOferta` | Actualiza descuento y fechas |
| `actualizarLimiteVenta` | Cambia el cupo para la web |
| `actualizarEstado` | Activa/desactiva |
| `actualizarPrecio` | Cambia el precio base |
| `restarLimiteVenta` | Descuento **atómico** (ver sección 18) |
| `devolverStockProducto` | Suma stock al cancelar |
| `crearProducto` | Inserta nuevo producto |
| `actualizarDatosProducto` | Edita datos existente |

### `apartadoModel.js` — el corazón

| Método | Descripción |
|--------|------------|
| `crearApartado` | Inserta nueva reserva |
| `obtenerApartadosPorCliente` | Por nombre del cliente |
| `obtenerApartadoPorId` | Búsqueda por ID |
| `obtenerTodosApartados(estado)` | Acepta filtros: `pendiente`, `confirmado`, `entregado`, `cancelado`, `activos`, `historial`, `todos` |
| `confirmarApartado` | Cambia a `confirmado` |
| `marcarEntregado` | Cambia a `entregado` |
| `cancelarApartadoAdmin` | Cancela desde el admin |
| `cancelarApartadoCliente` | Cancela desde el cliente |
| `obtenerApartadosExpirados` | Más de 1 hora pendiente |
| `cancelarApartadoPorExpiracion` | Cancelación automática |

### `usuarioModel.js` (Promesas/async)

| Método | Descripción |
|--------|------------|
| `login(documento)` | Busca cliente por documento (incluye password) |
| `loginPorUsuario(usuario)` | Busca admin/aprendiz |
| `crearPassword(idCliente, hash)` | Guarda password hasheada |
| `existeDocumento(documento)` | Verifica duplicado |
| `registrar(datos)` | Inserta nuevo cliente |
| `obtenerClientePorId` | Datos del perfil |
| `obtenerClienteConPasswordPorId` | Con password para comparar |
| `actualizarCliente` | Actualiza perfil (sincroniza nombre en apartados) |
| `obtenerClientesAdmin(busqueda)` | Con conteo de pedidos/compras |

### `notificacionModel.js`

Campana del admin: crear, listar no leídas, contar, marcar leída / todas.

### `notificacionClienteModel.js`

Alertas por cliente: `buscarClientePorNombre` (convierte nombre → `id_cliente`), crear, listar, contar, marcar.

### `historicosModel.js`

| Método | Descripción |
|--------|------------|
| `productosMasVendidos` | Ranking de productos |
| `clientesQueMasCompran` | Ranking de clientes |
| `pedidosPorEstado` | Distribución de estados |
| `ventasPorDia` | Tendencia de ventas |
| `visitasPorDia` | Tráfico diario |
| `visitasPorRuta` | Páginas más visitadas |
| `resumen` | Métricas generales |

> **Nota:** casi todas cuentan solo `estado = 'entregado'` (ventas reales ya pagadas).

---

## 10. Capa de controladores (`controllers/`)

### Estructura (repaso)

Subcarpetas por dominio con `*Vistas` y `*Api` para los que mezclan; controllers planos para los 100% API.

### `authController.js`

Soporta **dos tipos** de login:

| Tipo | Flujo | Respuesta |
|------|-------|-----------|
| **Admin/Aprendiz** | `usuario + password` → bcrypt → determina rol → redirige `/admin` | Redirect |
| **Cliente** | `documento` → flujo multi-paso con `tipo` | JSON con tipo |

Flujo multi-paso del cliente:
1. Solo documento → si no tiene password: `necesitaPassword`; si tiene: `requierePassword`
2. Crea password (`nuevaPassword`)
3. Documento + password → compara con bcrypt y guarda sesión

| Método | Descripción |
|--------|------------|
| `logoutUsuarioController` | Destruye sesión y limpia cookie |
| `verificarSesion` | Si hay sesión: `{login: true}` |
| `restablecerPassword` | Resetea contraseña con documento |
| `registroUsuarioController` | Valida, verifica duplicado, hashea con bcrypt e inserta |

### `apartadoController.js` — la lógica más importante

| Método | Descripción |
|--------|------------|
| `apartarProducto` | Valida sesión/datos, busca producto, detecta huevos (×30), verifica stock, calcula precio oferta, crea apartado, notifica, descuenta stock |
| `apartarLote` | Valida **todos** los ítems primero (no escribe nada hasta validar todo), luego crea uno por uno |
| `confirmarApartado` | Cambia a `confirmado` (rastrea quién confirmó) |
| `marcarEntregado` | Cambia a `entregado` |
| `cancelarApartadoAdmin` | Cancela desde admin |
| `cancelarApartado` | Cancela desde cliente (verifica propiedad) |

> Cada cambio de estado notifica al cliente (vía `notificarClientePorApartado`).

### `productoController.js` (APIs)

Crear/editar productos, subir imagen (base64 → `public/img/upload` con nombre normalizado), listar, cambiar límite/estado/precio, ofertas.

### `reportesController.js`

Exporta CSV (`;` como separador, BOM UTF-8 para tildes): pedidos y clientes.

### `historico/historicosApiController.js`

Devuelve datos de analytics como JSON y `exportarHistoricos` genera un **Excel con gráficos OOXML** (exceljs), con varias hojas y estilos.

### `carrusel/carruselApiController.js`

Sube/elimina imágenes de `public/img/carrusel` con prefijo numérico de orden.

### `sitio/sitioApiController.js`

`carruselImagenes` lee la carpeta del carrusel y devuelve los nombres en JSON.

### Vistas (los `*VistasController`)

| Controlador | Funciones principales |
|-------------|----------------------|
| `sitioVistasController` | `mostrarMain` (destacados, ofertas), `mostrarDetalleProducto` (404 si inactivo), `mostrarCatalogo` (filtros, búsqueda, orden) |
| `adminVistasController` | Todas las pantallas del panel |
| `clienteVistasController` | "Mis apartados" y "Mi perfil" |
| `historicosVistasController` | Página de analytics |
| `carruselVistasController` | Gestión del carrusel |

---

## 11. Capa de rutas (`routes/`)

| Archivo | Monta | Protección |
|---------|-------|-----------|
| `index.js` | Une `publico`, `cliente` y `admin` | — |
| `publico.js` | Raíz, catálogo, detalle, login/logout/registro + APIs públicas | `limiteAuth` + `validarLogin`/`validarRegistro` |
| `cliente.js` | Perfil, mis apartados, apartar, cancelar, notificaciones | `protegerRuta` |
| `admin.js` | Páneas del panel + todas las APIs de admin | `verificarAdmin` o `verificarRol('admin')` |

### Detalle de roles en rutas

| Middleware | Permite | Excluye |
|------------|---------|---------|
| `verificarAdmin` | admin **o** aprendiz | — |
| `verificarRol('admin')` | **solo** admin | Aprendiz (no gestiona clientes, analytics, carrusel, reportes) |

> **⚠️ Nota de orden en Express:** en `admin.js`, la ruta de precio (`/ofertas/precio/:id`) se declara **antes** que la genérica (`/ofertas/:id`) para que Express la matchee primero.

---

## 12. Capa de middleware (`middleware/`)

| Middleware | Archivo | Descripción |
|------------|---------|-------------|
| `protegerRuta` | `verificarUsuario.js` | Sin sesión → 401 JSON (AJAX) o redirige `/` (página) |
| `verificarAdmin` | `verificarAdmin.js` | Sin sesión o rol → 401/403 JSON o redirección |
| `verificarRol(rol)` | `verificarRol.js` | **Factory** que devuelve middleware para roles concretos. Detecta API por `req.xhr`, ruta `/api/` o header `accept` |
| `iniciarCsrf` | `csrf.js` | Expone token a vistas (`res.locals.csrfToken`) |
| `verificarCsrf` | `csrf.js` | Exige token (cabecera `x-csrf-token` o campo `_csrf`) en POST/PUT/PATCH/DELETE. Si no → 403 JSON |
| `validarLogin/Registro` | `validar.js` | Reglas de `express-validator`. Errores en formato `{ ok, tipo, mensaje }` |
| `contadorVisitas` | `contadorVisitas.js` | Inserta en `page_views` (solo GET, no admin, no `/api/`, no archivos con `.`). Limpia registros > 30 días |

---

## 13. Capa de servicios (`services/`)

### `expirarApartados.js`

Job que se ejecuta cada 60 segundos:

```
  ┌─────────────────────────────────────────────────┐
  │  Cada 60 segundos                               │
  │                                                  │
  │  1. Busca apartados 'pendiente' con > 1 hora     │
  │     DATE_ADD(fecha, INTERVAL 1 HOUR) < NOW()     │
  │                                                  │
  │  2. Los marca 'cancelado' / 'admin'              │
  │                                                  │
  │  3. Notifica al cliente (nombre → id)            │
  │                                                  │
  │  4. Devuelve el stock al producto                │
  └─────────────────────────────────────────────────┘
```

> **Nota de consistencia:** la columna `estado` fue renombrada en historicosModel. Este es el tipo de cosas que conviene mantener actualizadas.

---

## 14. Capa de utilidades (`utils/`)

### `helpers.js`

| Función | Descripción |
|---------|------------|
| `normalizarCategorias(valor)` | Convierte parámetro (string o array) a array limpio |
| `calcularPrecioOferta(producto)` | Aplica descuento solo si está vigente (fechas). Devuelve `{ precioOriginal, precioFinal, descuento, enOferta }`. Si no hay vigencia o descuento >= 100, no aplica |

### `imagenes.js`

| Función | Descripción |
|---------|------------|
| `normalizeText(texto)` | Quita tildes/caracteres especiales/minúsculas |
| `asociarImagenesAProductos(productos, cb)` | Lee `public/img/upload/`, arma diccionario nombre-normalizado → archivo, agrega `imagenUpload` a cada producto |

> **📐 Regla de imágenes:** la foto se guarda con el **nombre normalizado del producto** (ej. `PLATANO HARTON 1A KG.jpg`). La asociación es por coincidencia de nombre, sin tabla intermedia. Si renombras un producto, su imagen ya no coincide → hay que renombrarla o se pierde.

---

## 15. Frontend (`public/`)

**Enfoque:** JS vanilla, sin frameworks, cada página tiene su script. Usan `fetch` con `credentials: 'same-origin'` (para mandar la cookie de sesión).

### `js/csrf.js` — importante

Wrapper global de `fetch`: lee el token del `<meta name="csrf-token">` y lo agrega como cabecera `x-csrf-token` a **todos** los fetch. Así ningún fetch del sitio necesita acordarse del CSRF.

> **🔧 Solución a bug clásico:** si recibe `403` con JSON de error (token CSRF inválido por sesión expirada), **recarga la página automáticamente** para regenerar la sesión y el token. Esto resolvió el bug de "funciona al inicio pero deja de funcionar con el tiempo".

### `js/login.js`

| Función | Descripción |
|---------|------------|
| `procesarLogin(payload)` | POST a `/login`, muestra `mensaje` con color según `tipo` |
| `configurarFormLogin(formulario, opciones)` | Maneja flujo **multi-paso** del cliente (documento → clave → sesión) |

Los colores de mensaje:
| Tipo | Color |
|------|-------|
| `vacio` / `naranja` | Naranja |
| `exito` | Verde |
| Otros | Rojo |

### `js/main.js` (portada)

- Carga el carrusel (`/api/carrusel-imagenes`) y lo anima
- Configura los botones "Apartar" (abren el modal `modalApartarProducto`)
- **Cambio reciente:** al hacer clic en **cualquier parte** de la tarjeta de "Más Vendidos" se abre el modal de apartar en lugar de navegar a `/producto/:id`
- Maneja el modal de login y el formulario de apartado

### `js/productos.js` (catálogo)

Lógica del catálogo con carrito y **apartado en lote** (`/api/apartar-lote`).

### Vistas EJS

| Vista | Contenido |
|-------|----------|
| `main.ejs` | Portada: carrusel, tarjetas "Más Vendidos" (con lógica de huevos), ofertas, modales |
| `productos.ejs` | Catálogo con filtros |
| `productoDetalle.ejs` | Ficha de producto (devuelve 404 si inactivo) |
| `verApartados.ejs` | Apartados del cliente |
| `perfil.ejs` | Perfil del cliente |
| `error.ejs` | Página de error 404/500 |
| `admin/*` | Vistas del panel administrativo |

> **Nota:** la vista `productoDetalle.ejs` y su ruta (`/producto/:id`) siguen existiendo, pero el flujo principal de la portada ya no navega ahí (abre el modal).

---

## 16. Base de datos en detalle

### Tablas principales de la web

#### `clientes`

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id_cliente` | INT PK | Identificador único |
| `nombre` | VARCHAR | Nombre completo |
| `documento` | VARCHAR | Número de documento |
| `direccion` | VARCHAR | Dirección |
| `telefono` | VARCHAR | Teléfono |
| `rol` | VARCHAR | Rol del usuario |
| `password` | VARCHAR | Hash bcrypt (puede ser NULL si nunca creó contraseña) |

#### `usuarios` (admin/aprendiz)

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id_usuario` | INT PK | Identificador único |
| `nombre` | VARCHAR | Nombre |
| `usuario` | VARCHAR | Usuario para login |
| `password` | VARCHAR | Hash bcrypt |
| `rol` | VARCHAR | `admin` o `aprendiz` |

> **Usuario por defecto:** `admin` / `admin123`

#### `producto` (catálogo compartido con el POS)

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id_producto` | INT PK | Identificador único |
| `codigo` | VARCHAR | Código del producto |
| `nombre` | VARCHAR | Nombre del producto |
| `unidad` | VARCHAR | Unidad de medida |
| `lugar` | VARCHAR | Ubicación |
| `precio` | DECIMAL | Precio base |
| `categoria` | VARCHAR | Categoría |
| `stock` | INT | Inventario físico total |
| `limite_venta` | INT | Unidades para venta en línea (0 = no disponible online) |
| `estado` | VARCHAR | `activo` / `inactivo` |
| `descripcion` | TEXT | Descripción |
| `descuento` | DECIMAL | Porcentaje de descuento |
| `fecha_inicio_oferta` | DATE | Inicio de vigencia |
| `fecha_fin_oferta` | DATE | Fin de vigencia |

> **Importante:** `stock` es el inventario físico total; `limite_venta` es el cupo para la web. Las columnas de oferta: `descuento` + fechas de vigencia (NULL = indefinido).

#### `apartados` (reservas — tabla solo web)

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id_apartado` | INT PK | Identificador único |
| `nombre_cliente` | VARCHAR | Nombre del cliente (texto, no FK) |
| `producto` | VARCHAR | Nombre del producto |
| `cantidad` | INT | Cantidad apartada |
| `precio_aplicado` | DECIMAL | Precio capturado al apartar (inmutable) |
| `estado` | ENUM | `pendiente` → `confirmado` → `entregado` / `cancelado` |
| `cancelado_por` | VARCHAR | Quién canceló |
| `confirmado_por` | VARCHAR | Quién confirmó |
| `fecha` | DATETIME | Fecha de creación |

> **Diseño clave:** guarda el **nombre del cliente como texto** (no un id). Por eso las notificaciones/usuario convierten nombre → id con `buscarClientePorNombre`.

#### `notificaciones` (campana admin)

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id` | INT PK | Identificador único |
| `titulo` | VARCHAR | Título de la notificación |
| `mensaje` | TEXT | Contenido |
| `fecha` | DATETIME | Fecha de creación |
| `leido` | BOOLEAN | Si fue leída |

#### `notificaciones_cliente`

| Columna | Tipo | Descripción |
|---------|------|------------|
| `id` | INT PK | Identificador único |
| `id_cliente` | INT FK | Referencia al cliente |
| `titulo` | VARCHAR | Título |
| `mensaje` | TEXT | Contenido |
| `fecha` | DATETIME | Fecha de creación |
| `leido` | BOOLEAN | Si fue leída |

#### `page_views`

| Columna | Tipo | Descripción |
|---------|------|------------|
| `ruta` | VARCHAR | URL visitada |
| `usuario` | VARCHAR | Usuario (si está logueado) |
| `ip` | VARCHAR | Dirección IP |
| `user_agent` | VARCHAR | Navegador |
| `fecha` | DATETIME | Fecha de la visita |

### Tablas del POS (comparten BD, la web no las usa directamente)

`venta`, `detalle_venta`, `compras`, `detalle_compras`, `proveedores`, `entradas`, `detalle_entradas`, `remision`, `detalle_remision`.

> **Vinculación web ↔ POS:** `venta.id_apartado` vincula la venta presencial con el apartado entregado (FK). Cuando el POS vende un apartado, marca el apartado como `entregado` y la venta apunta al `id_apartado`. El descuento que hace la web al apartar no se repite en el POS.

---

## 17. Flujo de negocio principal (el apartado)

```
  👤 Cliente explora catálogo
        │
        ▼
  ┌─────────────────────┐
  │  Clic en "Apartar"  │
  │  (o en toda la      │
  │   tarjeta)          │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Se abre modal      │──→ ¿No está logueado? ──→ Se abre login
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────────────────────────────────────┐
  │  POST /api/apartar-producto                         │
  │  (apartadoController.apartarProducto)                │
  │                                                      │
  │  ├─ Valida sesión, producto, estado activo y stock   │
  │  ├─ Detecta huevos (×30) ← manejo especial           │
  │  ├─ Calcula precio de oferta capturado                │
  │  ├─ Crea el apartado (estado = pendiente)             │
  │  ├─ Notifica al admin (campana) y al cliente          │
  │  └─ Descuenta limite_venta (restarLimiteVenta)        │
  └─────────┬─────────────────────────────────────────────┘
            │
            ▼
  ┌──────────────────────────────────────────┐
  │  Admin recibe notificación               │
  │  → panel de pedidos                      │
  │                                          │
  │  ├─ CONFIRMA → estado = confirmado       │
  │  ├─ ENTREGA  → estado = entregado        │
  │  └─ CANCELA  → estado = cancelado        │
  │                   + devuelve stock        │
  └──────────────────────────────────────────┘

  ⏰ Job de expiración (cada 60s):
     si sigue 'pendiente' tras 1h → cancelado + devuelve stock
```

> **📌 El stock se descuenta al apartar**, se devuelve al cancelar, y no se toca al entregar.

---

## 18. Reglas de negocio especiales

### 18.1 Manejo de huevos (1 cubeta = 30 unidades)

| Concepto | Implementación |
|----------|---------------|
| Detección | Bandera `es_huevo` o nombre que contenga "huevo" |
| Configuración | Admin configura `limite_venta` **en unidades** |
| Selección del cliente | Elige **cubetas**; el sistema multiplica por 30 para el stock |
| Stock visible | `Math.floor(limite_venta / 30)` cubetas |
| Precio | Precio unitario × 30 |

### 18.2 Descuento atómico del stock (`restarLimiteVenta`)

El UPDATE ajusta `estado` y `limite_venta` a la vez, evaluando `limite_venta - cantidad > 0`. **El estado va ANTES en el SET** (MySQL evalúa de izquierda a derecha) para que el `CASE` vea el valor ya restado y marque `inactivo` solo si llega a 0; si queda stock, `activo`.

> Hay un comentario detallado en el código explicando por qué el orden importa.

### 18.3 Ofertas con precio capturado

| Momento | Acción |
|---------|--------|
| Configuración | Admin configura `descuento` (%) y fechas opcionales |
| Al apartar | Se guarda `precio_aplicado` = precio ya descontado |
| Después | Si la oferta cambia, los apartados viejos conservan su total |

### 18.4 "Más vendidos" puede incluir inactivos

`obtenerDestacados` no filtra por estado. Esto provocó un bug: dar clic en una tarjeta de un plátano inactivo llevaba a `/producto/:id` que devolvía **404**.

> **Solución:** la tarjeta ahora abre el **modal de apartar** en lugar de navegar.
>
> **💡 Pendiente/idea:** filtrar destacados por `estado='activo'` y/o `limite_venta > 0` para no mostrar productos no comprables.

### 18.5 Carrito en lote

`apartarLote` valida **todos** los ítems antes de escribir nada; si alguno falla, no se crea ningún apartado.

### 18.6 Restricciones por rol

| Rol | Permisos |
|-----|----------|
| **Admin** | Todo: productos, ofertas, pedidos, clientes, analytics, carrusel, reportes |
| **Aprendiz** | Productos, ofertas, pedidos (NO clientes, analytics, carrusel, reportes) |

---

## 19. Seguridad implementada

| Mecanismo | Ubicación | Detalle |
|-----------|-----------|---------|
| **Helmet** | `app.js` | Cabeceras seguras + CSP (self, CDN jsdelivr, fonts) |
| **Rate-limit general** | `app.js` | 300 req/15min por IP |
| **Rate-limit auth** | `routes/publico.js` | 5 intentos/15s en login/registro |
| **Sesión** | `app.js` + `config/session.js` | Cookie httpOnly, sameSite lax, secure en prod, 1 h |
| **CSRF** | `app.js` + `middleware/csrf.js` | Token por sesión en peticiones que cambian estado |
| **bcrypt** | `authController`, `clienteApiController` | Passwords siempre hasheadas (10 rounds) |
| **Prepared statements** | Todos los models | `?` + parámetros, nunca concatenar input |
| **express-validator** | `middleware/validar.js` | Trim, escape, longitud y formato del documento |
| **Rol en cada handler** | controllers | Verificación de sesión y rol en cada action sensible |
| **Traversal de rutas** | `carruselApiController`, `subirImagen` | `path.basename(nombre) === nombre` bloquea `../` |
| **Límite de imagen** | carrusel/producto | 3 MB / formato validado (base64 regex) |

### Caso especial: CSRF + Sesión

> El token CSRF vive dentro de la sesión. Como la sesión expira en 1 hora, si una página queda abierta más de 1 hora el token del `<meta>` queda viejo. La solución es que `public/js/csrf.js` detecta el 403 y recarga la página automáticamente.

---

## 20. Cómo agregar código nuevo (sigue estas reglas)

### Si vas a crear una nueva funcionalidad:

| Paso | Acción |
|------|--------|
| **1** | Piensa en qué dominio encaja (público, cliente, admin, carrusel, históricos, ...) |
| **2** | Crea el modelo en `models/` con la consulta SQL (`?` paramétrico) y un comentario de cabecera |
| **3** | Crea el controlador con la lógica de negocio |
| **4** | Registra la ruta en `routes/` con el middleware de autenticación/rol adecuado |
| **5** | Si cambia estado (POST/PATCH/DELETE) asegúrate de que el frontend mande el token CSRF |
| **6** | Valida y sanea los inputs (`middleware/validar.js` o en el controller) |

### Reglas de estilo (resumen rápido):

- Comentarios en español, primera persona, explicando el *porqué*
- Identificadores en español sin tildes
- `return` temprano en validaciones
- No mezcles estilos callback/async dentro de un archivo
- Actualiza `README.md` y este manual si cambias endpoints o estructura
- Ejecuta `node --check <archivo>` después de editar JS y, si tocas la app, `node -e "require('./app.js')"` para validar que cargue

---

## 21. Problemas comunes y cómo se resolvieron

### 21.1 "Al inicio funciona, luego el login sale cuadro rojo"

| | |
|--|--|
| **Causa** | El token CSRF se guarda en la sesión (expira en 1 h). Al expirar con la página abierta, el token del `<meta>` quedó viejo → `verificarCsrf` devolvía 403 → el frontend mostraba un cuadro rojo vacío |
| **Solución** | `public/js/csrf.js` ahora detecta el 403 y recarga la página; `login.js` muestra un mensaje claro ante respuestas `{ error }` |

### 21.2 "Dar clic en una tarjeta de 'Más Vendidos' lleva a 404"

| | |
|--|--|
| **Causa** | Los destacados pueden ser productos **inactivos**, y la vista de detalle devuelve 404 si el producto no está activo |
| **Solución** | La tarjeta ahora abre el **modal de apartar** en lugar de navegar |
| **Pendiente** | Filtrar destacados a activos con stock |

### 21.3 Imágenes de producto rotas / no aparecen

| | |
|--|--|
| **Causa** | La asociación es por **nombre normalizado**. Si el nombre del producto cambió, o el archivo en `public/img/upload/` no coincide, `imagenUpload` es null y se muestra placeholder |
| **Solución** | Guardar/reclasificar la imagen con el nombre normalizado exacto del producto |

### 21.4 Eliminar código muerto con seguridad

Se eliminó (verificado por búsqueda) código que **no se usaba**: variable `nombreOriginal`, `global.__basedir`, la dependencia `qrcode` (sin requires), un comentario desactualizado, y 4 imágenes huérfanas.

> **📐 Regla:** antes de borrar, confirma con `grep`/`Select-String` que nada lo referencie y que la app siga cargando (`node --check` + `require('./app.js')`).

### 21.5 Rate-limit bloqueando el login

Si haces 5 intentos en 15 segundos, el rate-limit devuelve "Demasiados intentos". Espera unos segundos y reintenta. (No es un bug; es protección anti fuerza bruta.)

---

<div align="center">

---

*Fin del manual. Este documento debe mantenerse al día: si cambias estructura, dependencias o flujos, actualízalo.*

![Marketplace SENA](https://img.shields.io/badge/Marketplace-SENA-2E7D32?style=for-the-badge)

</div>
