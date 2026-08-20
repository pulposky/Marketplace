// =============================================
// CONTROLADOR DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Renderiza la vista de analytics del admin
// y provee endpoints API para los datos de
// los gráficos.
// =============================================

const HistoricosModel = require('../model/historicosModel');

const HistoricosController = {

    mostrarHistoricos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        HistoricosModel.resumen((err, resumen) => {
            res.render('admin/historicos', {
                usuario: usuarioSesion,
                resumen: resumen || { ventasConfirmadas: 0, totalVisitas: 0, clientesCompradores: 0 }
            });
        });
    },

    apiProductosMasVendidos: (req, res) => {
        HistoricosModel.productosMasVendidos((err, resultados) => {
            if (err) {
                console.error('Error en productosMasVendidos:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiClientesQueMasCompran: (req, res) => {
        HistoricosModel.clientesQueMasCompran((err, resultados) => {
            if (err) {
                console.error('Error en clientesQueMasCompran:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiPedidosPorEstado: (req, res) => {
        HistoricosModel.pedidosPorEstado((err, resultados) => {
            if (err) {
                console.error('Error en pedidosPorEstado:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVentasPorDia: (req, res) => {
        HistoricosModel.ventasPorDia((err, resultados) => {
            if (err) {
                console.error('Error en ventasPorDia:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVisitasPorDia: (req, res) => {
        HistoricosModel.visitasPorDia((err, resultados) => {
            if (err) {
                console.error('Error en visitasPorDia:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVisitasPorRuta: (req, res) => {
        HistoricosModel.visitasPorRuta((err, resultados) => {
            if (err) {
                console.error('Error en visitasPorRuta:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    }
};

module.exports = HistoricosController;
