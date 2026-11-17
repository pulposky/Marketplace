/* ============================================= */
/* ENTREGA.JS - CÓMO RECIBE EL CLIENTE EL PEDIDO */
/* ============================================= */
/* La tienda ofrece 'recoger', 'domicilio' o      */
/* 'ambos'; cada pedido queda con una sola forma. */
/* ============================================= */

const OPCIONES_TIENDA = ['recoger', 'domicilio', 'ambos'];

// Forma de entrega de un pedido según lo que ofrece la tienda y lo que pidió el cliente.
// Devuelve { entrega } o { error } (si la tienda ofrece ambas, el cliente debe elegir una).
function resolverEntrega(ofrecida, pedida) {
    const tienda = OPCIONES_TIENDA.includes(ofrecida) ? ofrecida : 'recoger';
    if (tienda !== 'ambos') return { entrega: tienda };
    if (pedida === 'recoger' || pedida === 'domicilio') return { entrega: pedida };
    return { error: 'Elige si recoges en la tienda o te lo enviamos a domicilio.' };
}

// Datos que pide un pedido a domicilio. Devuelve { datos } (texto limpio) o { error }.
const TELEFONO = /^\+?[\d\s()-]{7,20}$/;
function validarDomicilio(entrada) {
    const e = entrada || {};
    const datos = {
        direccion: String(e.direccion || '').trim(),
        telefono: String(e.telefono || '').trim(),
        indicaciones: String(e.indicaciones || '').trim()
    };
    if (/[<>]/.test(datos.direccion + datos.telefono + datos.indicaciones)) return { error: 'Los datos de envío no pueden tener < ni >.' };
    if (datos.direccion.length < 5 || datos.direccion.length > 200) return { error: 'Escribe la dirección de entrega (con barrio o referencia).' };
    if (!TELEFONO.test(datos.telefono)) return { error: 'Escribe un teléfono de contacto válido para el domiciliario.' };
    if (datos.indicaciones.length > 200) return { error: 'Las indicaciones pueden tener hasta 200 caracteres.' };
    return { datos };
}

module.exports = { OPCIONES_TIENDA, resolverEntrega, validarDomicilio };
