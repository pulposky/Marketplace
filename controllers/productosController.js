const ProductoModel = require('../model/productoModel');

const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ProductoController = {
    // Devuelve los productos en formato JSON; opcionalmente filtra por categoría.
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

    // Registra un apartado y descuenta de la cantidad temporal. Deshabilita si llega a 0.
    apartarProducto: (req, res) => {
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

        // 1. Verificar existencia y cupo disponible
        ProductoModel.obtenerPorId(productoId, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado.' });
            }

            const producto = resultados[0];

            // Determinar si el producto es huevo para realizar la conversión a unidades reales
            const esHuevo = producto.es_huevo || (producto.nombre && producto.nombre.toLowerCase().includes('huevo'));
            
            // Si el cliente envía la cantidad en cubetas, convertimos a unidades de huevos (* 30)
            const unidadesARestar = esHuevo ? cantidadIngresada * 30 : cantidadIngresada;

            const stockDisponible = producto.limite_venta || 0;

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
            
            // Se registra en la tabla de apartados la cantidad exacta en unidades de BD
            const datosApartado = {
                nombreCliente,
                producto: productoId,
                cantidad: unidadesARestar
            };

            // 2. Crear el registro de apartado
            ProductoModel.crearApartado(datosApartado, (errorApartado, resultado) => {
                if (errorApartado) {
                    console.error('Error al registrar apartado:', errorApartado);
                    return res.status(500).json({ error: 'Error al procesar el apartado en la BD.' });
                }

                // 3. Descontar cupo temporal y auto-deshabilitar si es necesario
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

    // Actualiza la cantidad temporal a vender (Admin)
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

    // Alterna manualmente el switch activo / inactivo (Admin)
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

    // Obtiene y renderiza la vista de apartados solo para el usuario en sesión
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

    cancelarApartado: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Sesión no válida o expirada.' });
        }

        const { idApartado } = req.params;

        if (!idApartado) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        // Obtener la información del apartado para saber el id del producto y la cantidad
        ProductoModel.obtenerApartadoPorId(idApartado, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Apartado no encontrado.' });
            }

            const apartado = resultados[0];

            // Eliminar el apartado
            ProductoModel.eliminarApartado(idApartado, (errDelete) => {
                if (errDelete) {
                    console.error('Error al eliminar apartado:', errDelete);
                    return res.status(500).json({ error: 'Error al cancelar el apartado en la BD.' });
                }

                // Devolver el stock/cupo en unidades exactas al producto
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