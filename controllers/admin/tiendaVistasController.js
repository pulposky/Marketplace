// =============================================
// VISTA DE CONFIGURACIÓN DE LA TIENDA
// =============================================
// Pantalla del panel (solo Administrador) para editar
// nombre, logo, colores, contacto, moneda, horario y
// tiempo de expiración de los apartados.
// =============================================

const tiendaService = require('../../services/tiendaService');

const TiendaVistasController = {
    mostrarConfiguracion: (req, res) => res.render('admin/configuracionTienda', {
        usuario: req.session.usuario,
        configuracion: tiendaService.obtener()
    })
};

module.exports = TiendaVistasController;
