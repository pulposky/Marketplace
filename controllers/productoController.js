// =============================================
// CONTROLADOR DE PRODUCTOS
// =============================================
// Lógica del catálogo a nivel de API:
// listar productos (JSON) y que el admin pueda
// cambiar la cantidad límite o el estado.
// =============================================

const fs = require('fs');
const path = require('path');
const ProductoModel = require('../models/productoModel');
const { normalizarCategorias, calcularPrecioOferta } = require('../utils/helpers');
const { normalizeText } = require('../utils/imagenes');

const ProductoController = {

    // POST /api/admin/productos
    // Crea un producto nuevo desde el panel admin.
    // El estado inicial depende del límite de venta (si es 0 queda inactivo).
    crearProducto: (req, res) => {
        const { nombre, categoria, unidad, lugar, descripcion, precio, limiteVenta } = req.body;

        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
        }

        const precioNum = Number(precio);
        if (isNaN(precioNum) || precioNum <= 0) {
            return res.status(400).json({ error: 'Precio inválido o debe ser mayor a 0.' });
        }

        const limite = Math.max(0, parseInt(limiteVenta, 10) || 0);

        ProductoModel.crearProducto({
            codigo: `WEB-${Date.now()}`,
            nombre: String(nombre).trim(),
            unidad: String(unidad || 'UND').trim() || 'UND',
            lugar: String(lugar || 'Bodega Principal').trim() || 'Bodega Principal',
            precio: precioNum,
            categoria: String(categoria || 'Otros').trim() || 'Otros',
            stock: limite,
            limiteVenta: limite,
            estado: limite > 0 ? 'activo' : 'inactivo',
            descripcion: String(descripcion || '').trim()
        }, (error, resultado) => {
            if (error) {
                console.error('Error creando producto:', error);
                return res.status(500).json({ error: 'Error en el servidor al crear el producto.' });
            }

            return res.status(201).json({
                ok: true,
                id: resultado.insertId,
                estado: limite > 0 ? 'activo' : 'inactivo',
                mensaje: 'Producto creado correctamente.'
            });
        });
    },

    // PATCH /api/admin/productos/:id/datos
    // Actualiza los datos de un producto (nombre, categoría, unidad, lugar,
    // descripción y precio). Stock y estado se gestionan en el panel.
    actualizarDatosProducto: (req, res) => {
        const { id } = req.params;
        const { nombre, categoria, unidad, lugar, descripcion, precio } = req.body;

        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
        }

        const precioNum = Number(precio);
        if (isNaN(precioNum) || precioNum <= 0) {
            return res.status(400).json({ error: 'Precio inválido o debe ser mayor a 0.' });
        }

        ProductoModel.actualizarDatosProducto(id, {
            nombre: String(nombre).trim(),
            categoria: String(categoria || 'Otros').trim() || 'Otros',
            unidad: String(unidad || 'UND').trim() || 'UND',
            lugar: String(lugar || 'Bodega Principal').trim() || 'Bodega Principal',
            descripcion: String(descripcion || '').trim(),
            precio: precioNum
        }, (error) => {
            if (error) {
                console.error('Error actualizando datos de producto:', error);
                return res.status(500).json({ error: 'Error en el servidor al guardar los datos.' });
            }
            return res.json({ ok: true, mensaje: 'Producto actualizado correctamente.' });
        });
    },

    // POST /api/admin/productos/:id/imagen
    // Guarda (o reemplaza) la foto de un producto. Recibe un dataURL base64
    // en el body y lo guarda en /public/img/upload con el nombre normalizado
    // del producto, para que la asociación por nombre la tome automáticamente.
    subirImagenProducto: (req, res) => {
        const { id } = req.params;
        const { imagen } = req.body;

        const coincidencia = String(imagen || '').match(/^data:image\/(jpeg|png|webp);base64,/i);
        if (!coincidencia) {
            return res.status(400).json({ error: 'Imagen inválida. Debe ser JPG, PNG o WebP.' });
        }

        const tipoImagen = coincidencia[1].toLowerCase();
        const extension = tipoImagen === 'jpeg' ? 'jpg' : tipoImagen;

        ProductoModel.obtenerPorId(id, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado.' });
            }

            const producto = resultados[0];
            const nombreArchivo = `${normalizeText(producto.nombre)}.${extension}`;
            const rutaArchivo = path.join(__dirname, '..', 'public', 'img', 'upload', nombreArchivo);
            const base64 = String(imagen).split(',')[1];

            fs.writeFile(rutaArchivo, Buffer.from(base64, 'base64'), (errorFs) => {
                if (errorFs) {
                    console.error('Error escribiendo imagen:', errorFs);
                    return res.status(500).json({ error: 'Error en el servidor al guardar la imagen.' });
                }

                return res.json({
                    ok: true,
                    url: `/img/upload/${nombreArchivo}`,
                    mensaje: 'Imagen actualizada correctamente.'
                });
            });
        });
    },

    // GET /api/productos
    // Devuelve todos los productos como JSON.
    // Opcionalmente filtra por categoría (?categoria=xxx)
    // o por texto de búsqueda (?busqueda=xxx)
    obtenerTodos: (req, res) => {
        const categorias = normalizarCategorias(req.query.categoria || req.query.categorias);
        const busqueda = String(req.query.busqueda || '').trim().toLowerCase();

        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }

            let productosFiltrados = resultados;

            if (categorias.length > 0) {
                productosFiltrados = productosFiltrados.filter((producto) => categorias.includes(producto.categoria));
            }

            if (busqueda) {
                productosFiltrados = productosFiltrados.filter((producto) =>
                    producto.nombre && producto.nombre.toLowerCase().includes(busqueda)
                );
            }

            res.json(productosFiltrados);
        });
    },

    // PATCH /api/admin/productos/limite-venta/:id
    // Actualiza la cantidad límite a vender de un producto (lo usa el admin)
    actualizarLimiteVenta: (req, res) => {
        const { id } = req.params;
        const { cantidad } = req.body;
        const limite = parseInt(cantidad, 10);

        if (isNaN(limite) || limite < 0) {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        const nuevoEstado = limite > 0 ? 'activo' : 'inactivo';

        ProductoModel.actualizarLimiteVenta(id, limite, nuevoEstado, (error) => {
            if (error) {
                console.error('Error actualizando límite:', error);
                return res.status(500).json({ error: 'Error en el servidor al guardar cantidad.' });
            }

            return res.json({
                ok: true,
                limite,
                estado: nuevoEstado
            });
        });
    },

    // PATCH /api/admin/productos/estado/:id
    // Cambia el estado manual de un producto (activo/inactivo).
    // Si viene 'cantidad', actualiza también el límite de venta.
    actualizarEstadoManual: (req, res) => {
        const { id } = req.params;
        const { activo, cantidad } = req.body;
        const nuevoEstado = activo ? 'activo' : 'inactivo';

        // Si se proporciona cantidad, actualizo tanto el límite como el estado
        if (cantidad !== undefined) {
            const limite = parseInt(cantidad, 10);
            if (isNaN(limite) || limite < 0) {
                return res.status(400).json({ error: 'Cantidad inválida.' });
            }
            const estadoFinal = limite > 0 ? nuevoEstado : 'inactivo';

            ProductoModel.actualizarLimiteVenta(id, limite, estadoFinal, (error) => {
                if (error) {
                    console.error('Error actualizando estado y cantidad:', error);
                    return res.status(500).json({ error: 'Error en el servidor al cambiar estado.' });
                }
                return res.json({ ok: true, estado: estadoFinal });
            });
        } else {
            ProductoModel.actualizarEstado(id, nuevoEstado, (error) => {
                if (error) {
                    console.error('Error actualizando estado:', error);
                    return res.status(500).json({ error: 'Error en el servidor al cambiar estado.' });
                }
                return res.json({ ok: true, estado: nuevoEstado });
            });
        }
    },

    // GET /api/admin/ofertas
    // Devuelve los productos que están en oferta vigente (JSON).
    // Incluye el precio original y el final con el descuento aplicado.
    obtenerOfertasActivas: (req, res) => {
        ProductoModel.obtenerConOfertas((error, resultados) => {
            if (error) {
                console.error('Error consultando ofertas:', error);
                return res.status(500).json({ error: 'Error al consultar ofertas.' });
            }

            const lista = Array.isArray(resultados) ? resultados : [];
            const conPrecio = lista.map((producto) => {
                const oferta = calcularPrecioOferta(producto);
                return {
                    ...producto,
                    precioOriginal: oferta.precioOriginal,
                    precioFinal: oferta.precioFinal,
                    descuento: oferta.descuento,
                    enOferta: oferta.enOferta
                };
            });

            res.json(conPrecio);
        });
    },

    // PATCH /api/admin/ofertas/precio/:id
    // Cambia solo el precio de un producto (edición rápida).
    // body: { precio }
    actualizarPrecioRapido: (req, res) => {
        const { id } = req.params;
        const precio = Number(req.body.precio);

        if (isNaN(precio) || precio < 0) {
            return res.status(400).json({ error: 'Precio inválido.' });
        }

        ProductoModel.actualizarPrecio(id, precio.toFixed(2), (error) => {
            if (error) {
                console.error('Error actualizando precio:', error);
                return res.status(500).json({ error: 'Error en el servidor al guardar el precio.' });
            }

            return res.json({
                ok: true,
                mensaje: 'Precio actualizado correctamente.',
                precio: precio.toFixed(2)
            });
        });
    },

    // PATCH /api/admin/ofertas/:id
    // Guarda el descuento y las fechas de vigencia de la oferta de un producto.
    // body: { descuento, fechaInicio, fechaFin }
    actualizarOferta: (req, res) => {
        const { id } = req.params;
        const descuento = Math.min(Math.max(Number(req.body.descuento) || 0, 0), 99.99);
        const fechaInicio = req.body.fechaInicio ? new Date(req.body.fechaInicio) : null;
        const fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : null;

        // Validación de rango: si hay fechas, inicio debe ser antes de fin
        if (fechaInicio && fechaFin && !isNaN(fechaInicio.getTime()) && !isNaN(fechaFin.getTime())
            && fechaInicio > fechaFin) {
            return res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la de fin.' });
        }

        const datos = {
            descuento: descuento.toFixed(2),
            fechaInicio: fechaInicio && !isNaN(fechaInicio.getTime())
                ? fechaInicio.toISOString().slice(0, 19).replace('T', ' ')
                : null,
            fechaFin: fechaFin && !isNaN(fechaFin.getTime())
                ? fechaFin.toISOString().slice(0, 19).replace('T', ' ')
                : null
        };

        ProductoModel.actualizarOferta(id, datos, (error) => {
            if (error) {
                console.error('Error guardando oferta:', error);
                return res.status(500).json({ error: 'Error en el servidor al guardar la oferta.' });
            }

            return res.json({
                ok: true,
                mensaje: 'Oferta guardada correctamente.',
                descuento: datos.descuento
            });
        });
    }
};

module.exports = ProductoController;