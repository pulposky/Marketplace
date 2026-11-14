// =============================================
// UTILIDADES CSV
// =============================================
// Escapa una celda para CSV. Si el texto empieza con
// = + - @ tab o CR, Excel lo interpreta como fórmula
// (inyección CSV), así que le antepongo una comilla simple.
// Los números reales (typeof number) se dejan tal cual.
// =============================================

const escaparCeldaCSV = (valor) => {
    let texto = String(valor ?? '');
    if (typeof valor !== 'number' && /^[=+\-@\t\r]/.test(texto)) {
        texto = `'${texto}`;
    }
    return `"${texto.replace(/"/g, '""')}"`;
};

module.exports = { escaparCeldaCSV };
