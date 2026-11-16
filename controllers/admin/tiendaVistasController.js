// =============================================
// VISTA DE CONFIGURACIÓN DE LA TIENDA
// =============================================
// Pantalla del panel (solo Administrador) para editar
// nombre, logo, colores, contacto, moneda, horario y
// tiempo de expiración de los apartados.
// =============================================

const tiendaService = require('../../services/tiendaService');
const { TIPOS } = require('../../utils/tipoNegocio');
const { TIPOGRAFIAS, ESQUINAS, STOCK } = require('../../utils/apariencia');

const TiendaVistasController = {
    mostrarConfiguracion: (req, res) => res.render('admin/configuracionTienda', {
        usuario: req.session.usuario,
        configuracion: tiendaService.obtener(),
        tiposNegocio: TIPOS,
        TIPOGRAFIAS,
        ESQUINAS,
        STOCK
    })
};

module.exports = TiendaVistasController;
