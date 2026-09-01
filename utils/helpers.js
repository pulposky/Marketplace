// =============================================
// UTILIDADES COMPARTIDAS
// =============================================
// Funciones auxiliares que se usan en varios
// controllers para no repetir código.
// =============================================

// Convierte un parámetro de query string (puede venir
// como string o como array) a un array limpio de categorías.
const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

// -------------------------------------------------------------
// CÁLCULO DE PRECIO CON OFERTA
// -------------------------------------------------------------
// Aplica el descuento de un producto (porcentaje) solo si la
// oferta está vigente según sus fechas de inicio/fin.
//   - descuento <= 0            -> sin oferta
//   - fecha_inicio_oferta NULL  -> sin límite de inicio
//   - fecha_fin_oferta NULL     -> sin límite de fin
//   - ambas fechas NULL         -> oferta siempre activa
//
// Recibe el objeto producto (debe traer: precio, descuento,
// fecha_inicio_oferta, fecha_fin_oferta) y devuelve un objeto
// con el precio original, el precio final y los datos de la oferta.
const calcularPrecioOferta = (producto) => {
    const original = Number(producto && producto.precio) || 0;
    const descuento = Number(producto && producto.descuento) || 0;

    const resultadoBase = {
        precioOriginal: original,
        precioFinal: original,
        descuento: descuento > 0 ? descuento : 0,
        enOferta: false
    };

    if (descuento <= 0 || descuento >= 100) {
        return resultadoBase;
    }

    // Validamos vigencia por fechas (si vienen definidas)
    const ahora = new Date();
    const inicio = producto && producto.fecha_inicio_oferta ? new Date(producto.fecha_inicio_oferta) : null;
    const fin = producto && producto.fecha_fin_oferta ? new Date(producto.fecha_fin_oferta) : null;

    if (inicio && !isNaN(inicio.getTime()) && ahora < inicio) return resultadoBase;
    if (fin && !isNaN(fin.getTime()) && ahora > fin) return resultadoBase;

    return {
        precioOriginal: original,
        precioFinal: Number((original * (1 - descuento / 100)).toFixed(2)),
        descuento,
        enOferta: true
    };
};

module.exports = { normalizarCategorias, calcularPrecioOferta };