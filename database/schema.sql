-- ============================================================
-- SCRIPT INTEGRADO DE BASE DE DATOS: sena_pdv
-- ============================================================
-- Esta base de datos es COMPARTIDA por dos sistemas:
--
--   1. MARKETPLACE WEB (Node.js/EJS)  -> este repositorio
--      Reserva en línea de productos (apartados).
--
--   2. SISTEMA POS DE ESCRITORIO (Python/Flet)
--      https://github.com/pulposky/Sistema_POS
--      Pago presencial, facturación, inventario y remisiones.
--
-- Reparto de tablas:
--   COMPARTIDAS : usuarios, clientes, producto
--   SOLO POS    : proveedores, venta, detalle_venta, compras,
--                 detalle_compras, entradas, detalle_entradas,
--                 remision, detalle_remision
--   SOLO WEB    : apartados, notificaciones, page_views
--
-- Todo usa CREATE TABLE IF NOT EXISTS, así que este script se
-- puede ejecutar antes o después del script del POS sin borrar
-- nada y en cualquier orden. Sirve tanto si vas a usar solo la
-- web como si vas a usar los dos sistemas juntos.
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

-- ------------------------------------------------------------
-- Tabla: usuarios (COMPARTIDA)
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
INSERT INTO `usuarios` (`id_usuario`, `nombre`, `usuario`, `password`, `rol`)
VALUES (1, 'Administrador del Sistema', 'admin', 'admin123', 'Administrador')
ON DUPLICATE KEY UPDATE `id_usuario`=`id_usuario`;

-- ------------------------------------------------------------
-- Tabla: clientes (COMPARTIDA)
-- Registro de clientes de la web y consumidor final del POS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `documento` VARCHAR(30) DEFAULT '',
  `direccion` VARCHAR(150) DEFAULT '',
  `telefono` VARCHAR(30) DEFAULT '',
  `rol` VARCHAR(50) DEFAULT 'Cliente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cliente por defecto para ventas rápidas (Consumidor Final)
INSERT INTO `clientes` (`id_cliente`, `nombre`, `documento`, `direccion`, `telefono`, `rol`)
VALUES (1, 'Cliente General', '222222222222', 'Ciudad', '0000000000', 'Cliente')
ON DUPLICATE KEY UPDATE `id_cliente`=`id_cliente`;

-- ------------------------------------------------------------
-- Tabla: producto (COMPARTIDA)
-- Catálogo usado por la web (catálogo público y apartados) y
-- por el POS (facturación e inventario).
--   limite_venta: columna propia de la WEB. Unidades habilitadas
--                 para venta en línea (0 = no disponible online).
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
  `descripcion` VARCHAR(250) DEFAULT NULL
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
-- Tablas: compras a proveedores (POS)
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
-- Tablas: entradas de inventario (POS)
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
-- Tablas: remisiones (POS)
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
-- TABLAS PROPIAS DE LA WEB (MARKETPLACE)
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: apartados (WEB)
-- Reservas de productos hechas por los clientes en línea.
-- Ciclo: pendiente -> confirmado -> entregado (o cancelado)
--   pendiente : el cliente apartó, esperando revisión del admin
--   confirmado: el admin confirmó el pedido
--   entregado : el cliente pagó y recibió en el punto de venta
--   cancelado : se canceló y el stock de la web se devolvió
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `apartados` (
  `id_apartado` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_cliente` VARCHAR(255) NOT NULL,
  `producto` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `estado` ENUM('pendiente', 'confirmado', 'cancelado', 'entregado') NOT NULL DEFAULT 'pendiente',
  `cancelado_por` ENUM('admin', 'cliente') DEFAULT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`producto`) REFERENCES `producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para pedidos, reportes y estadísticas
CREATE INDEX `idx_apartados_estado` ON `apartados`(`estado`);
CREATE INDEX `idx_apartados_cliente` ON `apartados`(`nombre_cliente`);

-- ------------------------------------------------------------
-- Tabla: notificaciones (WEB)
-- Alertas para el admin cuando alguien aparta un producto
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `leido` TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tabla: page_views (WEB)
-- Registro de visitas para las estadísticas del dashboard
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ruta` VARCHAR(255) NOT NULL,
  `usuario` VARCHAR(255) DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
