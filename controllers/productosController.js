// =============================================
// CONTROLADOR DE PRODUCTOS Y APARTADOS
// =============================================
// Contiene toda la lógica para:
//   - Listar productos (con filtro por categoría)
//   - Crear apartados (con validación de stock)
//   - Actualizar límite de venta y estado
//   - Confirmar/cancelar apartados
//   - Cancelar apartados del cliente
//
// Maneja la conversión de cubetas de huevos
// (cada cubeta = 30 unidades) para productos
// que son huevo.
// =============================================

const ProductoModel = require('../model/productoModel');

// Convierte categorías de query string a array limpio
const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ProductoController = {

    // Devuelve todos los productos como JSON
    // Opcionalmente filtra por categoría si viene el query param ?categoria=xxx
    obtenerTodos: (req, res) => {
        const categorias = normalizarCategorias(req.query.categoria || req.query.categorias);

        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }

            const productosFiltrados = categorias.length > 0
                ? resultados.filter((producto) => categorias.includes(producto.categoria))
                : resultados;

            res.json(productosFiltrados);
        });
    },

    // Crea un apartado nuevo cuando un cliente reserva un producto
    // Valida stock, descuenta unidades, crea notificación para admin
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
            ProductoModel.crearApartado(datosApartado, (errorApartado, resultado) => {
                if (errorApartado) {
                    console.error('Error al registrar apartado:', errorApartado);
                    return res.status(500).json({ error: 'Error al procesar el apartado en la BD.' });
                }

                // Creo la notificación para que el admin se entere del nuevo apartado
                const cantidadMostrar = esHuevo ? Math.floor(unidadesARestar / 30) : unidadesARestar;
                const unidadMostrar = esHuevo ? 'cubeta(s)' : (producto.unidad || 'unidad(es)');
                ProductoModel.crearNotificacion({
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

    // Cambia el estado manual de un producto (activo/inactivo)
    actualizarEstadoManual: (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;
        const nuevoEstado = activo ? 'activo' : 'inactivo';

        ProductoModel.actualizarEstado(id, nuevoEstado, (error) => {
            if (error) {
                console.error('Error actualizando estado:', error);
                return res.status(500).json({ error: 'Error en el servidor al cambiar estado.' });
            }

            return res.json({
                ok: true,
                estado: nuevoEstado
            });
        });
    },

    // Obtiene los apartados del cliente que está en sesión
    // Lo usa la vista "verApartados" del cliente
    obtenerApartadosCliente: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/login');
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        ProductoModel.obtenerApartadosPorCliente(nombreCliente, (error, apartados) => {
            if (error) {
                console.error('Error al obtener apartados del cliente:', error);
                return res.status(500).render('error', { mensaje: 'Error al consultar tus apartados.' });
            }

            res.render('verApartados', { apartados });
        });
    },

    // Confirma un apartado pendiente (cambia estado a "confirmado")
    confirmarApartado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida.' });
        }

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        ProductoModel.confirmarApartado(id, (error) => {
            if (error) {
                console.error('Error al confirmar apartado:', error);
                return res.status(500).json({ error: 'Error al confirmar el apartado.' });
            }
            return res.status(200).json({ mensaje: 'Pedido confirmado correctamente.' });
        });
    },

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
        ProductoModel.obtenerApartadoPorId(id, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Apartado no encontrado.' });
            }

            const apartado = resultados[0];

            // Cambio el estado a cancelado
            ProductoModel.cancelarApartadoAdmin(id, (errCancel) => {
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

    // Cancela un apartado desde el cliente
    // El cliente solo puede cancelar los suyos propios
    cancelarApartado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida o expirada.' });
        }

        const { idApartado } = req.params;

        if (!idApartado) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        // Busco el apartado para saber el producto y la cantidad que hay que devolver
        ProductoModel.obtenerApartadoPorId(idApartado, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Apartado no encontrado.' });
            }

            const apartado = resultados[0];

            // Elimino el registro del apartado
            ProductoModel.eliminarApartado(idApartado, (errDelete) => {
                if (errDelete) {
                    console.error('Error al eliminar apartado:', errDelete);
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

module.exports = ProductoController;
