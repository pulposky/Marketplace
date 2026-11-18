/* ============================================= */
/* LISTADOS.JS - FILTRAR Y PAGINAR PRODUCTOS      */
/* ============================================= */
/* Con miles de productos, el servidor filtra y    */
/* manda solo una página; el navegador ya no carga */
/* la lista completa. Lo usan el catálogo y el     */
/* panel (Productos, Ofertas).                     */
/* ============================================= */

const { coincideBusqueda } = require('./helpers');

// Corta la lista en la página pedida (las páginas fuera de rango se ajustan a la primera/última).
const paginar = (lista, paginaPedida, porPagina) => {
    const total = lista.length;
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const pagina = Math.min(Math.max(1, parseInt(paginaPedida, 10) || 1), totalPaginas);
    return { items: lista.slice((pagina - 1) * porPagina, pagina * porPagina), pagina, totalPaginas, total };
};

// Lee los filtros del panel desde la URL (?q=&categoria=&estado=&stock=&oferta=1) dejando solo valores válidos.
const leerFiltrosAdmin = (query = {}) => ({
    q: String(query.q || '').trim().slice(0, 100),
    categoria: String(query.categoria || '').trim(),
    estado: ['activo', 'inactivo'].includes(query.estado) ? query.estado : '',
    stock: ['agotado', 'bajo', 'con'].includes(query.stock) ? query.stock : '',
    oferta: query.oferta === '1',
});

// Aplica los filtros del panel. "bajo" = entre 1 y 10 unidades; "oferta" = tiene descuento guardado.
const filtrarProductosAdmin = (lista, { q, categoria, estado, stock, oferta }) => lista.filter((p) => {
    const cantidad = Number(p.limite_venta) || 0;
    return (!q || coincideBusqueda(p, q))
        && (!categoria || p.categoria === categoria)
        && (!estado || p.estado === estado)
        && (!stock || (stock === 'agotado' ? cantidad <= 0 : stock === 'bajo' ? cantidad > 0 && cantidad <= 10 : cantidad > 0))
        && (!oferta || (Number(p.descuento) || 0) > 0);
});

// Categorías presentes en la lista, sin repetir y en orden alfabético (para el filtro).
const categoriasDe = (lista) => [...new Set(lista.map((p) => String(p.categoria || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));

module.exports = { paginar, leerFiltrosAdmin, filtrarProductosAdmin, categoriasDe };
