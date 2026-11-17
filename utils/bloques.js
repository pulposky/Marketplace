/* ============================================= */
/* BLOQUES.JS - INICIO DE LA TIENDA POR BLOQUES   */
/* ============================================= */
/* El dueño arma el inicio con una lista ordenada */
/* de bloques de tipos fijos. Se guarda como JSON */
/* en configuracion_tienda.bloques_inicio; aquí   */
/* se valida (lista blanca) y se completa con los */
/* textos por defecto.                            */
/* ============================================= */

const MAX_BLOQUES = 20;
const RE_IMAGEN = /^\/img\/upload\/tienda\/[\w-]+\.(jpg|png|webp)$/;
// Ruta interna (/catalogo, /producto/3) o https://; nunca //otro.com ni javascript:
const RE_ENLACE = /^(\/(?!\/)[^\s<>"]*|https:\/\/[^\s<>"]+)$/;

const PASOS_DEFECTO = Object.freeze([
    { titulo: 'Elige', texto: 'Busca o entra por categoría y escoge la presentación que necesitas.' },
    { titulo: 'Agrega al carrito', texto: 'Suma todo lo que necesites en un solo pedido.' },
    { titulo: 'Haz tu pedido', texto: 'Con tu cuenta, en un clic. Te avisamos cuando lo confirmemos.' },
    { titulo: 'Recíbelo', texto: 'Según lo que ofrezca la tienda, lo recoges o te llega a casa. Pagas al recibir.' },
]);

const texto = (max, defecto = '') => ({ clase: 'texto', max, defecto });
const entero = (min, max, defecto) => ({ clase: 'entero', min, max, defecto });

// tipo -> { nombre (para el panel), campos }
const TIPOS_BLOQUE = Object.freeze({
    portada: { nombre: 'Portada', campos: { titulo: texto(80), texto: texto(280), texto_boton: texto(40), enlace_boton: { clase: 'enlace', defecto: '/catalogo' }, imagen: { clase: 'imagen' } } },
    ofertas: { nombre: 'Ofertas', campos: { titulo: texto(80, 'Ofertas de la semana'), cantidad: entero(4, 12, 6), con_reloj: { clase: 'bool', defecto: true } } },
    categoria: { nombre: 'Una categoría', campos: { categoria: { clase: 'categoria' }, titulo: texto(80), cantidad: entero(4, 16, 8) } },
    categorias_auto: { nombre: 'Categorías principales', campos: { cantidad_categorias: entero(0, 8, 4) } },
    destacados: { nombre: 'Destacados', campos: { titulo: texto(80), cantidad: entero(4, 12, 6) } },
    banner: { nombre: 'Banner con imagen', campos: { imagen: { clase: 'imagen', requerido: true }, titulo: texto(80), texto: texto(280), texto_boton: texto(40), enlace: { clase: 'enlace', defecto: '' } } },
    carrusel: { nombre: 'Carrusel de avisos', campos: {} },
    pasos: { nombre: 'Cómo comprar', campos: { titulo: texto(80, 'Cómo comprar'), pasos: { clase: 'pasos' } } },
    texto: { nombre: 'Texto', campos: { titulo: texto(80), texto: texto(280) } },
});

const tiene = (obj, clave) => Object.prototype.hasOwnProperty.call(obj, clave);
const limpiarTexto = (valor, max) => {
    const v = String(valor ?? '').trim();
    return v.length > max || /[<>]/.test(v) ? null : v;
};

