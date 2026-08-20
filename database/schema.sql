-- =============================================
-- SCHEMA - BASE DE DATOS sena_pdv
-- =============================================
-- Generado a partir de los modelos del proyecto.
-- Ejecutar este archivo para crear todas las tablas.
-- =============================================

CREATE DATABASE IF NOT EXISTS sena_pdv;
USE sena_pdv;

-- -----------------------------------------------
-- TABLA: producto (catálogo de productos)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS producto (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  unidad VARCHAR(50) NOT NULL DEFAULT 'UND',
  lugar VARCHAR(255) DEFAULT NULL,
  limite_venta INT NOT NULL DEFAULT 0,
  estado VARCHAR(50) NOT NULL DEFAULT 'inactivo',
  categoria VARCHAR(100) DEFAULT NULL,
);

-- -----------------------------------------------
-- TABLA: apartados (reservas de clientes)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS apartados (
  id_apartado INT AUTO_INCREMENT PRIMARY KEY,
  nombre_cliente VARCHAR(255) NOT NULL,
  producto INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  estado ENUM('pendiente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto) REFERENCES producto(id_producto) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------
-- TABLA: notificaciones (para el admin)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  leido TINYINT(1) NOT NULL DEFAULT 0
);

-- -----------------------------------------------
-- TABLA: clientes
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  direccion VARCHAR(255) DEFAULT NULL,
  telefono VARCHAR(50) DEFAULT NULL,
  rol VARCHAR(50) DEFAULT 'cliente'
);

-- -----------------------------------------------
-- TABLA: usuarios (admin / aprendiz)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documento VARCHAR(50) NOT NULL UNIQUE,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);


-- -----------------------------------------------
-- TABLA: page_views (registro de visitas)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS page_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruta VARCHAR(255) NOT NULL,
  usuario VARCHAR(255) DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);
