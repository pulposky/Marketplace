/* ============================================= */
/* ROLES.JS - ROLES DEL PANEL DE ADMIN           */
/* ============================================= */
/* Fuente única de verdad de qué roles de la     */
/* tabla 'usuarios' (columna 'rol') pueden entrar */
/* al panel de administración. Lo usan el login,  */
/* los middlewares, los controllers y las vistas   */
/* para no repetir la lista de roles por todos    */
/* lados.                                         */
/*                                               */
/* Roles que entran al panel web:                 */
/*   Administrador, Supervisor y Promotor          */
/*   (acceso total) y Técnico (mantenimiento del  */
/*   sitio). Cajero y Facturador son del POS, no   */
/*   entran al panel.                             */
/*                                               */
/* El Técnico arregla cosas de la página sin       */
/* tocar datos sensibles: gestiona productos y     */
/* stock, precios/ofertas, imágenes (de producto   */
/* y del carrusel de portada) y destraba pedidos.  */
/* NO ve clientes, analítica ni reportes.          */
/* ============================================= */

// Quita tildes, espacios y pasa a minúsculas para que
// 'Técnico', 'tecnico ' o 'TECNICO' sean el mismo rol.
const normalizarRol = (rol) => String(rol || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Roles con acceso TOTAL al panel: secciones generales
// (productos, pedidos, ofertas, notificaciones) MÁS las
// sensibles (clientes, analítica, reportes y carrusel).
const ROLES_ADMIN = ['admin', 'supervisor', 'promotor'];

// Rol de MANTENIMIENTO del sitio: arregla la página sin tocar
// datos sensibles. Gestiona productos/stock, precios/ofertas,
// imágenes (de producto y del carrusel de portada) y destraba
// pedidos. NO gestiona clientes ni ve analítica/reportes.
const ROLES_MANTENIMIENTO = ['tecnico'];

// Roles que pueden gestionar el carrusel de la portada (imágenes):
// los de acceso total MÁS el técnico de mantenimiento.
const ROLES_CARRUSEL = [...ROLES_ADMIN, ...ROLES_MANTENIMIENTO];

// Roles que entran al panel general (acceso total y mantenimiento).
const ROLES_PANEL = [...ROLES_ADMIN, ...ROLES_MANTENIMIENTO];

// Roles que el Administrador puede asignar a un usuario del panel
// desde /admin/usuarios (crear/editar empleados). Es el mismo
// conjunto del panel: no tiene sentido crear un staff sin acceso.
const ROLES_STAFF = [...ROLES_ADMIN, ...ROLES_MANTENIMIENTO];

// Etiqueta que se guarda en la columna 'rol' de la tabla usuarios
// (la BD ya usa estos nombres: 'Administrador', 'Supervisor', etc.).
// Se usa al crear/editar personal en /admin/usuarios.
const ETIQUETAS_ROL_STAFF = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    promotor: 'Promotor',
    tecnico: 'Tecnico'
};

// Equivalencias desde el valor guardado en la BD hasta el
// rol canónico que se guarda en la sesión (req.session.usuario.role).
const EQUIVALENCIAS_ROL = {
    admin: 'admin',
    administrator: 'admin',
    administrador: 'admin',
    aprendiz: 'aprendiz',
    apprentice: 'aprendiz',
    supervisor: 'supervisor',
    promotor: 'promotor',
    tecnico: 'tecnico'
};

// Lleva cualquier variante ('Administrador', 'Técnico', 'supervisor ')
// al rol canónico ('admin', 'tecnico', 'supervisor').
const rolCanonico = (rol) => {
    const normalizado = normalizarRol(rol);
    return EQUIVALENCIAS_ROL[normalizado] || normalizado;
};

// Rol SUPERADMIN: el Administrador. Es el único que gestiona los
// permisos de los demás roles y nunca se le pueden quitar permisos.
const ROL_SUPERADMIN = 'admin';

// ¿Es el Administrador (superadmin)?
const esSuperAdmin = (rol) => rolCanonico(rol) === ROL_SUPERADMIN;

// ¿Tiene acceso total (como el Administrador)?
const esRolAdmin = (rol) => ROLES_ADMIN.includes(rolCanonico(rol));

// ¿Es el rol de mantenimiento del sitio (técnico)?
const esRolMantenimiento = (rol) => ROLES_MANTENIMIENTO.includes(rolCanonico(rol));

// ¿Puede gestionar las imágenes del carrusel de la portada?
const puedeGestionarCarrusel = (rol) => ROLES_CARRUSEL.includes(rolCanonico(rol));

// ¿Puede entrar al panel de administración?
const esRolPanel = (rol) => ROLES_PANEL.includes(rolCanonico(rol));

module.exports = {
    normalizarRol,
    rolCanonico,
    EQUIVALENCIAS_ROL,
    ROL_SUPERADMIN,
    ROLES_ADMIN,
    ROLES_MANTENIMIENTO,
    ROLES_CARRUSEL,
    ROLES_PANEL,
    ROLES_STAFF,
    ETIQUETAS_ROL_STAFF,
    esSuperAdmin,
    esRolAdmin,
    esRolMantenimiento,
    puedeGestionarCarrusel,
    esRolPanel
};
