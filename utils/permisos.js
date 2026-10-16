/* ============================================= */
/* PERMISOS.JS - CATÁLOGO DE PERMISOS DEL PANEL  */
/* ============================================= */
/* Fuente única de verdad de los permisos que el  */
/* Administrador (superadmin) puede dar o quitar  */
/* a los demás roles del panel.                   */
/*                                               */
/* Cada permiso equivale a un módulo del panel.   */
/* El Administrador siempre tiene todos y es el   */
/* único que administra esta matriz; aquí solo se */
/* declaran las claves, sus nombres y los valores */
/* por defecto de cada rol.                       */
/* ============================================= */

const { ROL_SUPERADMIN, rolCanonico } = require('./roles');

// Roles a los que el Administrador puede dar/quitar permisos.
// El Administrador (superadmin) NO aparece: siempre tiene todo.
const ROLES_GESTIONABLES = ['supervisor', 'promotor', 'tecnico'];

// Catálogo de permisos: cada uno es un módulo del panel.
// Primero los módulos "de contenido" y al final los de administración.
const PERMISOS = [
    { clave: 'productos', nombre: 'Productos', descripcion: 'Catálogo, stock y disponibilidad de productos.' },
    { clave: 'ofertas', nombre: 'Ofertas', descripcion: 'Precios, descuentos y fechas de vigencia.' },
    { clave: 'pedidos', nombre: 'Pedidos', descripcion: 'Confirmar, entregar y cancelar pedidos, e historial.' },
    { clave: 'carrusel', nombre: 'Carrusel', descripcion: 'Imágenes del carrusel de la portada.' },
    { clave: 'clientes', nombre: 'Clientes', descripcion: 'Consultar y editar los datos de los clientes.' },
    { clave: 'analitica', nombre: 'Analítica', descripcion: 'Estadísticas, gráficos y reportes CSV.' },
    { clave: 'categorias', nombre: 'Categorías', descripcion: 'Crear, renombrar y eliminar categorías de productos.' },
    { clave: 'respaldo', nombre: 'Respaldo y exportación', descripcion: 'Descargar los datos del sistema en CSV o JSON.' },
    { clave: 'usuarios', nombre: 'Usuarios', descripcion: 'Crear, editar, activar/desactivar y asignar rol al personal del panel.' },
    { clave: 'auditoria', nombre: 'Auditoría', descripcion: 'Registro de quién hizo qué en el panel.' }
];

// Lista plana de claves válidas (para validar lo que llega del frontend).
const CLAVES_PERMISO = PERMISOS.map((p) => p.clave);

// Permisos por defecto de cada rol gestionable. Reproducen el
// comportamiento que ya tenía el panel antes de existir este módulo.
//
// OJO: 'usuarios', 'respaldo' y 'auditoria' NO van por defecto en ningún rol
// (son sensibles: el Administrador los concede a mano desde /admin/permisos).
const PERMISOS_POR_DEFECTO = {
    supervisor: ['productos', 'ofertas', 'pedidos', 'carrusel', 'clientes', 'analitica', 'categorias'],
    promotor: ['productos', 'ofertas', 'pedidos', 'carrusel', 'clientes', 'analitica', 'categorias'],
    tecnico: ['productos', 'ofertas', 'pedidos', 'carrusel']
};

// ¿La clave es un permiso que existe?
const esClaveValida = (clave) => CLAVES_PERMISO.includes(String(clave || '').trim());

// ¿El rol se puede gestionar (dar/quitar permisos)?
const esRolGestionable = (rol) => ROLES_GESTIONABLES.includes(rolCanonico(rol));

// Copia de los permisos por defecto de un rol (el admin recibe todos).
const permisosPorDefectoDe = (rol) => {
    const canon = rolCanonico(rol);
    if (canon === ROL_SUPERADMIN) return [...CLAVES_PERMISO];
    return [...(PERMISOS_POR_DEFECTO[canon] || [])];
};

module.exports = {
    ROL_SUPERADMIN,
    ROLES_GESTIONABLES,
    PERMISOS,
    CLAVES_PERMISO,
    PERMISOS_POR_DEFECTO,
    esClaveValida,
    esRolGestionable,
    permisosPorDefectoDe
};
