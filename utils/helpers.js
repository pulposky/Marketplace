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

module.exports = { normalizarCategorias };