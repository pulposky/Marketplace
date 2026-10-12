# 🛒 Marketplace

Plataforma web para la reserva de productos agrícolas y procesados. Los clientes exploran el catálogo, apartan productos en línea y luego acuden al punto de venta a pagar y reclamar su pedido.

---

## ✨ ¿Qué hace este proyecto?

Marketplace es una solución orientada a comercios que necesitan vender productos online, gestionar apartados y controlar stock sin perder sincronización con el punto de venta físico.

El proyecto combina:
- catálogo público con búsqueda y filtros
- apartados/reservas con validación de stock
- dashboard administrativo con estadísticas
- manejo de ofertas y descuentos
- autenticación con roles de usuario
- integración con un sistema POS externo

---

## 🧩 Características principales

- 🛍️ Catálogo dinámico con filtros por categoría y búsqueda rápida
- 📦 Sistema de apartados con descuento automático de stock
- 🥚 Manejo de unidades y cubetas para productos como huevos
- 🔔 Notificaciones para administración y clientes
- 📊 Dashboard admin con métricas de ventas, productos y visitas
- 🔐 Autenticación con roles: admin, empleado y cliente
- 📱 Diseño responsivo para escritorio y móvil
- 🏷️ Ofertas y descuentos configurables desde el panel administrativo

---

## 🛠️ Tecnologías usadas

| Componente | Tecnología |
| --- | --- |
| Backend | Node.js + Express |
| Plantillas | EJS |
| Base de datos | MySQL |
| Sesiones | express-session |
| Variables de entorno | dotenv |
| Frontend | HTML + CSS + JavaScript |

---

## 🚀 Instalación rápida

```bash
git clone https://github.com/pulposky/Marketplace.git
cd Marketplace
npm install
```

Crea tu archivo `.env` con tus credenciales de MySQL:

```env
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="tu_contraseña"
BD_DATABASE="sena_pdv"
PORT=3000
```

Luego crea la base de datos:

```bash
mysql -u root -p < database/schema.sql
```

Finalmente inicia la app:

```bash
npm start
```

Abrir en: http://localhost:3000

---

## 📸 Showcase

Este proyecto gana mucho más si se ve funcionando. Si quieres, puedes agregar capturas o un GIF con el flujo principal:

- pantalla principal del catálogo
- detalle de producto
- proceso de apartado
- panel administrativo
- dashboard de estadísticas

Ejemplo de bloque para añadir imágenes:

```md
![Home](./assets/screenshots/home.png)
![Detalle del producto](./assets/screenshots/product-detail.png)
![Dashboard admin](./assets/screenshots/admin-dashboard.png)
```

> Si aún no tienes imágenes, puedes dejarlos como placeholders y luego subir capturas reales.

---

## 🔐 Roles del sistema

| Rol | Permisos |
| --- | --- |
| Cliente | Explorar catálogo, apartar y consultar pedidos |
| Empleado | Gestionar stock, pedidos y administración básica |
| Admin | Control total del sistema, productos, usuarios y reportes |

---

## 🧠 Flujo de negocio

1. El cliente visita el catálogo y busca un producto.
2. Elige cantidad y realiza un apartado.
3. El sistema valida stock y descuenta unidades.
4. El administrador recibe la notificación.
5. Se confirma el pedido y se completa la entrega en punto de venta.

---

## 🖥️ Integración con POS

Este marketplace se conecta con el sistema POS de la misma infraestructura para sincronizar inventario, clientes y procesos de venta presencial.

Repositorio relacionado:

- [Sistema_POS](https://github.com/pulposky/Sistema_POS)

---

## 📦 Estructura del proyecto

```text
Marketplace/
├── app.js
├── server.js
├── controllers/
├── models/
├── routes/
├── middleware/
├── services/
├── utils/
├── database/
├── public/
├── .env
├── package.json
└── README.md
```

---

## 🧪 Funcionalidades destacadas

- Búsqueda de productos en tiempo real
- Sistema de apartados con validación de stock
- Notificaciones automáticas para admin
- Manejo de ofertas por producto
- exportación de informes CSV
- historial y métricas de visitas y ventas

---

## 📜 Licencia

Este proyecto tiene licencia MIT. Si quieres, también puedes agregar un badge License con el siguiente bloque:

```md
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

---

## ✅ Recomendaciones rápidas para que llame más la atención

- Añadir 2 o 3 capturas reales del flujo principal
- Añadir un GIF corto del catálogo + apartado + admin
- Crear una demo desplegada en Vercel/Render
- Agregar badges de tecnologías y estado del build
- Poner los repos más importantes fijos en tu perfil de GitHub

---

## 📌 Proyecto relacionado

- [pulposky](https://github.com/pulposky)

Si te gusta el proyecto, ¡déjale una estrella!
```

Si quieres, te puedo dar también la versión más “bonita” y comercial del README de Marketplace, con un look más premium y más impactante visualmente, pero esta ya sirve perfectamente para pegar y publicar.