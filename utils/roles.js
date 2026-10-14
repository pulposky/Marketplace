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
/*   Administrador, Supervisor, Promotor, Técnico */
/*   y Aprendiz (acceso básico).                  */
/*   Cajero es del POS, no entra al panel.        */
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
// exclusivas del admin (clientes, analítica, carrusel, reportes).
const ROLES_ADMIN = ['admin', 'supervisor', 'promotor', 'tecnico'];

// Roles que entran al panel general (el aprendiz gestiona
// productos, pedidos y ofertas, pero no las secciones exclusivas).
const ROLES_PANEL = [...ROLES_ADMIN, 'aprendiz'];

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

// ¿Tiene acceso total (como el Administrador)?
const esRolAdmin = (rol) => ROLES_ADMIN.includes(rolCanonico(rol));

// ¿Puede entrar al panel de administración?
const esRolPanel = (rol) => ROLES_PANEL.includes(rolCanonico(rol));

module.exports = {
    normalizarRol,
    rolCanonico,
    EQUIVALENCIAS_ROL,
    ROLES_ADMIN,
    ROLES_PANEL,
    esRolAdmin,
    esRolPanel
};
