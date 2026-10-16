// =============================================
// VISTA DE USUARIOS DEL PANEL
// =============================================
// Página (permiso 'usuarios') donde se crea, edita,
// desactiva y se le cambia la contraseña al personal
// del panel. La lista la carga el JS con la API.
// =============================================

const { ROLES_STAFF, ETIQUETAS_ROL_STAFF, esSuperAdmin } = require('../../utils/roles');
const permisosService = require('../../services/permisosService');

const UsuariosVistasController = {

    // Página: GET /admin/usuarios
    mostrarUsuarios: (req, res) => {
        const usuarioSesion = req.session?.usuario;

        // Defensa en profundidad: la ruta ya exige el permiso 'usuarios'.
        if (!usuarioSesion || !permisosService.tienePermiso(usuarioSesion.role, 'usuarios')) {
            return res.redirect('/admin');
        }

        // Solo un Administrador puede crear/editar cuentas de Administrador,
        // así que a los demás gestores no les muestro ese rol en el desplegable.
        const soySuperadmin = esSuperAdmin(usuarioSesion.role);
        const rolesStaff = ROLES_STAFF
            .filter((rol) => soySuperadmin || rol !== 'admin')
            .map((rol) => ({
                valor: rol,
                etiqueta: ETIQUETAS_ROL_STAFF[rol] || rol
            }));

        res.render('admin/usuarios', {
            usuario: usuarioSesion,
            rolesStaff,
            esSuperadmin: soySuperadmin
        });
    }
};

module.exports = UsuariosVistasController;
