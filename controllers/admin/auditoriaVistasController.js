// =============================================
// VISTA DE AUDITORÍA
// =============================================
// Página (permiso 'auditoria') que muestra el registro
// de acciones del personal del panel. La lista la
// carga el JS con la API (con filtros y paginación).
// =============================================

const permisosService = require('../../services/permisosService');

const AuditoriaVistasController = {

    // Página: GET /admin/auditoria
    mostrarAuditoria: (req, res) => {
        const usuarioSesion = req.session?.usuario;

        // Defensa en profundidad: la ruta ya exige el permiso 'auditoria'.
        if (!usuarioSesion || !permisosService.tienePermiso(usuarioSesion.role, 'auditoria')) {
            return res.redirect('/admin');
        }

        res.render('admin/auditoria', { usuario: usuarioSesion });
    }
};

module.exports = AuditoriaVistasController;