// Un campo: devuelve { valor } o { error }
function validarCampo(nombre, regla, entrada) {
    const dado = entrada[nombre];
    if (dado === undefined || (dado === '' && regla.clase !== 'texto')) {
        if (regla.requerido || regla.clase === 'categoria') return { error: `Falta "${nombre}".` };
        if (regla.clase === 'pasos') return { valor: PASOS_DEFECTO.map((p) => ({ ...p })) };
        return { valor: regla.defecto ?? '' };
    }
    switch (regla.clase) {
    case 'texto': {
        const v = limpiarTexto(dado, regla.max);
        return v === null ? { error: `"${nombre}" admite hasta ${regla.max} caracteres, sin < ni >.` } : { valor: v };
    }
    case 'entero': {
        const n = Number(dado);
        return Number.isInteger(n) && n >= regla.min && n <= regla.max ? { valor: n } : { error: `"${nombre}" debe ser de ${regla.min} a ${regla.max}.` };
    }
    case 'bool':
        return typeof dado === 'boolean' ? { valor: dado } : { error: `"${nombre}" debe ser sí o no.` };
    case 'enlace': {
        const v = String(dado).trim();
        return v.length <= 200 && RE_ENLACE.test(v) ? { valor: v } : { error: 'El enlace debe empezar por / o por https://' };
    }
    case 'imagen':
        return RE_IMAGEN.test(String(dado)) ? { valor: String(dado) } : { error: 'La imagen no es válida; súbela de nuevo.' };
    case 'categoria': {
        const v = limpiarTexto(dado, 60);
        return v ? { valor: v } : { error: 'Elige una categoría.' };
    }
    case 'pasos': {
        if (!Array.isArray(dado) || dado.length > 4) return { error: 'Los pasos no son válidos.' };
        const pasos = [];
        for (let i = 0; i < 4; i++) {
            const p = dado[i] && typeof dado[i] === 'object' ? dado[i] : PASOS_DEFECTO[i];
            const titulo = limpiarTexto(p.titulo, 40);
            const txt = limpiarTexto(p.texto, 160);
            if (titulo === null || txt === null) return { error: 'Cada paso admite un título de 40 y un texto de 160 caracteres, sin < ni >.' };
            pasos.push({ titulo: titulo || PASOS_DEFECTO[i].titulo, texto: txt });
        }
        return { valor: pasos };
    }
    default:
        return { error: 'Campo desconocido.' };
    }
}

function validarBloque(entrada) {
    if (!entrada || typeof entrada !== 'object' || !tiene(TIPOS_BLOQUE, entrada.tipo)) return { error: 'Tipo de bloque desconocido.' };
    const bloque = { tipo: entrada.tipo };
    for (const [nombre, regla] of Object.entries(TIPOS_BLOQUE[entrada.tipo].campos)) {
        const { valor, error } = validarCampo(nombre, regla, entrada);
        if (error) return { error: `${TIPOS_BLOQUE[entrada.tipo].nombre}: ${error}` };
        bloque[nombre] = valor;
    }
    return { datos: bloque };
}

// Valida lo que envía el panel. Devuelve { datos } o { error }.
function validarBloques(entrada) {
    if (!Array.isArray(entrada)) return { error: 'Los bloques del inicio no son válidos.' };
    if (entrada.length > MAX_BLOQUES) return { error: `El inicio admite hasta ${MAX_BLOQUES} bloques.` };
    const datos = [];
    for (const b of entrada) {
        const r = validarBloque(b);
        if (r.error) return r;
        datos.push(r.datos);
    }
    return { datos };
}

// El inicio de antes de los bloques, armado con la apariencia guardada
function bloquesPorDefecto(apariencia) {
    const ap = apariencia || {};
    const lista = [{ tipo: 'portada', texto_boton: ap.texto_boton_portada || '' }];
    lista.push({ tipo: 'carrusel' });
    if (ap.mostrar_ofertas !== false) lista.push({ tipo: 'ofertas' });
    if (ap.mostrar_destacados !== false) lista.push({ tipo: 'destacados' });
    lista.push({ tipo: 'categorias_auto', cantidad_categorias: Number.isInteger(ap.secciones_inicio) ? ap.secciones_inicio : 4 });
    if (ap.mostrar_pasos !== false) lista.push({ tipo: 'pasos' });
    return lista.map((b) => validarBloque(b).datos);
}

// JSON guardado (o nada) -> lista; sin guardar o roto = inicio por defecto; lo inválido se descarta
function normalizarBloques(valor, apariencia) {
    let crudo = valor;
    if (typeof valor === 'string') {
        try { crudo = JSON.parse(valor); } catch (e) { crudo = null; }
    }
    if (!Array.isArray(crudo)) return bloquesPorDefecto(apariencia);
    return crudo.slice(0, MAX_BLOQUES).map((b) => validarBloque(b).datos).filter(Boolean);
}

module.exports = { TIPOS_BLOQUE, MAX_BLOQUES, PASOS_DEFECTO, validarBloques, normalizarBloques, bloquesPorDefecto };
