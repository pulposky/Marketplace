/* ============================================= */
/* CARRITO.JS - LÍNEAS DEL CARRITO (PURAS)       */
/* ============================================= */
/* Una línea = producto + presentación (0 = la   */
/* unidad mínima). Se usan con el carrito de la  */
/* sesión (visitante) y para validar lo que llega*/
/* del navegador antes de tocar la BD.           */
/* ============================================= */

const MAX_LINEAS = 50;
const MAX_CANTIDAD = 9999;

// Datos de una línea desde la petición; { linea } o { error }
function leerLinea(entrada) {
    const e = entrada || {};
    const idProducto = Number(e.productoId);
    const idPresentacion = e.presentacionId ? Number(e.presentacionId) : 0;
    const cantidad = Number(e.cantidad);
    if (!Number.isInteger(idProducto) || idProducto <= 0 || !Number.isInteger(idPresentacion) || idPresentacion < 0) {
        return { error: 'Producto no válido.' };
    }
    if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > MAX_CANTIDAD) return { error: 'Cantidad no válida.' };
    return { linea: { idProducto, idPresentacion, cantidad } };
}

const mismaLinea = (a, b) => a.idProducto === b.idProducto && a.idPresentacion === b.idPresentacion;

// Suma (modo 'sumar') o fija (modo 'fijar') la cantidad de una línea; 0 la quita.
// Devuelve una lista nueva; no pasa de MAX_LINEAS líneas.
function aplicar(lista, linea, modo) {
    const nueva = (Array.isArray(lista) ? lista : []).map((l) => ({ ...l }));
    const existente = nueva.find((l) => mismaLinea(l, linea));
    const cantidad = Math.min(MAX_CANTIDAD, (modo === 'sumar' && existente ? existente.cantidad : 0) + linea.cantidad);
    if (existente) existente.cantidad = cantidad;
    else if (cantidad > 0 && nueva.length < MAX_LINEAS) nueva.push({ ...linea, cantidad });
    return nueva.filter((l) => l.cantidad > 0);
}

module.exports = { MAX_LINEAS, MAX_CANTIDAD, leerLinea, aplicar };
