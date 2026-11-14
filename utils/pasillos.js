/* ============================================= */
/* PASILLOS.JS - CATEGORÍAS COMO PASILLOS         */
/* ============================================= */
/* Cada categoría con productos activos es un     */
/* "pasillo": tiene número, color y total. El     */
/* orden es alfabético, así el número y el color  */
/* son los mismos en inicio, catálogo y ficha.    */
/* ============================================= */

// Tonos oscuros para que el texto blanco y el texto sobre fondo claro se lean (contraste AA)
const COLORES = ['#2f6f5e', '#b4561f', '#3b5b9a', '#9a3b6a', '#6b6414', '#5a4aa0', '#1f7488', '#a33a2c'];

// productos: lista con { categoria, estado }. Devuelve [{ numero, nombre, total, color }]
const armarPasillos = (productos) => {
    const totales = new Map();
    (Array.isArray(productos) ? productos : []).forEach((p) => {
        const nombre = String(p.categoria || '').trim();
        if (!nombre || (p.estado && p.estado !== 'activo')) return;
        totales.set(nombre, (totales.get(nombre) || 0) + 1);
    });
    return [...totales.keys()]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((nombre, i) => ({ numero: i + 1, nombre, total: totales.get(nombre), color: COLORES[i % COLORES.length] }));
};

// Pasillo de una categoría dentro de la lista, o null
const buscarPasillo = (pasillos, categoria) =>
    (pasillos || []).find((p) => p.nombre === String(categoria || '').trim()) || null;

module.exports = { COLORES, armarPasillos, buscarPasillo };
