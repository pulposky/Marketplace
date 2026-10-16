/* ============================================= */
/* PERMISOSSERVICE.JS - PERMISOS EN MEMORIA      */
/* ============================================= */
/* Mantiene en memoria (una sola vez) qué permisos */
/* tiene cada rol, para que los middlewares no      */
/* consulten la base de datos en cada petición.     */
/*                                                 */
/* Arranca con los valores por defecto para que la */
/* app funcione aunque la base de datos no esté     */
/* disponible; luego server.js llama a iniciar()    */
/* para cargar lo guardado en MySQL.                */
/* ============================================= */

const PermisosModel = require('../models/permisosModel');
const { rolCanonico, ROL_SUPERADMIN } = require('../utils/roles');
const {
    ROLES_GESTIONABLES,
    PERMISOS,
    CLAVES_PERMISO,
    esClaveValida,
    esRolGestionable,
    permisosPorDefectoDe
} = require('../utils/permisos');

// Caché: rol -> Set de claves permitidas.
let cache = new Map();
let cargadoDesdeBD = false;

// Rellena la caché con los valores por defecto de cada rol.
function cargarPorDefecto() {
    cache = new Map();
    ROLES_GESTIONABLES.forEach((rol) => {
        cache.set(rol, new Set(permisosPorDefectoDe(rol)));
    });
}

// Construye la caché a partir de las filas de la base de datos.
function construirCache(filas) {
    const nueva = new Map();
    ROLES_GESTIONABLES.forEach((rol) => nueva.set(rol, new Set()));

    (filas || []).forEach((fila) => {
        const rol = rolCanonico(fila.rol);
        const clave = String(fila.permiso || '').trim();
        if (!nueva.has(rol)) return;
        if (!esClaveValida(clave)) return;
        if (Number(fila.permitido) === 1) {
            nueva.get(rol).add(clave);
        } else {
            nueva.get(rol).delete(clave);
        }
    });

    return nueva;
}

// Carga los permisos guardados en la base de datos (se llama al arrancar).
async function iniciar() {
    try {
        await PermisosModel.asegurarTabla();
        await PermisosModel.eliminarPermisosObsoletos();
        await PermisosModel.sembrarPorDefecto();
        const filas = await PermisosModel.obtenerTodas();
        cache = construirCache(filas);
        cargadoDesdeBD = true;
        console.log('[Permisos] Permisos de roles cargados desde la base de datos.');
    } catch (error) {
        console.error('[Permisos] No se pudo leer de la BD, uso los valores por defecto:', error.message);
        cargarPorDefecto();
    }
}

// ¿El rol tiene el permiso? El Administrador siempre tiene todo.
function tienePermiso(rol, clave) {
    const canon = rolCanonico(rol);
    if (canon === ROL_SUPERADMIN) return true;
    if (!esClaveValida(clave)) return false;
    const permitidos = cache.get(canon);
    if (!permitidos) return false;
    return permitidos.has(clave);
}

// Lista de claves permitidas para un rol (el admin recibe todas).
function listaPermisosDe(rol) {
    const canon = rolCanonico(rol);
    if (canon === ROL_SUPERADMIN) return [...CLAVES_PERMISO];
    const permitidos = cache.get(canon);
    return permitidos ? [...permitidos] : [];
}

// Matriz completa para la pantalla de administración de permisos.
function obtenerMatriz() {
    const roles = [ROL_SUPERADMIN, ...ROLES_GESTIONABLES];
    const matriz = {};
    roles.forEach((rol) => {
        matriz[rol] = listaPermisosDe(rol);
    });
    return { permisos: PERMISOS, roles, matriz };
}

// Guarda los permisos que envió el Administrador.
// Recibe { <rol>: [clavesPermitidas, ...], ... }.
async function guardar(cambios) {
    const entradas = Object.entries(cambios || {});

    // Validación previa (no toco la BD si algo viene mal).
    entradas.forEach(([rolRaw, claves]) => {
        if (!esRolGestionable(rolRaw)) {
            throw new Error(`El rol "${rolRaw}" no se puede gestionar.`);
        }
        if (!Array.isArray(claves)) {
            throw new Error(`Los permisos de "${rolRaw}" deben ser una lista.`);
        }
        claves.forEach((clave) => {
            if (!esClaveValida(clave)) {
                throw new Error(`El permiso "${clave}" no existe.`);
            }
        });
    });

    // Persisto y actualizo la caché rol por rol.
    for (const [rolRaw, claves] of entradas) {
        const rol = rolCanonico(rolRaw);
        const permitidos = claves.map((c) => String(c).trim());
        const mapa = {};
        CLAVES_PERMISO.forEach((clave) => {
            mapa[clave] = permitidos.includes(clave);
        });

        await PermisosModel.guardarRol(rol, mapa);
        cache.set(rol, new Set(CLAVES_PERMISO.filter((clave) => mapa[clave])));
    }
}

// Arranco con los valores por defecto por si nadie llamó a iniciar().
cargarPorDefecto();

module.exports = {
    iniciar,
    tienePermiso,
    listaPermisosDe,
    obtenerMatriz,
    guardar,
    // Expuestos por si hacen falta en pruebas o diagnóstico.
    estaCargadoDesdeBD: () => cargadoDesdeBD
};
