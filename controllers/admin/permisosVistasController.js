// =============================================
// VISTA DE PERMISOS POR ROL
// =============================================
// Página (solo Administrador) donde se ven y se
// editan los permisos de cada rol del panel.
// La matriz la carga el JS con la API.
// =============================================

const { esSuperAdmin } = require('../../utils/roles');

const PermisosVistasController = {

    // Página: GET /admin/permisos
    mostrarPermisos: (req, res) => {
        const usuarioSesion = req.session?.usuario;

        // Solo el Administrador (superadmin) administra permisos.
        if (!usuarioSesion || !esSuperAdmin(usuarioSesion.role)) {
            return res.redirect('/admin');
        }

        res.render('admin/permisos', { usuario: usuarioSesion });
    }
};

module.exports = PermisosVistasController;
