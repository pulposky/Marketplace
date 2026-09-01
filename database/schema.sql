-- ============================================================
-- SCRIPT INTEGRADO DE BASE DE DATOS: sena_pdv
-- ============================================================
-- Esta base de datos es COMPARTIDA por dos sistemas:
--
--   1. SISTEMA POS DE ESCRITORIO (Python/Flet)
--      https://github.com/pulposky/Sistema_POS
--      Pago presencial, facturación, inventario y remisiones.
--
--   2. MARKETPLACE WEB (Node.js/EJS)  -> este repositorio
--      Reserva en línea de productos (apartados).
--
-- ORDEN DE EJECUCIÓN:
--   Este script asume que el POS fue instalado primero y ya
--   creó las tablas base. Las tablas del POS se crean con
--   CREATE TABLE IF NOT EXISTS (no borran nada si ya existen).
--   Las columnas propias de la web se agregan con ALTER TABLE
--   ADD COLUMN IF NOT EXISTS (MySQL 8+). Las tablas web se
--   crean con CREATE TABLE IF NOT EXISTS al final.
--
-- Reparto de tablas:
--   COMPARTIDAS : usuarios, clientes, producto
--   SOLO POS    : proveedores, venta, detalle_venta, compras,
--                 detalle_compras, entradas, detalle_entradas,
--                 remision, detalle_remision
--   SOLO WEB    : apartados, notificaciones, page_views
--
-- Nota sobre el inventario entre sistemas:
--   - El POS maneja el stock físico en producto.stock.
--   - La web maneja las unidades disponibles para vender en
--     línea en producto.limite_venta (se descuenta al apartar
--     y se repone al cancelar). Cuando un pedido se entrega,
--     el cobro se hace en el POS, que descuenta su propio stock.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `sena_pdv` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sena_pdv`;

-- ============================================================
-- TABLAS COMPARTIDAS (POS + WEB)
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Login de admins y aprendices en la web, y cajeros en el POS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) NOT NULL DEFAULT 'Cajero'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario inicial por defecto (admin / admin123)
-- Password hasheada con bcrypt para mayor seguridad
INSERT INTO `usuarios` (`id_usuario`, `nombre`, `usuario`, `password`, `rol`)
VALUES (1, 'Administrador del Sistema', 'admin', '$2b$10$2iIPkF5/e/3fmsNXncsrFOLIgWrVxH9u37xKbZVWYacXSM6h3Od1O', 'Administrador')
ON DUPLICATE KEY UPDATE `id_usuario`=`id_usuario`;

-- ------------------------------------------------------------
-- Tabla: clientes
-- Registro de clientes de la web y consumidor final del POS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `documento` VARCHAR(30) DEFAULT '',
  `direccion` VARCHAR(150) DEFAULT '',
  `telefono` VARCHAR(30) DEFAULT '',
  `rol` VARCHAR(50) DEFAULT 'Cliente',
  `password` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cliente por defecto para ventas rápidas (Consumidor Final)
INSERT INTO `clientes` (`id_cliente`, `nombre`, `documento`, `direccion`, `telefono`, `rol`)
VALUES (1, 'Cliente General', '222222222222', 'Ciudad', '0000000000', 'Cliente')
ON DUPLICATE KEY UPDATE `id_cliente`=`id_cliente`;

-- ------------------------------------------------------------
-- Tabla: producto
-- Catálogo usado por la web (catálogo público y apartados) y
-- por el POS (facturación e inventario).
--
-- Columnas propias de la WEB:
--   limite_venta: unidades habilitadas para venta en línea
--                 (0 = no disponible online).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `producto` (
  `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `unidad` VARCHAR(20) DEFAULT 'UND',
  `lugar` VARCHAR(50) DEFAULT 'Bodega Principal',
  `precio` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `categoria` VARCHAR(100) DEFAULT 'Otros',
  `stock` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `limite_venta` INT NOT NULL DEFAULT 0,
  `estado` VARCHAR(50) DEFAULT 'inactivo',
  `descripcion` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLAS DEL SISTEMA POS
-- (La web no las usa, pero se crean para que el POS funcione
--  con esta misma base de datos desde el primer momento)
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id_proveedor` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `proveedores` (`id_proveedor`, `nombre`)
VALUES (1, 'Proveedor General')
ON DUPLICATE KEY UPDATE `id_proveedor`=`id_proveedor`;

-- ------------------------------------------------------------
-- Tabla: venta (POS - pago presencial)
-- Aquí termina el flujo: el cliente aparta en la web, paga y
-- reclama en el punto de venta, y se registra la venta.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `venta` (
  `id_venta` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(50) NOT NULL,
  `estado` VARCHAR(20) DEFAULT 'ACTIVA',
  `id_cliente` INT DEFAULT 1,
  `id_usuario` INT DEFAULT 1,
  `dinero_recibido` DECIMAL(12, 2) DEFAULT 0.00,
  `cambio` DECIMAL(12, 2) DEFAULT 0.00,
  `notas` VARCHAR(150),
  `id_apartado` INT DEFAULT NULL,
  FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tabla: detalle_venta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_venta` (
  `id_detalle` INT AUTO_INCREMENT PRIMARY KEY,
  `id_venta` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` DECIMAL(12, 2) NOT NULL,
  `precio_unitario` DECIMAL(12, 2) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`id_venta`) REFERENCES `venta`(`id_venta`),
  FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tablas: compras a proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `compras` (
  `id_compra` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `id_proveedor` INT DEFAULT 1,
  `id_usuario` INT DEFAULT 1,
  `estado` VARCHAR(20) DEFAULT 'ACTIVA',
  FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `detalle_compras` (
  `id_detalle` INT AUTO_INCREMENT PRIMARY KEY,
  `id_compra` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` DECIMAL(12, 2) NOT NULL,
  `precio_unitario` DECIMAL(12, 2) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`id_compra`) REFERENCES `compras`(`id_compra`),
  FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tablas: entradas de inventario
