// =============================================
// VISTA DE RESPALDO Y EXPORTACIÓN
// =============================================
// Página (permiso 'respaldo') con los botones para
// descargar cada tabla en CSV o un respaldo completo
// en JSON. Las descargas las sirve la API.
// =============================================

const RespaldoModel = require('../../models/respaldoModel');
const permisosService = require('../../services/permisosService');

const RespaldoVistasController = {

    // Página: GET /admin/respaldo
    mostrarRespaldo: (req, res) => {
        const usuarioSesion = req.session?.usuario;

        // Defensa en profundidad: la ruta ya exige el permiso 'respaldo'.
        if (!usuarioSesion || !permisosService.tienePermiso(usuarioSesion.role, 'respaldo')) {
            return res.redirect('/admin');
        }

        return res.render('admin/respaldo', {
            usuario: usuarioSesion,
            tablas: RespaldoModel.listarTablas()
        });
    }
};

module.exports = RespaldoVistasController;
