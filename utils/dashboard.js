/* ============================================= */
/* DASHBOARD.JS - CÁLCULOS DEL PANEL              */
/* ============================================= */
/* Funciones puras para armar los datos del       */
/* dashboard a partir de las filas de la BD.      */
/* ============================================= */

const PERIODOS = [7, 30, 90];

// Días del período pedido; cualquier otro valor cae en 30
const normalizarDias = (valor) => (PERIODOS.includes(Number(valor)) ? Number(valor) : 30);

// Fecha local en formato yyyy-mm-dd (MySQL DATE() devuelve fecha local del servidor)
const claveDia = (fecha) => {
    const d = new Date(fecha);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Serie de 'dias' días que termina hoy; los días sin filas quedan en 0.
// filas: [{ dia, ...campos }] con dia como Date o 'yyyy-mm-dd'.
const serieDiaria = (filas, dias, campos, hoy = new Date()) => {
    const porDia = new Map((filas || []).map((f) => [typeof f.dia === 'string' ? f.dia.slice(0, 10) : claveDia(f.dia), f]));
    const serie = [];
    for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
        const clave = claveDia(d);
        const fila = porDia.get(clave) || {};
        const punto = { dia: clave };
        campos.forEach((c) => { punto[c] = Number(fila[c]) || 0; });
        serie.push(punto);
    }
    return serie;
};

// Variación porcentual entre períodos; null si no hay base para comparar
const variacion = (actual, anterior) => {
    const a = Number(actual) || 0;
    const b = Number(anterior) || 0;
    if (b === 0) return null;
    return Math.round(((a - b) / b) * 1000) / 10;
};

// Las 24 horas del día con su total (las horas sin filas en 0)
const serieHoras = (filas) => {
    const porHora = new Map((filas || []).map((f) => [Number(f.hora), Number(f.total) || 0]));
    return Array.from({ length: 24 }, (_, hora) => ({ hora, total: porHora.get(hora) || 0 }));
};

module.exports = { PERIODOS, normalizarDias, claveDia, serieDiaria, variacion, serieHoras };
