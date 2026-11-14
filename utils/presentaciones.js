/* ============================================= */
/* PRESENTACIONES.JS - FORMAS DE VENTA           */
/* ============================================= */
/* Funciones puras para las presentaciones de un  */
/* producto (ej. "Caja" = 12 unidades). El stock  */
/* siempre está en la unidad mínima; el factor    */
/* dice cuántas unidades mínimas trae cada una.   */
/* ============================================= */

const MAX_PRESENTACIONES = 10;
const MAX_FACTOR = 100000;

// Valida la lista que envía el admin. Devuelve { datos } con la lista
// limpia ({ nombre, factor, orden }) o { error } con el motivo.
const validarPresentaciones = (lista) => {
    if (!Array.isArray(lista)) return { error: 'Las presentaciones deben ser una lista.' };
    if (lista.length > MAX_PRESENTACIONES) {
        return { error: `Máximo ${MAX_PRESENTACIONES} presentaciones por producto.` };
    }

    const vistos = new Set();
    const datos = [];
    for (let i = 0; i < lista.length; i += 1) {
        const item = lista[i] || {};
        const nombre = String(item.nombre == null ? '' : item.nombre).trim();
        if (!nombre || nombre.length > 50) return { error: `Presentación ${i + 1}: el nombre debe tener entre 1 y 50 caracteres.` };
        if (/[<>]/.test(nombre)) return { error: `Presentación ${i + 1}: el nombre no puede tener < ni >.` };

        const clave = nombre.toLowerCase();
        if (vistos.has(clave)) return { error: `La presentación "${nombre}" está repetida.` };
        vistos.add(clave);

        const factor = Number(item.factor);
        if (!Number.isInteger(factor) || factor < 1 || factor > MAX_FACTOR) {
            return { error: `Presentación "${nombre}": el factor debe ser un entero entre 1 y ${MAX_FACTOR}.` };
        }
        datos.push({ nombre, factor, orden: i });
    }
    return { datos };
};

// Unidades mínimas que equivalen a 'cantidad' de una presentación de 'factor'.
// Devuelve null si alguno no es un entero positivo o el resultado no es seguro.
const calcularUnidades = (cantidad, factor = 1) => {
    const c = Number(cantidad);
    const f = Number(factor);
    if (!Number.isInteger(c) || c <= 0 || !Number.isInteger(f) || f <= 0) return null;
    const unidades = c * f;
    return Number.isSafeInteger(unidades) ? unidades : null;
};

// Texto legible de una cantidad apartada, para notificaciones y mensajes:
//   con presentación: "2 Caja(s) (24 unidades)"
//   sin presentación: "3 kg"
const describir = (cantidadUnidades, unidad, presentacion) => {
    const unidades = Number(cantidadUnidades) || 0;
    const textoUnidad = String(unidad || '').trim() || 'unidad(es)';
    const factor = presentacion ? Number(presentacion.factor) : 0;
    if (presentacion && presentacion.nombre && factor > 0) {
        const cantidad = Math.floor(unidades / factor);
        return `${cantidad} ${presentacion.nombre}(s) (${unidades} ${textoUnidad})`;
    }
    return `${unidades} ${textoUnidad}`;
};

module.exports = { MAX_PRESENTACIONES, MAX_FACTOR, validarPresentaciones, calcularUnidades, describir };
