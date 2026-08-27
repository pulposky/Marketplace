// =============================================
// CONTROLADOR DE APARTADOS
// =============================================
// Todo el ciclo de vida de un apartado:
// el cliente lo crea, el admin lo confirma o
// entrega, y cualquiera puede cancelarlo.
//
// Maneja la conversión de cubetas de huevos
// (cada cubeta = 30 unidades) para productos
// que son huevo.
// =============================================

const ProductoModel = require('../models/productoModel');
const ApartadoModel = require('../models/apartadoModel');
const NotificacionModel = require('../models/notificacionModel');

const ApartadoController = {

    // POST /api/apartar-producto
    // Crea un apartado nuevo cuando un cliente reserva un producto.
    // Valida stock, descuenta unidades, crea notificación para admin.
    apartarProducto: (req, res) => {
        // Primero verifico que esté logueado
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Debe iniciar sesión para apartar un producto.' });
        }

        const { productoId, cantidad } = req.body;

        if (!productoId || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para apartar.' });
        }

        const cantidadIngresada = parseInt(cantidad, 10);
        if (Number.isNaN(cantidadIngresada) || cantidadIngresada <= 0) {
            return res.status(400).json({ error: 'Cantidad inválida.' });
        }

        // 1. Busco el producto para verificar que exista y tenga stock
        ProductoModel.obtenerPorId(productoId, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado.' });
            }

            const producto = resultados[0];

            // Detecto si es huevo para convertir cubetas a unidades (x30)
            const esHuevo = producto.es_huevo || (producto.nombre && producto.nombre.toLowerCase().includes('huevo'));

            // Si el cliente envió cubetas, multiplico por 30 para tener las unidades reales
            const unidadesARestar = esHuevo ? cantidadIngresada * 30 : cantidadIngresada;

            const stockDisponible = producto.limite_venta || 0;

            // Verifico que haya suficiente stock y que el producto esté activo
            if (producto.estado !== 'activo' || stockDisponible < unidadesARestar) {
                return res.status(400).json({
                    error: esHuevo
                        ? `No hay suficientes cubetas disponibles. Stock actual: ${Math.floor(stockDisponible / 30)} cubeta(s).`
                        : 'El producto está inactivo o no tiene cupo disponible para la venta.'
                });
            }

            const nuevoLimite = stockDisponible - unidadesARestar;
            const nuevoEstado = nuevoLimite > 0 ? 'activo' : 'inactivo';

            const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

            // Preparo los datos para insertar en la tabla de apartados
            const datosApartado = {
                nombreCliente,
                producto: productoId,
                cantidad: unidadesARestar
            };

            // 2. Creo el registro del apartado en la BD
            ApartadoModel.crearApartado(datosApartado, (errorApartado, resultado) => {
                if (errorApartado) {
                    console.error('Error al registrar apartado:', errorApartado);
                    return res.status(500).json({ error: 'Error al procesar el apartado en la BD.' });
                }

                // Creo la notificación para que el admin se entere del nuevo apartado
                const cantidadMostrar = esHuevo ? Math.floor(unidadesARestar / 30) : unidadesARestar;
                const unidadMostrar = esHuevo ? 'cubeta(s)' : (producto.unidad || 'unidad(es)');
                NotificacionModel.crearNotificacion({
                    titulo: 'Nuevo apartado',
                    mensaje: `${nombreCliente} apartó ${cantidadMostrar} ${unidadMostrar} de ${producto.nombre}`
                }, () => {});

                // 3. Actualizo el stock del producto y si llega a 0 lo deshabilito
                ProductoModel.actualizarLimiteVenta(productoId, nuevoLimite, nuevoEstado, (errorUpdate) => {
                    if (errorUpdate) {
                        console.error('Error actualizando límite tras apartado:', errorUpdate);
                    }

                    return res.status(200).json({
                        mensaje: '¡Producto apartado con éxito!',
                        idInsertado: resultado.insertId,
                        unidadesRestantes: nuevoLimite,
                        cubetasRestantes: esHuevo ? Math.floor(nuevoLimite / 30) : undefined,
                        estado: nuevoEstado
                    });
                });
            });
        });
    },

    // GET /api/admin/apartados
    // Trae los apartados para el panel admin.
    // Acepta ?estado= pendiente | confirmado | entregado | cancelado | historial | activos
    obtenerApartadosAdmin: (req, res) => {
        const estado = String(req.query.estado || 'todos').trim();

        ApartadoModel.obtenerTodosApartados(estado, (error, apartados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar apartados.' });
            }
            res.json(Array.isArray(apartados) ? apartados : []);
        });
    },

    // PATCH /api/admin/apartados/confirmar/:id
    // Confirma un apartado pendiente (cambia estado a "confirmado")
    confirmarApartado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida.' });
        }

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        ApartadoModel.confirmarApartado(id, (error) => {
            if (error) {
                console.error('Error al confirmar apartado:', error);
                return res.status(500).json({ error: 'Error al confirmar el apartado.' });
            }
            return res.status(200).json({ mensaje: 'Pedido confirmado correctamente.' });
        });
    },

    // PATCH /api/admin/apartados/entregado/:id
    // Marca un pedido como "entregado" (fin del ciclo).
    // Solo aplica a pedidos pendientes o confirmados;
    // no toca el stock porque ya se descontó al apartar.
    marcarEntregado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida.' });
        }

        // Validación de rol para las APIs del admin
        const rolSesion = String(req.session.usuario.role || '').trim().toLowerCase();
        if (rolSesion !== 'admin' && rolSesion !== 'aprendiz') {
            return res.status(403).json({ error: 'No tienes permisos para entregar pedidos.' });
        }

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        ApartadoModel.marcarEntregado(id, (error, resultado) => {
            if (error) {
                console.error('Error al marcar entregado:', error);
                return res.status(500).json({ error: 'Error al marcar el pedido como entregado.' });
            }

            // Si no afectó ninguna fila es porque el pedido ya estaba cancelado o entregado
            if (!resultado || resultado.affectedRows === 0) {
                return res.status(400).json({ error: 'Solo se pueden entregar pedidos pendientes o confirmados.' });
            }

            return res.status(200).json({ mensaje: 'Pedido marcado como entregado correctamente.' });
        });
    },

    // PATCH /api/admin/apartados/cancelar/:id
    // Cancela un apartado desde el admin (devuelve el stock al producto)
    cancelarApartadoAdmin: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida.' });
        }

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        // Primero busco el apartado para saber cuánto stock devolver
        ApartadoModel.obtenerApartadoPorId(id, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Apartado no encontrado.' });
            }

            const apartado = resultados[0];

            // Cambio el estado a cancelado
            ApartadoModel.cancelarApartadoAdmin(id, (errCancel) => {
                if (errCancel) {
                    console.error('Error al cancelar apartado:', errCancel);
                    return res.status(500).json({ error: 'Error al cancelar el apartado.' });
                }

                // Devuelvo las unidades al stock del producto
                ProductoModel.devolverStockProducto(apartado.producto, apartado.cantidad, (errStock) => {
                    if (errStock) {
                        console.error('Error devolviendo stock:', errStock);
                        return res.status(200).json({ mensaje: 'Pedido cancelado, pero hubo un detalle al restaurar el stock.' });
                    }
                    return res.status(200).json({ mensaje: 'Pedido cancelado y stock devuelto correctamente.' });
                });
            });
        });
    },

    // POST /api/apartados/cancelar/:idApartado
    // Cancela un apartado desde el cliente (solo los suyos propios).
    // Se usa UPDATE para que aparezca en el historial con cancelado_por = 'cliente'
    cancelarApartado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida o expirada.' });
        }

        const { idApartado } = req.params;

        if (!idApartado) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        // Busco el apartado para saber el producto y la cantidad que hay que devolver
        ApartadoModel.obtenerApartadoPorId(idApartado, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Apartado no encontrado.' });
            }

            const apartado = resultados[0];

            // Cambio el estado a cancelado con cancelado_por = 'cliente'
            ApartadoModel.cancelarApartadoCliente(idApartado, (errCancel) => {
                if (errCancel) {
                    console.error('Error al cancelar apartado del cliente:', errCancel);
                    return res.status(500).json({ error: 'Error al cancelar el apartado en la BD.' });
                }

                // Devuelvo las unidades exactas al stock del producto
                ProductoModel.devolverStockProducto(apartado.producto, apartado.cantidad, (errUpdate) => {
                    if (errUpdate) {
                        console.error('Error devolviendo stock del producto:', errUpdate);
                        return res.status(200).json({
                            mensaje: 'Apartado cancelado, pero hubo un detalle al restaurar el stock.',
                            idApartado
                        });
                    }

                    return res.status(200).json({
                        mensaje: 'Apartado cancelado y stock devuelto correctamente.',
                        idApartado
                    });
                });
            });
        });
    }
};

module.exports = ApartadoController;