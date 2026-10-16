# 🛒 Marketplace

**Tu catálogo en línea con reserva de productos y pago en tienda.**

Olvídate de perder ventas por falta de stock o de llevar pedidos a mano. **Marketplace** es una plataforma web lista para producción donde tus clientes exploran el catálogo, **apartan** (reservan) productos en segundos y pasan al punto de venta a pagar y reclamar su pedido. Tú administras todo desde un panel con estadísticas, ofertas y control de inventario **en tiempo real**.

> 💡 **Ideal para:** tiendas de barrio, distribuidoras, fruvers, agroindustria y cualquier negocio que quiera vender en línea hoy y cobrar en tienda.

[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-v8%2B-4479A1?logo=mysql&logoColor=white)](https://dev.mysql.com/downloads/mysql/)
[![EJS](https://img.shields.io/badge/EJS-templates-B4CA65?logo=ejs&logoColor=black)](https://ejs.co/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contribuir)

---

## 📑 Tabla de contenidos

- [✨ ¿Por qué elegir Marketplace?](#-por-qué-elegir-marketplace)
- [🚀 Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [📦 Requisitos previos](#-requisitos-previos)
- [⚙️ Instalación](#️-instalación)
- [🗄️ Configuración de la base de datos](#️-configuración-de-la-base-de-datos)
- [🚀 Ejecutar el servidor](#-ejecutar-el-servidor)
- [📂 Estructura del proyecto](#-estructura-del-proyecto)
- [🔌 Endpoints API](#-endpoints-api)
- [🔗 Integración con el punto de venta](#-integración-con-el-punto-de-venta)
- [👤 Roles de usuario](#-roles-de-usuario)
- [💡 Funcionalidades](#-funcionalidades)
- [🤝 Contribuir](#-contribuir)
- [📜 Licencia](#-licencia)

---

## ✨ ¿Por qué elegir Marketplace?

- ⚡ **Monta y vende:** Node.js + Express + MySQL, sin frameworks pesados ni configuración compleja.
- 📉 **Cero sobreventas:** el stock se descuenta solo al apartar y se libera automáticamente si el pedido expira.
- 🧾 **Panel de administración completo:** productos, ofertas, pedidos, clientes y estadísticas en un solo lugar.
- 📊 **Decisiones con datos:** ranking de productos más vendidos, mejores clientes, ventas por día y tráfico del sitio.
- 🔗 **Conectado a tu punto de venta:** comparte la misma base de datos para sincronizar inventario y clientes entre el canal web y la tienda.
- 📱 **Responsive y rápido:** funciona igual de bien en escritorio y en el celular del cliente.

---

## 🚀 Características

| Función | Descripción |
| --- | --- |
| 🛍️ **Catálogo dinámico** | Búsqueda en tiempo real y filtro por categorías |
| 📦 **Sistema de apartados** | Reserva de productos con descuento automático de stock |
| 🥚 **Manejo de huevos** | Conversión automática entre cubetas y unidades (1 cubeta = 30) |
| 🎠 **Carousel automático** | Carga imágenes desde una carpeta sin tocar código |
| 🔔 **Notificaciones** | Alertas en tiempo real para nuevos apartados |
| 📊 **Dashboard admin** | Estadísticas: ventas, productos top, clientes frecuentes, visitas |
| 🔐 **Autenticación** | Sesiones con roles (admin, empleado, cliente) |
| 📱 **Diseño responsivo** | Optimizado para escritorio y móvil |
| 🔢 **Registro de visitas** | Métricas de tráfico del marketplace |
| ⚡ **Gestión de stock** | Devolución automática al cancelar apartados |
| 🏷️ **Ofertas y descuentos** | Descuentos por producto, gestión desde el panel admin y precio capturado al apartar |
| ⏱️ **Expiración automática** | Los apartados sin confirmar se cancelan y liberan stock tras 1 hora |

---

## 🛠️ Tecnologías

| Componente | Tecnología |
| :---: | :---: |
| 🖥️ Backend | **Node.js** + **Express** |
| 📄 Plantillas | **EJS** |
| 🗄️ Base de datos | **MySQL** |
| 🔑 Sesiones | **express-session** |
| 🔧 Variables de entorno | **dotenv** |
| 🎨 Frontend | **HTML** + **CSS** + **JavaScript** vanilla |

---

## 📦 Requisitos previos

Antes de empezar necesitas tener instalado:

- [![Node.js](https://img.shields.io/badge/Node.js-v16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/) — Node.js 16 o superior
- [![MySQL](https://img.shields.io/badge/MySQL-v8%2B-4479A1?logo=mysql&logoColor=white)](https://dev.mysql.com/downloads/mysql/) — MySQL 8 o superior
- [![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white)](https://git-scm.com/) — Git (opcional, para clonar)

---

## ⚙️ Instalación

```bash
# 📥 1. Clona el repositorio
git clone https://github.com/pulposky/Marketplace.git

# 📂 2. Entra a la carpeta del proyecto
cd Marketplace

# 📦 3. Instala las dependencias
npm install
```

---

## 🗄️ Configuración de la base de datos

### 1. Crea tu archivo `.env`

En la raíz del proyecto, crea un archivo `.env` con tus credenciales:

```env
BD_HOST="localhost"
BD_PORT=3306
BD_USER="root"
BD_PASSWORD="tu_contraseña"
BD_DATABASE="marketplace"

PORT=3000
```

> ⚠️ Usa el nombre de base de datos que prefieras en `BD_DATABASE`. Solo asegúrate de que coincida con el nombre que crea el script de la base de datos.

### 2. Ejecuta el script SQL

El script crea la base de datos y todas sus tablas automáticamente:

```bash
mysql -u root -p < database/schema.sql
```

> ✅ ¿Todo listo? Al arrancar el servidor, la consola te confirmará la conexión con el mensaje **"Conexión al pool de base de datos establecida correctamente"**.

### 📋 Tablas creadas

| Tabla | Sistema | Descripción |
| --- | --- | --- |
| `producto` | Compartida | Catálogo: precio, unidad, categoría, stock, `limite_venta` y oferta (`descuento`, fechas) |
| `usuarios` | Compartida | Credenciales de admin/empleado (web) y cajeros (POS) |
| `clientes` | Compartida | Registro de clientes de ambos canales |
| `apartados` | Solo web | Reservas: pendiente → confirmado → entregado / cancelado (guarda `precio_aplicado`) |
| `notificaciones` | Solo web | Alertas para el admin |
| `page_views` | Solo web | Registro de visitas |
| `permisos_rol` | Solo web | Permisos (módulos) que puede usar cada rol del panel |
| `categorias` | Solo web | Categorías de productos (nombre único) |
| `auditoria` | Solo web | Registro de acciones del panel |
| `contenido_sitio` | Solo web | Bloques de texto editables (mini-CMS), publicados en `/informacion` |
| `banners` | Solo web | Franjas promocionales de la portada con fechas e imagen |
| `venta`, `detalle_venta` | Solo POS | Facturación en punto de venta |
| `compras`, `detalle_compras`, `proveedores` | Solo POS | Compras a proveedores |
| `entradas`, `detalle_entradas` | Solo POS | Ajustes de inventario |
| `remision`, `detalle_remision` | Solo POS | Despachos |

El script es **integrado**: crea las tablas de la web y también las del POS, todo con `CREATE TABLE IF NOT EXISTS`. Puedes usarlo si montas solo la web (las tablas del POS quedan ahí sin estorbar).

---

## 🚀 Ejecutar el servidor

### Producción

```bash
npm start
```

### Desarrollo (reinicio automático con nodemon)

```bash
npm run dev
```

Servidor disponible en: **http://localhost:3000**

---

## 📂 Estructura del proyecto

```
Marketplace/
├── app.js                         # Construcción de la app Express (middlewares y rutas)
├── server.js                      # Punto de entrada (levanta app, job de expiración y puerto)
├── config/
│   ├── database.js                # Configuración de la conexión MySQL
│   ├── rateLimit.js               # Límite de peticiones por IP
│   └── session.js                 # Configuración de la sesión
├── controllers/
│   ├── sitio/
│   │   ├── sitioVistasController.js   # Páginas públicas (inicio, catálogo, detalle)
│   │   ├── sitioApiController.js      # API del carrusel (imágenes JSON)
│   │   └── informacionVistasController.js # Páginas públicas /informacion (mini-CMS)
│   ├── cliente/
│   │   ├── clienteVistasController.js # Perfil y "mis apartados"
│   │   └── clienteApiController.js    # API de edición de perfil
│   ├── admin/
│   │   ├── adminVistasController.js   # Pantallas del panel
│   │   ├── adminApiController.js      # APIs de gestión de clientes
│   │   ├── permisosVistasController.js# Página de permisos y roles (admin)
│   │   ├── permisosApiController.js   # APIs leer/guardar permisos por rol
│   │   ├── usuariosVistasController.js# Página de usuarios del panel (admin)
│   │   ├── usuariosApiController.js   # APIs CRUD del personal del panel
│   │   ├── categoriasVistasController.js    # Página de categorías (admin)
│   │   ├── categoriasApiController.js       # APIs CRUD de categorías
│   │   ├── auditoriaVistasController.js     # Página de auditoría (admin)
│   │   ├── auditoriaApiController.js        # API del registro de acciones
│   │   ├── contenidoVistasController.js     # Página del contenido editable (mini-CMS)
│   │   ├── contenidoApiController.js        # APIs CRUD de bloques de contenido
│   │   ├── bannersVistasController.js       # Página de banners/promociones
│   │   ├── bannersApiController.js          # APIs CRUD de banners (imagen base64)
│   │   ├── respaldoVistasController.js      # Página de respaldo/exportación
│   │   └── respaldoApiController.js         # Descargas CSV por tabla + JSON completo
│   ├── carrusel/
│   │   ├── carruselVistasController.js# Página de gestión del carrusel
│   │   └── carruselApiController.js   # APIs subir/eliminar imágenes
│   ├── historicos/
│   │   ├── historicosVistasController.js # Página de estadísticas
│   │   └── historicosApiController.js    # APIs de analytics + exportar Excel
│   ├── authController.js          # Login, logout, registro y verificar sesión
│   ├── productoController.js      # APIs de productos (catálogo y admin)
│   ├── apartadoController.js      # Ciclo completo del apartado/pedido
│   ├── notificacionesController.js# Campana de alertas del admin
│   ├── notificacionesClienteController.js # Notificaciones del cliente
│   └── reportesController.js      # Exportación CSV
├── models/
│   ├── productoModel.js           # SQL de productos
│   ├── apartadoModel.js           # SQL de apartados/pedidos y notificaciones de apartados
│   ├── usuarioModel.js            # SQL de usuarios
│   ├── notificacionModel.js       # SQL de las notificaciones de la campana
│   ├── historicosModel.js         # SQL de estadísticas
│   ├── permisosModel.js           # SQL de permisos por rol (tabla permisos_rol)
│   ├── categoriaModel.js          # SQL de categorías de productos (tabla categorias)
│   ├── auditoriaModel.js          # SQL del registro de acciones (tabla auditoria)
│   ├── contenidoModel.js          # SQL del contenido editable (tabla contenido_sitio)
│   ├── bannerModel.js             # SQL de banners/promociones (tabla banners)
│   └── respaldoModel.js           # Lecturas de solo lectura para exportar (sin contraseñas)
├── routes/
│   ├── index.js                   # Une los routers de cada área
│   ├── publico.js                 # Rutas públicas
│   ├── cliente.js                 # Rutas de cliente logueado
│   └── admin.js                   # Rutas del panel de administración
├── middleware/
│   ├── verificarAdmin.js          # Restricción de acceso a administradores
│   ├── verificarPermiso.js        # Restricción de acceso por permiso/módulo
│   ├── verificarUsuario.js        # Protección de rutas con sesión
│   └── contadorVisitas.js         # Registro de tráfico
├── services/
│   ├── expirarApartados.js        # Job que cancela apartados tras 1 hora
│   ├── permisosService.js         # Caché en memoria de los permisos por rol
│   ├── contenidoService.js        # Caché en memoria de los enlaces de contenido (footer)
│   ├── auditoriaService.js        # Registro de acciones (fire-and-forget)
│   └── iniciarModulos.js          # Asegura tablas/columnas nuevas al arrancar
├── utils/
│   ├── helpers.js                 # Utilidades compartidas (normalizar categorías)
│   ├── permisos.js                # Catálogo de permisos y defaults por rol
│   └── imagenes.js                # Carga/depuración de imágenes de productos
├── database/
│   ├── schema.sql                 # Script de tablas
│   └── conexion.js                # Conexión MySQL
├── public/
│   ├── css/                       # Estilos
│   ├── js/                        # Scripts del navegador
│   │   ├── main.js
│   │   ├── productos.js
│   │   ├── login.js
│   │   ├── registro.js
│   │   ├── toast.js
│   │   └── admin/
│   ├── img/                       # Imágenes
│   │   ├── carrusel/              # Carousel dinámico
│   │   └── banners/               # Imágenes de los banners/promociones
│   └── views/                     # Plantillas EJS
│       ├── main.ejs
│       ├── productos.ejs
│       ├── verApartados.ejs
│       └── admin/
├── .env                           # Variables de entorno
├── package.json
└── README.md
```

---

## 🔌 Endpoints API

### 🌐 Públicos

| Método | Ruta | Descripción |
| :---: | --- | --- |
| `GET` | `/` | Página principal |
| `GET` | `/catalogo` | Catálogo con filtros |
| `GET` | `/informacion` | Índice del contenido del sitio (mini-CMS) |
| `GET` | `/informacion/:clave` | Bloque de contenido publicado (mini-CMS) |
| `GET` | `/api/productos` | Productos en JSON |
| `GET` | `/api/carrusel-imagenes` | Imágenes del carousel |
| `GET` | `/api/verificar-sesion` | Verificar sesión activa |

### 🔐 Autenticación

| Método | Ruta | Descripción |
| :---: | --- | --- |
| `POST` | `/login` | Iniciar sesión |
| `GET` | `/logout` | Cerrar sesión |
| `POST` | `/registro` | Registrar cliente |

### 📦 Apartados (Cliente)

| Método | Ruta | Descripción |
| :---: | --- | --- |
| `POST` | `/api/apartar-producto` | Crear apartado |
| `GET` | `/verApartados` | Ver mis apartados |
| `POST` | `/api/apartados/cancelar/:id` | Cancelar apartado |
| `GET` | `/perfil` | Mi perfil |
| `PATCH` | `/api/perfil` | Editar mis datos |

### 🛡️ Administración

| Método | Ruta | Descripción |
| :---: | --- | --- |
| `GET` | `/admin` | Panel admin |
| `GET` | `/admin/habilitar-producto` | Gestionar productos |
| `GET` | `/admin/ofertas` | Ofertas y descuentos |
| `GET` | `/admin/pedidos` | Historial de pedidos |
| `GET` | `/admin/clientes` | Gestión de clientes |
| `GET` | `/admin/historicos` | Dashboard estadísticas |
| `GET` | `/admin/carrusel` | Imágenes del carrusel |
| `GET` | `/admin/permisos` | Permisos y roles (solo Administrador) |
| `GET` | `/admin/usuarios` | Personal del panel (permiso `usuarios`) |
| `GET` | `/admin/categorias` | Categorías de productos (permiso `categorias`) |
| `GET` | `/admin/auditoria` | Registro de acciones (permiso `auditoria`) |
| `GET` | `/admin/contenido` | Contenido editable del sitio (permiso `contenido`) |
| `GET` | `/admin/banners` | Banners y promociones (permiso `banners`) |
| `GET` | `/admin/respaldo` | Respaldo y exportación (permiso `respaldo`) |
| `PATCH` | `/api/admin/productos/limite-venta/:id` | Actualizar stock |
| `PATCH` | `/api/admin/productos/estado/:id` | Cambiar estado |
| `GET` | `/api/admin/ofertas` | Listar ofertas activas |
| `PATCH` | `/api/admin/ofertas/:id` | Guardar oferta de producto |
| `PATCH` | `/api/admin/apartados/confirmar/:id` | Confirmar apartado |
| `PATCH` | `/api/admin/apartados/entregado/:id` | Marcar como entregado |
| `PATCH` | `/api/admin/apartados/cancelar/:id` | Cancelar (devuelve stock) |
| `GET` | `/api/admin/apartados` | Apartados (filtro ?estado=) |
| `PATCH` | `/api/admin/clientes/:id` | Editar cliente |
| `GET` | `/api/admin/reportes/pedidos.csv` | Exportar pedidos CSV |
| `GET` | `/api/admin/reportes/clientes.csv` | Exportar clientes CSV |
| `GET` | `/api/admin/notificaciones` | Notificaciones |
| `PATCH` | `/api/admin/notificaciones/:id/leida` | Marcar leída |
| `PATCH` | `/api/admin/notificaciones/todas-leidas` | Marcar todas |
| `GET` | `/api/admin/permisos` | Leer permisos por rol (solo Administrador) |
| `PATCH` | `/api/admin/permisos` | Guardar permisos por rol (solo Administrador) |
| `GET` | `/api/admin/usuarios` | Listar personal del panel (permiso `usuarios`) |
| `POST` | `/api/admin/usuarios` | Crear usuario del panel (permiso `usuarios`) |
| `PATCH` | `/api/admin/usuarios/:id` | Editar usuario del panel (permiso `usuarios`) |
| `PATCH` | `/api/admin/usuarios/:id/password` | Cambiar contraseña (permiso `usuarios`) |
| `PATCH` | `/api/admin/usuarios/:id/activo` | Activar/desactivar (permiso `usuarios`) |
| `GET` | `/api/admin/categorias` | Listar categorías (permiso `categorias`) |
| `POST` | `/api/admin/categorias` | Crear categoría (permiso `categorias`) |
| `PATCH` | `/api/admin/categorias/:id` | Renombrar categoría (permiso `categorias`) |
| `DELETE` | `/api/admin/categorias/:id` | Eliminar categoría (permiso `categorias`) |
| `GET` | `/api/admin/auditoria` | Registro de acciones (permiso `auditoria`) |
| `GET` | `/api/admin/contenido` | Listar bloques de contenido (permiso `contenido`) |
| `POST` | `/api/admin/contenido` | Crear bloque de contenido (permiso `contenido`) |
| `PATCH` | `/api/admin/contenido/:id` | Editar bloque de contenido (permiso `contenido`) |
| `DELETE` | `/api/admin/contenido/:id` | Eliminar bloque de contenido (permiso `contenido`) |
| `GET` | `/api/admin/banners` | Listar banners (permiso `banners`) |
| `POST` | `/api/admin/banners` | Crear banner (permiso `banners`) |
| `PATCH` | `/api/admin/banners/:id` | Editar banner (permiso `banners`) |
| `PATCH` | `/api/admin/banners/:id/activo` | Activar/desactivar banner (permiso `banners`) |
| `DELETE` | `/api/admin/banners/:id` | Eliminar banner (permiso `banners`) |
| `GET` | `/api/admin/respaldo/completo` | Descargar respaldo completo JSON (permiso `respaldo`) |
| `GET` | `/api/admin/respaldo/tabla/:clave` | Descargar tabla en CSV (permiso `respaldo`) |

### 📈 Estadísticas

| Método | Ruta | Descripción |
| :---: | --- | --- |
| `GET` | `/api/admin/historicos/productos` | Más vendidos |
| `GET` | `/api/admin/historicos/clientes` | Mejores clientes |
| `GET` | `/api/admin/historicos/estados` | Pedidos por estado |
| `GET` | `/api/admin/historicos/ventas-dia` | Ventas diarias |
| `GET` | `/api/admin/historicos/visitas-dia` | Visitas diarias |
| `GET` | `/api/admin/historicos/rutas` | Visitas por ruta |

---

## 🔗 Integración con el punto de venta

El marketplace se conecta con el **Sistema de Punto de Venta (POS)**, una aplicación de escritorio desarrollada en **Python** con **Flet** y **MySQL**.

> 🔗 **Repositorio del POS:** https://github.com/pulposky/Sistema_POS

| Marketplace 🌐 (Node.js) | POS 🖥️ (Python/Flet) |
| :---: | :---: |
| Reserva en línea | Pago presencial |
| Apartados | Facturación y remisiones |
| Catálogo público | Gestión de inventario |
| Notificaciones | Códigos de barras/QR |

> Ambos sistemas comparten la misma base de datos MySQL, lo que permite sincronizar inventario y clientes entre el canal en línea y las transacciones presenciales.

---

## 👤 Roles de usuario

| Rol | Permisos |
| :---: | --- |
| 👤 **Cliente** | Explorar catálogo, buscar, apartar, cancelar apartados |
| 🛠️ **Técnico** | Mantenimiento: productos/stock, precios/ofertas, imágenes (producto y carrusel) y pedidos |
| 👨‍💼 **Supervisor / Promotor** | Panel completo: productos, pedidos, clientes, estadísticas, carrusel, categorías, configuración, contenido y banners |
| 🛡️ **Admin** | **Superadmin**: control total; único que administra permisos. Puede delegar cualquier módulo (usuarios, configuración, categorías, auditoría, contenido, banners, respaldo...) con `/admin/permisos` |

---

## 💡 Funcionalidades

### 🔄 Flujo de apartado

1. El cliente explora el catálogo y busca productos.
2. Selecciona un producto e ingresa la cantidad.
3. El sistema verifica el stock disponible.
4. Se crea el apartado y se descuenta del stock.
5. El admin recibe una notificación.
6. El admin confirma el apartado.
7. El cliente va al punto de venta a pagar y reclamar su pedido.

### 🥚 Manejo de huevos

- **1 cubeta = 30 unidades**
- El admin configura cuántas cubetas quiere vender.
- El cliente selecciona cubetas y el sistema convierte automáticamente.
- El stock se almacena en unidades individuales para mayor precisión.

### ⚡ Gestión de stock

- Confirmar apartado → el stock se reduce permanentemente.
- Cancelar apartado → las unidades regresan al stock.
- Si el stock llega a 0, el producto se deshabilita solo.

### 🏷️ Ofertas y descuentos

- El admin configura un **porcentaje de descuento** por producto desde `/admin/ofertas`, con fechas opcionales de vigencia (vacías = oferta indefinida).
- El catálogo y la página principal muestran el **precio original tachado + precio con descuento** y una etiqueta de oferta.
- Al apartar, se guarda el **precio descontado de ese momento** en `apartados.precio_aplicado`, para que el total no cambie retroactivamente si la oferta se modifica.
- El POS (Python/Flet) puede aplicar el mismo descuento leyendo las columnas compartidas `producto.descuento`, `producto.fecha_inicio_oferta` y `producto.fecha_fin_oferta`, y el precio ya descontado queda guardado en la compra/factura.

### 🎠 Carousel dinámico

Solo coloca imágenes en `public/img/carrusel/` y aparecen automáticamente.
Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes una idea, un reporte de bug o una mejora:

1. Haz un **fork** del proyecto.
2. Crea tu rama: `git checkout -b feature/mi-mejora`.
3. Haz **commit** de tus cambios: `git commit -m "feat: mi mejora"`.
4. Sube tu rama: `git push origin feature/mi-mejora`.
5. Abre un **Pull Request** 🚀

También puedes abrir un [issue](https://github.com/pulposky/Marketplace/issues) si encuentras algún problema.

---

## 📜 Licencia

Este proyecto está bajo la licencia **ISC**. Consulta el archivo de licencia para más detalles.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

<div align="center">

**⭐ Si este proyecto te resulta útil, dale una estrella en GitHub. ¡Ayuda mucho! ⭐**

Hecho con ❤️ para emprendedores que quieren vender en línea.

</div>
