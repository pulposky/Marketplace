/* ============================================= */
/* APARTADO CONTROLLER - Ciclo de vida de        */
/* apartados: crear, confirmar, entregar,        */
/* cancelar (individual y por lote).             */
/* ============================================= */
// =============================================
// CONTROLADOR DE APARTADOS
// =============================================
// Todo el ciclo de vida de un apartado:
// el cliente lo crea (uno solo o en lote desde el carrito),
// el admin lo confirma o entrega, y cualquiera puede cancelarlo.
//
// La cantidad puede venir en una presentación del
// producto (ej. "Caja" = 12 unidades): se convierte
// a unidades mínimas, que es como se guarda el stock.
// =============================================

const ProductoModel = require('../models/productoModel');
const ApartadoModel = require('../models/apartadoModel');
const NotificacionModel = require('../models/notificacionModel');
const NotificacionClienteModel = require('../models/notificacionClienteModel');
const auditoriaService = require('../services/auditoriaService');
const { calcularPrecioOferta } = require('../utils/helpers');
const { esRolPanel } = require('../utils/roles');
const { idClienteDeSesion, esDuenoApartado } = require('../utils/apartados');
const PresentacionModel = require('../models/presentacionModel');
const { calcularUnidades, describir } = require('../utils/presentaciones');
const { resolverEntrega, validarDomicilio } = require('../utils/entrega');
const tiendaService = require('../services/tiendaService');

// Convierte la cantidad pedida a unidades mínimas según la presentación
// (opcional). La presentación debe ser del mismo producto y estar activa.
// Devuelve { unidades, presentacion } o { error } (siempre 400).
const resolverCantidad = async (idProducto, cantidad, presentacionId) => {
    const sinPresentacion = presentacionId === undefined || presentacionId === null || presentacionId === '';
    let presentacion = null;
    if (sinPresentacion) {
        // Con presentaciones definidas el producto solo se vende en ellas
        const mapa = await PresentacionModel.listarPorProductos([idProducto]);
        if ((mapa.get(Number(idProducto)) || []).length) return { error: 'Elige una presentación para este producto.' };
    } else {
        const idPresentacion = Number(presentacionId);
        if (!Number.isInteger(idPresentacion) || idPresentacion <= 0) {
            return { error: 'Presentación inválida.' };
        }
        presentacion = await PresentacionModel.obtenerDeProducto(idProducto, idPresentacion);
        if (!presentacion) return { error: 'La presentación no pertenece a este producto.' };
    }
    const unidades = calcularUnidades(cantidad, presentacion ? presentacion.factor : 1);
    if (unidades === null) return { error: 'Cantidad inválida.' };
    return { unidades, presentacion };
};

