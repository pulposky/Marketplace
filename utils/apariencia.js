/* ============================================= */
/* APARIENCIA.JS - PERSONALIZACIÓN DE LA TIENDA   */
/* ============================================= */
/* Opciones visuales que el admin cambia desde    */
/* Configuración de la tienda. Se guardan como    */
/* JSON en configuracion_tienda.apariencia; aquí  */
/* se validan (lista blanca) y se completan con   */
/* los valores por defecto.                       */
/* ============================================= */

const TIPOGRAFIAS = Object.freeze({
    moderna: { nombre: 'Moderna', titulo: '"Bricolage Grotesque"', texto: '"Instrument Sans"',
        google: 'family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400;500;600;700' },
    clasica: { nombre: 'Clásica', titulo: '"Fraunces"', texto: '"Source Sans 3"',
        google: 'family=Fraunces:opsz,wght@9..144,500..800&family=Source+Sans+3:wght@400;500;600;700' },
    redondeada: { nombre: 'Redondeada', titulo: '"Nunito"', texto: '"Nunito"',
        google: 'family=Nunito:wght@400;600;700;800' },
    simple: { nombre: 'Simple (la del dispositivo)', titulo: 'system-ui', texto: 'system-ui', google: '' },
});

const ESQUINAS = Object.freeze({ redondeadas: 'Redondeadas', rectas: 'Rectas' });
const STOCK = Object.freeze({ auto: 'Según el tipo de negocio', si: 'Sí, mostrar', no: 'No mostrar' });

const POR_DEFECTO = Object.freeze({
    anuncio_activo: false,
    anuncio: '',
    texto_boton_portada: '',
    mostrar_beneficios: true,
    mostrar_ofertas: true,
    mostrar_destacados: true,
    mostrar_pasos: true,
    secciones_inicio: 4,
    nombre_seccion: '',
    mostrar_stock: 'auto',
    tipografia: 'moderna',
    esquinas: 'redondeadas',
});

const BOOLEANOS = ['anuncio_activo', 'mostrar_beneficios', 'mostrar_ofertas', 'mostrar_destacados', 'mostrar_pasos'];
const TEXTOS = { anuncio: 140, texto_boton_portada: 40, nombre_seccion: 30 };
const OPCIONES = { mostrar_stock: STOCK, tipografia: TIPOGRAFIAS, esquinas: ESQUINAS };

const tiene = (obj, clave) => Object.prototype.hasOwnProperty.call(obj, clave);

// Valida lo que envía el panel. Devuelve { datos } completo o { error }.
function validarApariencia(entrada) {
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return { error: 'La apariencia no es válida.' };
    const datos = { ...POR_DEFECTO };
    for (const clave of BOOLEANOS) {
        if (entrada[clave] === undefined) continue;
        if (typeof entrada[clave] !== 'boolean') return { error: `"${clave}" debe ser sí o no.` };
        datos[clave] = entrada[clave];
    }
    for (const [clave, max] of Object.entries(TEXTOS)) {
        if (entrada[clave] === undefined) continue;
        const valor = String(entrada[clave] ?? '').trim();
        if (valor.length > max || /[<>]/.test(valor)) return { error: `"${clave}" admite hasta ${max} caracteres, sin < ni >.` };
        datos[clave] = valor;
    }
    for (const [clave, lista] of Object.entries(OPCIONES)) {
        if (entrada[clave] === undefined) continue;
        if (!tiene(lista, entrada[clave])) return { error: `Elige una opción válida para "${clave}".` };
        datos[clave] = entrada[clave];
    }
    if (entrada.secciones_inicio !== undefined) {
        const n = Number(entrada.secciones_inicio);
        if (!Number.isInteger(n) || n < 0 || n > 8) return { error: 'Las categorías del inicio deben ser de 0 a 8.' };
        datos.secciones_inicio = n;
    }
    return { datos };
}

// JSON guardado (o nada) -> objeto completo; lo inválido vuelve al valor por defecto
function normalizarApariencia(valor) {
    let crudo = valor;
    if (typeof valor === 'string') {
        try { crudo = JSON.parse(valor); } catch (e) { crudo = {}; }
    }
    if (!crudo || typeof crudo !== 'object') return { ...POR_DEFECTO };
    const resultado = { ...POR_DEFECTO };
    for (const clave of Object.keys(POR_DEFECTO)) {
        if (crudo[clave] === undefined) continue;
        const { datos } = validarApariencia({ [clave]: crudo[clave] });
        if (datos) resultado[clave] = datos[clave];
    }
    return resultado;
}

// Plural sencillo en español: Góndola -> Góndolas, Estante -> Estantes, Sección -> Secciones
const plural = (palabra) => {
    if (/[aeiouáéó]$/i.test(palabra)) return `${palabra}s`;
    if (/ón$/i.test(palabra)) return `${palabra.slice(0, -2)}ones`;
    return `${palabra}es`;
};

// Ajusta el vocabulario del tipo de negocio con lo que eligió el admin
function aplicarApariencia(vocab, apariencia) {
    const resultado = { ...vocab };
    if (apariencia.nombre_seccion) {
        resultado.seccion = apariencia.nombre_seccion;
        resultado.secciones = plural(apariencia.nombre_seccion);
    }
    if (apariencia.mostrar_stock !== 'auto') resultado.mostrarStock = apariencia.mostrar_stock === 'si';
    return resultado;
}

// Lo que necesita la hoja de estilos: fuentes de Google (si aplica) y radio de esquinas
function estiloApariencia(apariencia) {
    const tip = TIPOGRAFIAS[apariencia.tipografia] || TIPOGRAFIAS[POR_DEFECTO.tipografia];
    return { google: tip.google, titulo: tip.titulo, texto: tip.texto, radio: apariencia.esquinas === 'rectas' ? '2px' : '10px' };
}

module.exports = { TIPOGRAFIAS, ESQUINAS, STOCK, POR_DEFECTO, validarApariencia, normalizarApariencia, aplicarApariencia, estiloApariencia, plural };