-- Agregan existencias por ajustes o devoluciones.
-- No guardan ni modifican precios o costos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `entradas` (
  `id_entrada` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL,
  `observacion` TEXT,
  `id_usuario` INT DEFAULT 1,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `detalle_entradas` (
  `id_detalle_entrada` INT AUTO_INCREMENT PRIMARY KEY,
  `id_entrada` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`id_entrada`) REFERENCES `entradas`(`id_entrada`),
  FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tablas: remisiones
-- Despachos de mercancía sin factura directa.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `remision` (
  `id_remision` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL,
  `tipo_remision` VARCHAR(50) DEFAULT 'Despacho',
  `id_cliente` INT DEFAULT 1,
  `id_usuario` INT DEFAULT 1,
  `notas` TEXT,
  `estado` VARCHAR(20) DEFAULT 'ACTIVA',
  FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `detalle_remision` (
  `id_detalle_remision` INT AUTO_INCREMENT PRIMARY KEY,
  `id_remision` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`id_remision`) REFERENCES `remision`(`id_remision`),
  FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INTEGRACION CON MARKETPLACE WEB
-- ============================================================
-- Este bloque sincroniza la base de datos compartida con el
-- Marketplace web (https://github.com/pulposky/Marketplace).
--
-- Si la base fue creada primero por el Marketplace, estas
-- instrucciones no alteran nada (todo usa IF NOT EXISTS).
-- Si la base fue creada primero por el POS, se agregan las
-- columnas y tablas que la web necesita para funcionar.
-- ============================================================

-- Columna que la web usa para controlar el stock en linea
-- (el POS solo usa producto.stock para el inventario fisico)
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `limite_venta` INT NOT NULL DEFAULT 0;

-- Columna descripcion por si no existia en el POS
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `descripcion` TEXT DEFAULT NULL;

-- Columna categoria por si no existia en el POS
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `categoria` VARCHAR(100) DEFAULT 'Otros';

-- ------------------------------------------------------------
-- OFERTAS / DESCUENTOS EN EL PRECIO
-- ------------------------------------------------------------
-- Estructura compartida (web + POS) para aplicar descuentos a
-- un producto. La web la usa para calcular el precio de oferta
-- en el catálogo, los apartados y el panel admin. El POS la lee
-- para facturar con el mismo descuento.
--
--   descuento            : porcentaje de descuento (0.00 = sin oferta).
--   fecha_inicio_oferta  : inicio de vigencia (NULL = sin límite).
--   fecha_fin_oferta     : fin de vigencia (NULL = sin límite).
--   Si ambas fechas son NULL, la oferta está siempre activa.
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `descuento` DECIMAL(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `fecha_inicio_oferta` DATETIME NULL DEFAULT NULL;
ALTER TABLE `producto`
  ADD COLUMN IF NOT EXISTS `fecha_fin_oferta` DATETIME NULL DEFAULT NULL;

-- Columna password para el login de clientes de la web
-- (el POS no la usa; guarda el hash bcrypt)
ALTER TABLE `clientes`
  ADD COLUMN IF NOT EXISTS `password` VARCHAR(255) DEFAULT NULL;

-- ------------------------------------------------------------
-- Tabla: apartados (reservas de la web)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `apartados` (
  `id_apartado` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_cliente` VARCHAR(255) NOT NULL,
  `producto` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_aplicado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('pendiente', 'confirmado', 'cancelado', 'entregado') NOT NULL DEFAULT 'pendiente',
  `cancelado_por` ENUM('admin', 'cliente') DEFAULT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`producto`) REFERENCES `producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indices para pedidos, reportes y estadisticas
CREATE INDEX `idx_apartados_estado` ON `apartados`(`estado`);
CREATE INDEX `idx_apartados_cliente` ON `apartados`(`nombre_cliente`);

-- Columna para rastrear qué admin confirmó cada apartado
ALTER TABLE `apartados`
  ADD COLUMN IF NOT EXISTS `confirmado_por` VARCHAR(100) DEFAULT NULL;

-- Precio (con descuento) capturado al momento de apartar.
-- Se agrega por si la tabla apatados ya existía (creada por el POS
-- o por una versión previa del marketplace que no lo tenía).
ALTER TABLE `apartados`
  ADD COLUMN IF NOT EXISTS `precio_aplicado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- Vinculación entre la venta del POS y el apartado web entregado.
-- La columna `venta.id_apartado` ya viene declarada en CREATE TABLE venta.
-- La FK se agrega aquí porque `apartados` se crea después que `venta`.
-- NULL = venta directa de pasillo; no NULL = entrega de apartado (el POS
-- desactiva el descuento de limite_venta y marca el apartado 'entregado').
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_apartado`
  FOREIGN KEY (`id_apartado`)
  REFERENCES `apartados`(`id_apartado`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX `idx_venta_apartado` ON `venta`(`id_apartado`);

-- ------------------------------------------------------------
-- Tabla: notificaciones (alertas para el admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `leido` TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tabla: page_views (registro de visitas del marketplace)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ruta` VARCHAR(255) NOT NULL,
  `usuario` VARCHAR(255) DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FIN INTEGRACION MARKETPLACE WEB
-- ============================================================