const ApartadoController = {

    // POST /api/apartar-producto
    // Crea un apartado nuevo cuando un cliente reserva un producto.
    // Valida stock, descuenta unidades, crea notificación para admin.
    apartarProducto: (req, res) => {
        // Primero verifico que esté logueado
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Debes iniciar sesión para hacer un pedido.' });
        }

        const { productoId, cantidad, presentacionId } = req.body;
        const { entrega, error: errorEntrega } = resolverEntrega(tiendaService.obtener().entrega, req.body.entrega);
        if (errorEntrega) return res.status(400).json({ error: errorEntrega });
        const envio = entrega === 'domicilio' ? validarDomicilio(req.body.domicilio) : { datos: null };
        if (envio.error) return res.status(400).json({ error: envio.error });
        const domicilio = envio.datos;

        if (!productoId || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos obligatorios del pedido.' });
        }

        const idProducto = Number(productoId);
        const cantidadIngresada = Number(cantidad);
        if (!Number.isInteger(idProducto) || idProducto <= 0
            || !Number.isInteger(cantidadIngresada) || cantidadIngresada <= 0) {
            return res.status(400).json({ error: 'Cantidad inválida.' });
        }

        // 1. Busco el producto para verificar que exista y tenga stock
        ProductoModel.obtenerPorId(idProducto, async (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado.' });
            }

            const producto = resultados[0];

            // Convierto la cantidad (en la presentación elegida) a unidades mínimas
            let resuelto;
            try {
                resuelto = await resolverCantidad(idProducto, cantidadIngresada, presentacionId);
            } catch (errorPresentacion) {
                console.error('Error consultando presentación:', errorPresentacion);
                return res.status(500).json({ error: 'Error al consultar el producto.' });
            }
            if (resuelto.error) {
                return res.status(400).json({ error: resuelto.error });
            }
            const { unidades: unidadesARestar, presentacion } = resuelto;

            const stockDisponible = Number(producto.limite_venta) || 0;

            // Verifico que haya suficiente stock y que el producto esté activo
            if (producto.estado !== 'activo' || stockDisponible < unidadesARestar) {
                return res.status(400).json({
                    error: producto.estado !== 'activo'
                        ? 'El producto está inactivo o no tiene cupo disponible para la venta.'
                        : `No hay suficiente stock disponible. Stock actual: ${describir(stockDisponible, producto.unidad)}.`
                });
            }

            const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

            // Calculo el precio por unidad mínima (el total = unidades × precio)
            // aplicando el descuento si la oferta está vigente. Se guarda el
            // precio con descuento al momento de apartar para que el total no
            // cambie retroactivamente si la oferta se modifica después.
            const precioOferta = calcularPrecioOferta(producto);
            const precioAplicado = precioOferta.precioFinal;

            // Preparo los datos para insertar en la tabla de apartados
            const datosApartado = {
                nombreCliente,
                idCliente: idClienteDeSesion(req.session.usuario),
                producto: idProducto,
                cantidad: unidadesARestar,
                precioAplicado,
                presentacionNombre: presentacion ? presentacion.nombre : null,
                presentacionFactor: presentacion ? presentacion.factor : null,
                entrega,
                domicilio
            };

            // 2. Creo el registro del apartado en la BD
            ApartadoModel.crearApartado(datosApartado, (errorApartado, resultado) => {
                if (errorApartado) {
                    console.error('Error al registrar apartado:', errorApartado);
                    return res.status(500).json({ error: 'No se pudo registrar el pedido.' });
                }

                // Creo la notificación para que el admin se entere del nuevo apartado
                const textoCantidad = describir(unidadesARestar, producto.unidad, presentacion);
                NotificacionModel.crearNotificacion({
                    titulo: 'Nuevo pedido',
                    mensaje: `${nombreCliente} pidió ${textoCantidad} de ${producto.nombre} (${entrega === 'domicilio' ? 'domicilio' : 'recoge en tienda'})`
                }, () => {});

                // Notifico al cliente que su apartado quedó creado
                NotificacionClienteModel.crear(
                    req.session.usuario.id,
                    'Pedido recibido',
                    `Recibimos tu pedido de ${producto.nombre} (${textoCantidad}). Te avisaremos cuando lo confirmemos.`,
                    () => {}
                );

                // El descuento es atómico (WHERE limite_venta >= ?): si otro cliente
                // tomó el stock, affectedRows = 0 y se cancela el apartado recién creado.
                ProductoModel.restarLimiteVenta(idProducto, unidadesARestar, (errorUpdate, resultadoUpdate) => {
                    if (errorUpdate) {
                        console.error('Error actualizando límite tras apartado:', errorUpdate);
                        return res.status(500).json({ error: 'Error al actualizar el stock del producto.' });
                    }

                    if (!resultadoUpdate || resultadoUpdate.affectedRows === 0) {
                        // No había stock: cancelo el apartado que acabé de crear
                        ApartadoModel.cancelarApartadoCliente(resultado.insertId, () => {});
                        return res.status(400).json({
                            error: 'El producto ya no tiene stock disponible. Otro usuario lo tomó primero.'
                        });
                    }

                    return res.status(200).json({
                        mensaje: '¡Pedido recibido!',
                        idInsertado: resultado.insertId,
                        unidadesRestantes: stockDisponible - unidadesARestar,
                        estado: (stockDisponible - unidadesARestar) > 0 ? 'activo' : 'inactivo'
                    });
                });
            });
        });
    },

    // POST /api/apartar-lote
    // Aparta varios productos a la vez (lo usa el carrito).
    // Valida que todos los productos existan, estén activos y tengan
    // stock suficiente ANTES de escribir nada; luego crea un apartado
    // por ítem y descuenta el stock de cada uno.
    apartarLote: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Debes iniciar sesión para hacer un pedido.' });
        }

        const { items } = req.body;
        const { entrega, error: errorEntrega } = resolverEntrega(tiendaService.obtener().entrega, req.body.entrega);
        if (errorEntrega) return res.status(400).json({ error: errorEntrega });
        const envio = entrega === 'domicilio' ? validarDomicilio(req.body.domicilio) : { datos: null };
        if (envio.error) return res.status(400).json({ error: envio.error });
        const domicilio = envio.datos;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }
        if (items.length > 50) {
            return res.status(400).json({ error: 'Demasiados productos en el carrito.' });
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        // 1. Valido TODOS los ítems antes de escribir nada en la BD
        const detalles = [];
        let indice = 0;

        const validarSiguiente = (cbFinal) => {
            if (indice >= items.length) {
                return cbFinal(null, detalles);
            }

            const item = items[indice];
            const idProducto = Number(item && item.productoId);
            const cantidad = Number(item && item.cantidad);

            if (!Number.isInteger(idProducto) || !Number.isInteger(cantidad) || cantidad <= 0) {
                return cbFinal({ mensaje: 'Cantidad inválida en el carrito.', estado: 400 });
            }

            ProductoModel.obtenerPorId(idProducto, async (err, resultados) => {
                if (err) {
                    return cbFinal({ mensaje: 'Error al consultar los productos.', estado: 500 });
                }
                if (!resultados || resultados.length === 0) {
                    return cbFinal({ mensaje: 'Uno de los productos ya no existe.', estado: 400 });
                }

                const producto = resultados[0];
                let resuelto;
                try {
                    resuelto = await resolverCantidad(idProducto, cantidad, item.presentacionId);
                } catch (errorPresentacion) {
                    console.error('Error consultando presentación del lote:', errorPresentacion);
                    return cbFinal({ mensaje: 'Error al consultar los productos.', estado: 500 });
                }
                if (resuelto.error) {
                    return cbFinal({ mensaje: `"${producto.nombre}": ${resuelto.error}`, estado: 400 });
                }
                const { unidades: unidadesARestar, presentacion } = resuelto;
                const stockDisponible = Number(producto.limite_venta) || 0;

                if (producto.estado !== 'activo' || stockDisponible < unidadesARestar) {
                    return cbFinal({
                        mensaje: `Sin stock suficiente para "${producto.nombre}".`,
                        estado: 400
                    });
                }

                const precioAplicado = calcularPrecioOferta(producto).precioFinal;

                detalles.push({
                    nombreCliente,
                    idCliente: idClienteDeSesion(req.session.usuario),
                    producto: idProducto,
                    cantidad: unidadesARestar,
                    precioAplicado,
                    presentacionNombre: presentacion ? presentacion.nombre : null,
                    presentacionFactor: presentacion ? presentacion.factor : null,
                    entrega,
                    domicilio,
                    nombreProducto: producto.nombre
                });

                indice += 1;
                validarSiguiente(cbFinal);
            });
        };

        validarSiguiente((errorValidacion, listaValidada) => {
            if (errorValidacion) {
                return res.status(errorValidacion.estado || 400).json({ error: errorValidacion.mensaje });
            }

            // 2. Creo un apartado por ítem y descuento stock (mismo patrón que apartado simple)
            const idsCreados = [];
            const detallesCreados = [];
            let pos = 0;

            const crearSiguiente = () => {
                if (pos >= listaValidada.length) {
                    // 3. Notifico al admin del lote nuevo
                    const totalUnidades = listaValidada.reduce((suma, d) => suma + d.cantidad, 0);
                    NotificacionModel.crearNotificacion({
                        titulo: 'Nuevo pedido',
                        mensaje: `${nombreCliente} hizo un pedido de ${listaValidada.length} producto(s) (${entrega === 'domicilio' ? 'domicilio' : 'recoge en tienda'}).`
                    }, () => {});

                    // Notifico al cliente que sus apartados quedaron creados
                    NotificacionClienteModel.crear(
                        req.session.usuario.id,
                        'Pedido recibido',
                        `Recibimos tu pedido de ${listaValidada.length} producto(s). Te avisaremos cuando lo confirmemos.`,
                        () => {}
                    );

                    return res.status(200).json({
                        mensaje: '¡Pedido recibido!',
                        ids: idsCreados,
                        total: listaValidada.length
                    });
                }

                const detalle = listaValidada[pos];

                ApartadoModel.crearApartado(detalle, (errorApartado, resultado) => {
                    if (errorApartado) {
                        console.error('Error al registrar apartado del lote:', errorApartado);
                        // Revierto los apartados que ya se crearon antes del error
                        idsCreados.forEach((idCreado, i) => {
                            ApartadoModel.cancelarApartadoCliente(idCreado, () => {});
                            ProductoModel.devolverStockProducto(detallesCreados[i].producto, detallesCreados[i].cantidad, () => {});
                        });
                        return res.status(500).json({
                            error: 'Error al procesar el carrito en la BD.',
                            creados: idsCreados.length
                        });
                    }

                    idsCreados.push(resultado.insertId);
                    detallesCreados.push(detalle);

                    ProductoModel.restarLimiteVenta(detalle.producto, detalle.cantidad, (errorUpdate, resultadoUpdate) => {
                        if (errorUpdate) {
                            console.error('Error actualizando límite tras lote:', errorUpdate);
                            // Revierto lo creado; el último ítem no alcanzó a descontar stock
                            idsCreados.forEach((idCreado, i) => {
                                ApartadoModel.cancelarApartadoCliente(idCreado, () => {});
                                if (i < idsCreados.length - 1) {
                                    ProductoModel.devolverStockProducto(detallesCreados[i].producto, detallesCreados[i].cantidad, () => {});
                                }
                            });
                            return res.status(500).json({
                                error: 'Error al actualizar el stock. Intenta de nuevo.',
                                creados: idsCreados.length
                            });
                        }

                        if (!resultadoUpdate || resultadoUpdate.affectedRows === 0) {
                            // Sin stock: revierto todo lo creado en este lote
                            idsCreados.forEach((idCreado, i) => {
                                ApartadoModel.cancelarApartadoCliente(idCreado, () => {});
                                // El último ítem (el que falló) no descontó stock: no se devuelve
                                if (i < idsCreados.length - 1) {
                                    ProductoModel.devolverStockProducto(detallesCreados[i].producto, detallesCreados[i].cantidad, () => {});
                                }
                            });
                            return res.status(400).json({
                                error: `Sin stock suficiente para "${detalle.nombreProducto}". Otro usuario tomó el stock primero.`
                            });
                        }

                        pos += 1;
                        crearSiguiente();
                    });
                });
            };

            crearSiguiente();
        });
    },

    // Notifica al cliente dueño de un apartado usando su nombre
    // (la tabla apartados guarda el nombre como texto, no el id).
    notificarClientePorApartado: (idApartado, titulo, mensaje) => {
        ApartadoModel.obtenerApartadoPorId(idApartado, (err, resultados) => {
            if (err || !resultados || resultados.length === 0) {
                return;
            }

            const apartado = resultados[0];
            if (apartado.id_cliente) {
                return NotificacionClienteModel.crear(apartado.id_cliente, titulo, mensaje, () => {});
            }
            // Apartados antiguos sin id_cliente: se ubica al cliente por nombre
            NotificacionClienteModel.buscarClientePorNombre(apartado.nombre_cliente, (errCli, registros) => {
                if (errCli || !registros || registros.length === 0) {
                    return;
                }
                NotificacionClienteModel.crear(registros[0].id_cliente, titulo, mensaje, () => {});
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
        const nombreAdmin = req.session.usuario.nombre || req.session.usuario.usuario || 'Admin';

        if (!id) {
            return res.status(400).json({ error: 'ID de apartado no proporcionado.' });
        }

        ApartadoModel.confirmarApartado(id, nombreAdmin, (error, resultado) => {
            if (error) {
                console.error('Error al confirmar apartado:', error);
                return res.status(500).json({ error: 'Error al confirmar el apartado.' });
            }
            if (!resultado || resultado.affectedRows === 0) {
                return res.status(409).json({ error: 'Solo se pueden confirmar pedidos pendientes.' });
            }
            ApartadoController.notificarClientePorApartado(
                id,
                'Pedido confirmado',
                `Tu pedido #${id} fue confirmado y lo estamos preparando.`
            );
            auditoriaService.registrar(req, 'pedido_confirmar', `Confirmó el apartado #${id} (${nombreAdmin}).`);
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
        if (!esRolPanel(rolSesion)) {
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

            ApartadoController.notificarClientePorApartado(
                id,
                'Pedido entregado',
                `Tu pedido #${id} fue entregado. ¡Gracias por comprar con nosotros!`
            );
            auditoriaService.registrar(req, 'pedido_entregar', `Marcó como entregado el apartado #${id}.`);
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
            ApartadoModel.cancelarApartadoAdmin(id, (errCancel, resultadoCancel) => {
                if (errCancel) {
                    console.error('Error al cancelar apartado:', errCancel);
                    return res.status(500).json({ error: 'Error al cancelar el apartado.' });
                }
                if (!resultadoCancel || resultadoCancel.affectedRows === 0) {
                    return res.status(409).json({ error: 'El pedido ya estaba cancelado o entregado.' });
                }

                ApartadoController.notificarClientePorApartado(
                    id,
                    'Pedido cancelado',
                    `Tu pedido #${id} fue cancelado por la tienda.`
                );

                // Devuelvo las unidades al stock del producto
                ProductoModel.devolverStockProducto(apartado.producto, apartado.cantidad, (errStock) => {
                    if (errStock) {
                        console.error('Error devolviendo stock:', errStock);
                        return res.status(200).json({ mensaje: 'Pedido cancelado, pero hubo un detalle al restaurar el stock.' });
                    }
                    auditoriaService.registrar(req, 'pedido_cancelar', `Canceló el apartado #${id} y devolvió el stock.`);
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

            // Verifico que el apartado pertenezca al cliente logueado
            // (o que sea del panel admin). Evita cancelar apartados ajenos.
            const usuarioSesion = req.session.usuario;
            const rolSesion = String(usuarioSesion.role || '').trim().toLowerCase();
            const esPropietario = esDuenoApartado(apartado, usuarioSesion);
            const esStaff = esRolPanel(rolSesion);

            if (!esPropietario && !esStaff) {
                return res.status(403).json({ error: 'No puedes cancelar un apartado que no es tuyo.' });
            }

            // Cambio el estado a cancelado con cancelado_por = 'cliente'
            ApartadoModel.cancelarApartadoCliente(idApartado, (errCancel, resultadoCancel) => {
                if (errCancel) {
                    console.error('Error al cancelar apartado del cliente:', errCancel);
                    return res.status(500).json({ error: 'Error al cancelar el apartado en la BD.' });
                }
                if (!resultadoCancel || resultadoCancel.affectedRows === 0) {
                    return res.status(409).json({ error: 'El apartado ya estaba cancelado o entregado.' });
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