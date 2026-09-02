// =============================================
// VISTA DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Renderiza la página de analytics del admin
// con el resumen de ventas, visitas y clientes.
// =============================================

const HistoricosModel = require('../../models/historicosModel');

const HistoricosVistasController = {

    mostrarHistoricos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || rol !== 'admin') {
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
