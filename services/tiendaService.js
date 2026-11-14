/* ============================================= */
/* TIENDASERVICE.JS - CONFIGURACIÓN DE LA TIENDA  */
/* ============================================= */
/* Mantiene en memoria la configuración del        */
/* negocio (nombre, logo, colores, contacto,       */
/* moneda, expiración de apartados...) para que    */
/* las vistas no consulten la BD en cada petición. */
/* Arranca con valores por defecto; server.js      */
/* llama a iniciar() para cargar lo guardado.      */
/* ============================================= */

const TiendaModel = require('../models/tiendaModel');
const { esTipoValido } = require('../utils/tipoNegocio');

const POR_DEFECTO = Object.freeze({
    nombre: 'Mi Tienda',
    eslogan: '',
    descripcion: '',
    logo_url: null,
    color_primario: '#1F7A4D',
    color_secundario: '#F2A33A',
    telefono: '',
    whatsapp: '',
    correo: '',
    direccion: '',
    horario: '',
    moneda: 'COP',
    minutos_expiracion_apartado: 60,
    facebook: '',
    instagram: '',
    tiktok: '',
    productos_ocultos: 'COMODIN',
    tipo_negocio: 'supermercado'
});

let actual = { ...POR_DEFECTO };

// Reglas por campo: [longitud máxima, validador opcional]
const HEX = /^#[0-9a-fA-F]{6}$/;
const URL_RED = /^https:\/\/[^\s<>"']+$/;
const TELEFONO = /^\+?[\d\s()-]{7,20}$/;
const CORREO = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const SIN_HTML = (v) => !/[<>]/.test(v);
const REGLAS = {
    nombre: [100, (v) => v.length > 0 && SIN_HTML(v)],
    eslogan: [200, SIN_HTML],
    descripcion: [500, SIN_HTML],
    color_primario: [7, (v) => HEX.test(v)],
    color_secundario: [7, (v) => HEX.test(v)],
    telefono: [30, (v) => v === '' || TELEFONO.test(v)],
    whatsapp: [30, (v) => v === '' || TELEFONO.test(v)],
    correo: [120, (v) => v === '' || CORREO.test(v)],
    direccion: [200, SIN_HTML],
    horario: [200, SIN_HTML],
    moneda: [3, (v) => /^[A-Z]{3}$/.test(v)],
    facebook: [255, (v) => v === '' || URL_RED.test(v)],
    instagram: [255, (v) => v === '' || URL_RED.test(v)],
    tiktok: [255, (v) => v === '' || URL_RED.test(v)],
    productos_ocultos: [500, SIN_HTML],
    tipo_negocio: [20, esTipoValido]
};

// Valida y normaliza lo que llega del panel. Solo devuelve los campos
// presentes; ignora cualquier otro (mass assignment).
// Devuelve { datos } o { error }.
function validarConfiguracion(entrada) {
    const datos = {};
    for (const [campo, [max, valido]] of Object.entries(REGLAS)) {
        if (entrada[campo] === undefined) continue;
        let valor = String(entrada[campo] ?? '').trim();
        if (campo === 'moneda') valor = valor.toUpperCase();
        if (valor.length > max || (valido && !valido(valor))) {
            return { error: `El campo "${campo}" no es válido.` };
        }
        datos[campo] = valor;
    }
    if (entrada.minutos_expiracion_apartado !== undefined) {
        const minutos = Number(entrada.minutos_expiracion_apartado);
        if (!Number.isInteger(minutos) || minutos < 5 || minutos > 10080) {
            return { error: 'El tiempo de expiración debe ser un número entero entre 5 y 10080 minutos.' };
        }
        datos.minutos_expiracion_apartado = minutos;
    }
    return { datos };
}

// Mezcla una fila de la BD con los valores por defecto.
function normalizar(fila) {
    const resultado = { ...POR_DEFECTO };
    if (!fila) return resultado;
    Object.keys(POR_DEFECTO).forEach((clave) => {
        if (fila[clave] !== undefined && fila[clave] !== null) resultado[clave] = fila[clave];
    });
    resultado.minutos_expiracion_apartado = Number(resultado.minutos_expiracion_apartado) || POR_DEFECTO.minutos_expiracion_apartado;
    return resultado;
}

async function recargar() {
    actual = normalizar(await TiendaModel.obtener());
    return actual;
}

// Crea la tabla si falta y carga la configuración. No lanza errores.
async function iniciar() {
    try {
        await TiendaModel.asegurarTabla();
        await recargar();
        console.log('[Tienda] Configuración de la tienda cargada.');
    } catch (error) {
        console.error('[Tienda] No se pudo cargar la configuración; uso valores por defecto:', error.message);
    }
}

// Guarda cambios ya validados y refresca la caché.
async function guardar(datos) {
    await TiendaModel.actualizar(datos);
    return recargar();
}

// Copia de la configuración actual (segura para las vistas).
const obtener = () => ({ ...actual });

// Nombres de productos internos (p. ej. el comodín del POS) que no
// se muestran en la tienda web.
const productosOcultos = () => String(actual.productos_ocultos || '')
    .split(',').map((s) => s.trim()).filter(Boolean);

const minutosExpiracion = () => Number(actual.minutos_expiracion_apartado) || POR_DEFECTO.minutos_expiracion_apartado;

module.exports = {
    POR_DEFECTO,
    iniciar,
    recargar,
    guardar,
    obtener,
    productosOcultos,
    minutosExpiracion,
    validarConfiguracion,
    normalizar
};
