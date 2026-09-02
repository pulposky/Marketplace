# 🛒 Marketplace

Plataforma web para la reserva de productos agrícolas y procesados. Los clientes exploran el catálogo, apartan productos en línea y luego acuden al punto de venta a pagar y reclamar su pedido.

---

## Tabla de contenidos

- [✨ Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [📦 Requisitos previos](#-requisitos-previos)
- [⚙️ Instalación](#️-instalación)
- [🗄️ Base de datos](#️-base-de-datos)
- [🚀 Ejecutar el servidor](#-ejecutar-el-servidor)
- [📂 Estructura del proyecto](#-estructura-del-proyecto)
- [🔌 Endpoints API](#-endpoints-api)
- [🖥️ Sistema POS vinculado](#️-sistema-pos-vinculado)
- [👤 Roles de usuario](#-roles-de-usuario)
- [💡 Funcionalidades](#-funcionalidades)

---

## ✨ Características

| Función                           | Descripción                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| 🛍️**Catálogo dinámico**  | Búsqueda en tiempo real y filtro por categorías                                    |
| 📦**Sistema de apartados**   | Reserva de productos con descuento automático de stock                              |
| 🥚**Manejo de huevos**       | Conversión automática entre cubetas y unidades (1 cubeta = 30)                     |
| 🎠**Carousel automático**   | Carga imágenes desde una carpeta sin tocar código                                  |
| 🔔**Notificaciones**         | Alertas en tiempo real para nuevos apartados                                         |
| 📊**Dashboard admin**        | Estadísticas: ventas, productos top, clientes frecuentes, visitas                   |
| 🔐**Autenticación**         | Sesiones con roles (admin, empleado, cliente)                                        |
| 📱**Diseño responsivo**     | Optimizado para escritorio y móvil                                                  |
| 🔢**Registro de visitas**    | Métricas de tráfico del marketplace                                                |
| ⚡**Gestión de stock**      | Devolución automática al cancelar apartados                                        |
| 🏷️**Ofertas y descuentos** | Descuentos por producto, gestión desde el panel admin y precio capturado al apartar |

---

## 🛠️ Tecnologías

|       Componente       |                          Tecnología                          |
| :---------------------: | :-----------------------------------------------------------: |
|      🖥️ Backend      |             **Node.js** + **Express**             |
|      📄 Plantillas      |                         **EJS**                         |
|   🗄️ Base de datos   |                        **MySQL**                        |
|       🔑 Sesiones       |                   **express-session**                   |
| 🔧 Variables de entorno |                       **dotenv**                       |
|       🎨 Frontend       | **HTML** + **CSS** + **JavaScript** vanilla |

---

## 📦 Requisitos previos

- [![Node.js](https://img.shields.io/badge/Node.js-v16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
- [![MySQL](https://img.shields.io/badge/MySQL-v8%2B-4479A1?logo=mysql&logoColor=white)](https://dev.mysql.com/downloads/mysql/)
- [![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white)](https://git-scm.com/)

---

## ⚙️ Instalación

```bash
# 📥 Clonar el repositorio
git clone https://github.com/pulposky/Marketplace.git

# 📂 Entrar a la carpeta
cd Marketplace

# 📦 Instalar dependencias
npm install
```

---

## 🗄️ Base de datos

### 1. Crear el archivo `.env`

```env
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="tu_contraseña"
BD_DATABASE="sena_pdv"

PORT=3000
```

> ⚠️ Ojo: las credenciales usan prefijo `DB_` y solo el nombre de la base usa `BD_DATABASE` (así lo lee `database/conexion.js`).

### 2. Ejecutar el script SQL

```bash
mysql -u root -p < database/schema.sql
```

> Si ya tienes una base de datos `sena_pdv` antigua (sin el estado `entregado`), ejecuta también la migración:
>
> ```bash
> mysql -u root -p < database/migracion_v2.sql
> ```

### 📋 Tablas creadas

| Tabla                                             | Sistema    | Descripción                                                                                   |
| ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `producto`                                      | Compartida | Catálogo: precio, unidad, categoría, stock,`limite_venta` y oferta (`descuento`, fechas) |
| `usuarios`                                      | Compartida | Credenciales de admin/aprendiz (web) y cajeros (POS)                                           |
| `clientes`                                      | Compartida | Registro de clientes de ambos canales                                                          |
| `apartados`                                     | Solo web   | Reservas: pendiente → confirmado → entregado / cancelado (guarda`precio_aplicado`)         |
| `notificaciones`                                | Solo web   | Alertas para el admin                                                                          |
| `page_views`                                    | Solo web   | Registro de visitas                                                                            |
| `venta`, `detalle_venta`                      | Solo POS   | Facturación en punto de venta                                                                 |
| `compras`, `detalle_compras`, `proveedores` | Solo POS   | Compras a proveedores                                                                          |
| `entradas`, `detalle_entradas`                | Solo POS   | Ajustes de inventario                                                                          |
| `remision`, `detalle_remision`                | Solo POS   | Despachos                                                                                      |

El script es **integrado**: crea las tablas de la web y también las del POS, todo con `CREATE TABLE IF NOT EXISTS`. Puedes usarlo si montas solo la web (las tablas del POS quedan ahí sin estorbar) o si vas a correr los dos sistemas sobre la misma base de datos.

---

## 🚀 Ejecutar el servidor

```bash
npm start
```

Servidor disponible en: **http://localhost:3000**

---

## 📂 Estructura del proyecto

```
Marketplace/
├── app.js                         # Construcción de la app Express (middlewares y rutas)
├── server.js                      # Punto de entrada (levanta app, job de expiración y puerto)
├── config/
│   └── session.js                 # Configuración de la sesión
├── controllers/
│   ├── sitio/
│   │   ├── sitioVistasController.js   # Páginas públicas (inicio, catálogo, detalle)
│   │   └── sitioApiController.js      # API del carrusel (imágenes JSON)
│   ├── cliente/
│   │   ├── clienteVistasController.js # Perfil y "mis apartados"
│   │   └── clienteApiController.js    # API de edición de perfil
│   ├── admin/
│   │   ├── adminVistasController.js   # Pantallas del panel
│   │   └── adminApiController.js      # APIs de gestión de clientes
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
│   └── historicosModel.js         # SQL de estadísticas
├── routes/
│   ├── index.js                   # Une los routers de cada área
│   ├── publico.js                 # Rutas públicas
│   ├── cliente.js                 # Rutas de cliente logueado
│   └── admin.js                   # Rutas del panel de administración
├── middleware/
│   ├── verificarAdmin.js          # Restricción de acceso a administradores
│   ├── verificarUsuario.js        # Protección de rutas con sesión
│   └── contadorVisitas.js         # Registro de tráfico
├── services/
│   └── expirarApartados.js        # Job que cancela apartados tras 1 hora
├── utils/
│   ├── helpers.js                 # Utilidades compartidas (normalizar categorías)
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
│   │   └── carrusel/              # Carousel dinámico
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

| Método | Ruta                       | Descripción             |
| :-----: | -------------------------- | ------------------------ |
| `GET` | `/`                      | Página principal        |
| `GET` | `/catalogo`              | Catálogo con filtros    |
| `GET` | `/api/productos`         | Productos en JSON        |
| `GET` | `/api/carrusel-imagenes` | Imágenes del carousel   |
| `GET` | `/api/verificar-sesion`  | Verificar sesión activa |

### 🔐 Autenticación

| Método | Ruta          | Descripción      |
| :------: | ------------- | ----------------- |
| `POST` | `/login`    | Iniciar sesión   |
| `GET` | `/logout`   | Cerrar sesión    |
| `POST` | `/registro` | Registrar cliente |

### 📦 Apartados (Cliente)

|  Método  | Ruta                            | Descripción      |
| :-------: | ------------------------------- | ----------------- |
| `POST` | `/api/apartar-producto`       | Crear apartado    |
|  `GET`  | `/verApartados`               | Ver mis apartados |
| `POST` | `/api/apartados/cancelar/:id` | Cancelar apartado |
|  `GET`  | `/perfil`                     | Mi perfil         |
| `PATCH` | `/api/perfil`                 | Editar mis datos  |

### 🛡️ Administración

|  Método  | Ruta                                       | Descripción                |
| :-------: | ------------------------------------------ | --------------------------- |
|  `GET`  | `/admin`                                 | Panel admin                 |
|  `GET`  | `/admin/habilitar-producto`              | Gestionar productos         |
|  `GET`  | `/admin/ofertas`                         | Ofertas y descuentos        |
|  `GET`  | `/admin/pedidos`                         | Historial de pedidos        |
|  `GET`  | `/admin/clientes`                        | Gestión de clientes        |
|  `GET`  | `/admin/historicos`                      | Dashboard estadísticas     |
| `PATCH` | `/api/admin/productos/limite-venta/:id`  | Actualizar stock            |
| `PATCH` | `/api/admin/productos/estado/:id`        | Cambiar estado              |
|  `GET`  | `/api/admin/ofertas`                     | Listar ofertas activas      |
| `PATCH` | `/api/admin/ofertas/:id`                 | Guardar oferta de producto  |
| `PATCH` | `/api/admin/apartados/confirmar/:id`     | Confirmar apartado          |
| `PATCH` | `/api/admin/apartados/entregado/:id`     | Marcar como entregado       |
| `PATCH` | `/api/admin/apartados/cancelar/:id`      | Cancelar (devuelve stock)   |
|  `GET`  | `/api/admin/apartados`                   | Apartados (filtro ?estado=) |
| `PATCH` | `/api/admin/clientes/:id`                | Editar cliente              |
|  `GET`  | `/api/admin/reportes/pedidos.csv`        | Exportar pedidos CSV        |
|  `GET`  | `/api/admin/reportes/clientes.csv`       | Exportar clientes CSV       |
|  `GET`  | `/api/admin/notificaciones`              | Notificaciones              |
| `PATCH` | `/api/admin/notificaciones/:id/leida`    | Marcar leída               |
| `PATCH` | `/api/admin/notificaciones/todas-leidas` | Marcar todas                |

### 📈 Estadísticas

| Método | Ruta                                  | Descripción       |
| :-----: | ------------------------------------- | ------------------ |
| `GET` | `/api/admin/historicos/productos`   | Más vendidos      |
| `GET` | `/api/admin/historicos/clientes`    | Mejores clientes   |
| `GET` | `/api/admin/historicos/estados`     | Pedidos por estado |
| `GET` | `/api/admin/historicos/ventas-dia`  | Ventas diarias     |
| `GET` | `/api/admin/historicos/visitas-dia` | Visitas diarias    |
| `GET` | `/api/admin/historicos/rutas`       | Visitas por ruta   |

---

## 🖥️ Sistema POS (vinculado)

El marketplace se conecta con el **Sistema de Punto de Venta (POS)**, una aplicación de escritorio desarrollada en **Python** con **Flet** y **MySQL**.

> 🔗 **Repositorio del POS:** https://github.com/pulposky/Sistema_POS

| Marketplace 🌐 (Node.js) |  POS 🖥️ (Python/Flet)  |
| :----------------------: | :-----------------------: |
|    Reserva en línea    |      Pago presencial      |
|        Apartados        | Facturación y remisiones |
|    Catálogo público    |  Gestión de inventario  |
|      Notificaciones      |   Códigos de barras/QR   |

> Ambos sistemas comparten la misma base de datos MySQL, lo que permite sincronizar inventario y clientes entre el canal en línea y las transacciones presenciales.

---

## 👤 Roles de usuario

|           Rol           | Permisos                                                    |
| :----------------------: | ----------------------------------------------------------- |
|   👤**Cliente**   | Explorar catálogo, buscar, apartar, cancelar apartados     |
| 👨‍💼**Empleado** | Panel admin, gestión de productos, pedidos y estadísticas |
|  👨‍💼**Admin**  | Control total: productos, pedidos, usuarios, notificaciones |

---

## 💡 Funcionalidades

### 🔄 Flujo de apartado

1. El cliente explora el catálogo y busca productos.
2. Selecciona un producto e ingresa la cantidad.
3. El sistema verifica el stock disponible.
4. Se crea el apartado y se descuenta del stock.
5. El admin recibe una notificación.
6. El admin confirma el apartado.
7. El cliente va al punto de vista a pagar y reclamar su pedido.

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
- El POS (Python/Flet) puede aplicar el mismo descuento leyendo las columnas compartidas `producto.descuento`, `producto.fecha_inicio_oferta` y `producto.fecha_fin_oferta`, y el precio ya descontado de `apartados.precio_aplicado`.

### 🎠 Carousel dinámico

Solo coloca imágenes en `public/img/carrusel/` y aparecen automáticamente.
Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

---

## 📜 Licencia

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
