// =============================================
// VISTA DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Renderiza la página de analytics del admin
// con el resumen de ventas, visitas y clientes.
// =============================================

const HistoricosModel = require('../../models/historicosModel');
const permisosService = require('../../services/permisosService');

const HistoricosVistasController = {

    mostrarHistoricos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        if (!usuarioSesion || !permisosService.tienePermiso(usuarioSesion.role, 'analitica')) {
            return res.redirect('/admin');
        }

        HistoricosModel.resumen((err, resumen) => {
            res.render('admin/historicos', {
                usuario: usuarioSesion,
                resumen: resumen || { ventasEntregadas: 0, totalVisitas: 0, clientesCompradores: 0 }
            });
        });
    }
};

module.exports = HistoricosVistasController;
