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

| Función                          | Descripción                                                       |
| --------------------------------- | ------------------------------------------------------------------ |
| 🛍️**Catálogo dinámico** | Búsqueda en tiempo real y filtro por categorías                  |
| 📦**Sistema de apartados**  | Reserva de productos con descuento automático de stock            |
| 🥚**Manejo de huevos**      | Conversión automática entre cubetas y unidades (1 cubeta = 30)   |
| 🎠**Carousel automático**  | Carga imágenes desde una carpeta sin tocar código                |
| 🔔**Notificaciones**        | Alertas en tiempo real para nuevos apartados                       |
| 📊**Dashboard admin**       | Estadísticas: ventas, productos top, clientes frecuentes, visitas |
| 🔐**Autenticación**        | Sesiones con roles (admin, empleado, cliente)                      |
| 📱**Diseño responsivo**    | Optimizado para escritorio y móvil                                |
| 🔢**Registro de visitas**   | Métricas de tráfico del marketplace                              |
| ⚡**Gestión de stock**     | Devolución automática al cancelar apartados                      |

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
BD_HOST="localhost"
BD_PORT=3306
BD_USER="root"
BD_PASSWORD="tu_contraseña"
BD_DATABASE="pos_db"

PORT=3000
```

### 2. Ejecutar el script SQL

```bash
mysql -u root -p < database/schema.sql
```

### 📋 Tablas creadas

| Tabla              | Descripción                                                |
| ------------------ | ----------------------------------------------------------- |
| `producto`       | Catálogo con precio, unidad, categoría y stock            |
| `apartados`      | Reservas con estados (pendiente → confirmado → cancelado) |
| `notificaciones` | Alertas para el admin                                       |
| `clientes`       | Registro de clientes                                        |
| `usuarios`       | Credenciales de admin y empleados                           |
| `page_views`     | Registro de visitas                                         |

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
├── controllers/
│   ├── productosController.js    # Productos y apartados
│   ├── historicosController.js   # Estadísticas
│   ├── usuarioController.js      # Login y registro
│   └── viewController.js         # Renderizado de vistas
├── model/
│   ├── productoModel.js          # SQL de productos
│   ├── historicosModel.js        # SQL de estadísticas
│   └── usuarioModel.js           # SQL de usuarios
├── database/
│   ├── schema.sql                # Script de tablas
│   └── conexion.js               # Conexión MySQL
├── middleware/
│   ├── verificarUsuario.js       # Protección de rutas
│   └── contadorVisitas.js        # Registro de tráfico
├── public/
│   ├── css/                      # Estilos
│   ├── js/                       # Scripts del navegador
│   │   ├── main.js
│   │   ├── productos.js
│   │   ├── login.js
│   │   ├── registro.js
│   │   ├── toast.js
│   │   └── admin/
│   ├── img/                      # Imágenes
│   │   └── carrusel/             # Carousel dinámico
│   └── views/                    # Plantillas EJS
│       ├── main.ejs
│       ├── productos.ejs
│       ├── verApartados.ejs
│       └── admin/
├── src/
│   └── router.js                 # Definición de rutas
├── .env                          # Variables de entorno
├── server.js                     # Punto de entrada
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

| Método | Ruta                            | Descripción      |
| :------: | ------------------------------- | ----------------- |
| `POST` | `/api/apartar-producto`       | Crear apartado    |
| `GET` | `/verApartados`               | Ver mis apartados |
| `POST` | `/api/apartados/cancelar/:id` | Cancelar apartado |

### 🛡️ Administración

|  Método  | Ruta                                       | Descripción              |
| :-------: | ------------------------------------------ | ------------------------- |
|  `GET`  | `/admin`                                 | Panel admin               |
|  `GET`  | `/admin/habilitar-producto`              | Gestionar productos       |
|  `GET`  | `/admin/pedidos`                         | Gestionar pedidos         |
|  `GET`  | `/admin/historicos`                      | Dashboard estadísticas   |
| `PATCH` | `/api/admin/productos/limite-venta/:id`  | Actualizar stock          |
| `PATCH` | `/api/admin/productos/estado/:id`        | Cambiar estado            |
| `PATCH` | `/api/admin/apartados/confirmar/:id`     | Confirmar apartado        |
| `PATCH` | `/api/admin/apartados/cancelar/:id`      | Cancelar (devuelve stock) |
|  `GET`  | `/api/admin/apartados`                   | Apartados pendientes      |
|  `GET`  | `/api/admin/notificaciones`              | Notificaciones            |
| `PATCH` | `/api/admin/notificaciones/:id/leida`    | Marcar leída             |
| `PATCH` | `/api/admin/notificaciones/todas-leidas` | Marcar todas              |

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

| Marketplace 🌐 (Node.js) | POS 🖥️ (Python/Flet) |
|:-------------------------:|:---------------------:|
| Reserva en línea | Pago presencial |
| Apartados | Facturación y remisiones |
| Catálogo público | Gestión de inventario |
| Notificaciones | Códigos de barras/QR |

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

### 🎠 Carousel dinámico

Solo coloca imágenes en `public/img/carrusel/` y aparecen automáticamente.
Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

---

## 📜 Licencia

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
