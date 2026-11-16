/* ============================================= */
/* INICIO.JS - DATOS DE CADA BLOQUE DEL INICIO    */
/* ============================================= */
/* Convierte la lista de bloques guardada en lo   */
/* que pinta la vista: productos de cada bloque,  */
/* color de la categoría y fin de la oferta. Los  */
/* bloques que quedarían vacíos se omiten.        */
/* ============================================= */

const deCategoria = (productos, nombre) => productos.filter((p) => String(p.categoria || '').trim() === nombre);

// Fecha de fin futura más próxima entre los productos, en ISO, o null
function finMasProximo(productos, ahora) {
    const futuras = productos
        .map((p) => (p.fecha_fin_oferta ? new Date(p.fecha_fin_oferta) : null))
        .filter((f) => f && !Number.isNaN(f.getTime()) && f > ahora)
        .sort((a, b) => a - b);
    return futuras.length ? futuras[0].toISOString() : null;
}

// bloques: lista normalizada (utils/bloques). ctx: { pasillos, productos (activos), destacados, ofertas (vigentes, ordenadas), ahora }
function armarInicio(bloques, ctx) {
    const { pasillos = [], productos = [], destacados = [], ofertas = [], ahora = new Date() } = ctx || {};
    const vista = [];
    const categoria = (pasillo, cantidad, titulo = '') => {
        const lista = deCategoria(productos, pasillo.nombre).slice(0, cantidad);
        if (lista.length) vista.push({ tipo: 'categoria', titulo, cantidad, pasillo, productos: lista });
    };
    for (const b of bloques || []) {
        switch (b.tipo) {
        case 'categoria': {
            const pasillo = pasillos.find((p) => p.nombre === b.categoria);
            if (pasillo) categoria(pasillo, b.cantidad, b.titulo);
            break;
        }
        case 'categorias_auto':
            [...pasillos].sort((x, y) => y.total - x.total).slice(0, b.cantidad_categorias).forEach((p) => categoria(p, 8));
            break;
        case 'ofertas': {
            const lista = ofertas.slice(0, b.cantidad);
            if (lista.length) vista.push({ ...b, productos: lista, finOferta: b.con_reloj ? finMasProximo(lista, ahora) : null });
            break;
        }
        case 'destacados': {
            const lista = destacados.slice(0, b.cantidad);
            if (lista.length) vista.push({ ...b, productos: lista });
            break;
        }
        case 'carrusel': // usa ids fijos que llena main.js: solo uno por página
            if (!vista.some((x) => x.tipo === 'carrusel')) vista.push({ ...b });
            break;
        case 'portada':
            vista.push({ ...b, productos: destacados.slice(0, 3) });
            break;
        default:
            vista.push({ ...b });
        }
    }
    return vista;
}

module.exports = { armarInicio };
