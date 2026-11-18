/* ============================================= */
/* CARRITOCONTROLLER.JS - CARRITO DE COMPRAS     */
/* ============================================= */
/* Cliente con sesión: carrito en la BD          */
/* (carrito_items). Visitante: en su sesión del  */
/* servidor; al iniciar sesión se pasa a la BD.  */
/* Precio y stock salen siempre de la BD.        */
/* ============================================= */

const CarritoModel = require('../models/carritoModel');
const PresentacionModel = require('../models/presentacionModel');
const tiendaService = require('../services/tiendaService');
const { leerLinea, aplicar } = require('../utils/carrito');
const { calcularPrecioOferta } = require('../utils/helpers');
const { idClienteDeSesion } = require('../utils/apartados');
const { asociarImagenesAProductos } = require('../utils/imagenes');
const { nombreUnidad } = require('../utils/presentaciones');

const conImagenes = (productos) => new Promise((resuelta) => asociarImagenesAProductos(productos, resuelta));

// Líneas del dueño del carrito (cliente en BD o visitante en sesión)
async function leerLineas(req) {
    const idCliente = idClienteDeSesion(req.session.usuario);
    if (idCliente) return CarritoModel.lineas(idCliente);
    return Array.isArray(req.session.carrito) ? req.session.carrito : [];
}

// Aplica el cambio de una línea y lo guarda donde corresponde
async function guardarCambio(req, lineas, linea, modo) {
    const nuevas = aplicar(lineas, linea, modo);
    const idCliente = idClienteDeSesion(req.session.usuario);
    if (idCliente) {
        const resultado = nuevas.find((l) => l.idProducto === linea.idProducto && l.idPresentacion === linea.idPresentacion);
        await CarritoModel.fijarLinea(idCliente, { ...linea, cantidad: resultado ? resultado.cantidad : 0 });
    } else {
        req.session.carrito = nuevas;
    }
    return nuevas;
}

// Detalle de cada línea con datos actuales. Las que ya no se pueden comprar
// (producto oculto/inactivo, presentación retirada) salen con disponible = false.
async function detallar(lineas) {
    const ocultos = new Set(tiendaService.productosOcultos());
    const datos = await CarritoModel.productos([...new Set(lineas.map((l) => l.idProducto))]);
    await PresentacionModel.adjuntar(datos);
    const productos = await conImagenes(datos); // devuelve copias con imagenUpload
    const porId = new Map(productos.map((p) => [Number(p.id_producto), p]));

    const items = lineas.map((l) => {
        const p = porId.get(l.idProducto);
        const base = { productoId: l.idProducto, presentacionId: l.idPresentacion || null, cantidad: l.cantidad };
        if (!p || p.estado !== 'activo' || ocultos.has(p.nombre)) return { ...base, nombre: p ? p.nombre : 'Producto', disponible: false };
        const pres = l.idPresentacion ? p.presentaciones.find((x) => Number(x.id) === l.idPresentacion) : null;
        if ((l.idPresentacion && !pres) || (!l.idPresentacion && p.presentaciones.length)) {
            return { ...base, nombre: p.nombre, disponible: false };
        }
        const factor = pres ? Number(pres.factor) || 1 : 1;
        const limite = Math.floor((Number(p.limite_venta) || 0) / factor);
        return {
            ...base,
            nombre: p.nombre,
            presentacion: pres ? pres.nombre : null,
            unidad: pres ? pres.nombre : nombreUnidad(p.unidad),
            imagen: p.imagenUpload || null,
            precio: calcularPrecioOferta(p).precioFinal * factor,
            limite,
            disponible: limite > 0
        };
    });
    const validos = items.filter((i) => i.disponible);
    return {
        items,
        cantidad: validos.reduce((s, i) => s + Math.min(i.cantidad, i.limite), 0),
        total: validos.reduce((s, i) => s + Math.min(i.cantidad, i.limite) * i.precio, 0)
    };
}

const responderError = (res, error) => {
    console.error('[Carrito]', error);
    res.status(500).json({ error: 'No se pudo actualizar el carrito.' });
};

// Cambio de una línea: 'sumar' (agregar al carrito) o 'fijar' (cantidad en /carrito)
const cambiar = (modo) => async (req, res) => {
    const { linea, error } = leerLinea(req.body);
    if (error) return res.status(400).json({ error });
    try {
        const lineas = await leerLineas(req);
        let aviso = null;
        if (linea.cantidad > 0) {
            const [item] = (await detallar([linea])).items;
            if (!item.disponible) return res.status(400).json({ error: 'Este producto no está disponible ahora.' });
            // Cantidad final de la línea, sin pasar del stock
            const actual = (lineas.find((l) => l.idProducto === linea.idProducto && l.idPresentacion === linea.idPresentacion) || {}).cantidad || 0;
            const deseada = modo === 'sumar' ? actual + linea.cantidad : linea.cantidad;
            linea.cantidad = Math.min(deseada, item.limite);
            if (deseada > item.limite) aviso = `Solo hay ${item.limite} disponibles.`;
        }
        await guardarCambio(req, lineas, linea, 'fijar');
        res.json({ ...(await detallar(await leerLineas(req))), aviso });
    } catch (e) { responderError(res, e); }
};

const CarritoController = {
    // GET /api/carrito
    obtener: async (req, res) => {
        try { res.json(await detallar(await leerLineas(req))); } catch (e) { responderError(res, e); }
    },
    // POST /api/carrito  { productoId, presentacionId?, cantidad }
    agregar: cambiar('sumar'),
    // PUT /api/carrito   { productoId, presentacionId?, cantidad }  (0 = quitar)
    fijar: cambiar('fijar'),

    // Unidades en el carrito, para el contador del encabezado
    contar: async (req) => {
        const idCliente = idClienteDeSesion(req.session && req.session.usuario);
        if (idCliente) return CarritoModel.contar(idCliente);
        return (Array.isArray(req.session && req.session.carrito) ? req.session.carrito : []).reduce((s, l) => s + l.cantidad, 0);
    },

    // Al iniciar sesión: el carrito del visitante se suma al guardado del cliente
    fusionar: async (idCliente, lineasVisitante) => {
        if (!idCliente || !Array.isArray(lineasVisitante) || !lineasVisitante.length) return;
        let lineas = await CarritoModel.lineas(idCliente);
        for (const linea of lineasVisitante) {
            lineas = aplicar(lineas, linea, 'sumar');
            const r = lineas.find((l) => l.idProducto === linea.idProducto && l.idPresentacion === linea.idPresentacion);
            if (r) await CarritoModel.fijarLinea(idCliente, r);
        }
    },

    // Líneas para el pedido (solo las disponibles, sin pasar del stock) y vaciado tras pedir
    paraPedido: async (idCliente) => {
        const { items } = await detallar(await CarritoModel.lineas(idCliente));
        return items.filter((i) => i.disponible && i.cantidad > 0)
            .map((i) => ({ productoId: i.productoId, presentacionId: i.presentacionId || undefined, cantidad: Math.min(i.cantidad, i.limite) }));
    },
    vaciar: (idCliente) => CarritoModel.vaciar(idCliente)
};

module.exports = CarritoController;
