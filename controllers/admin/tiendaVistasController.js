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
const { TIPOS_BLOQUE, PASOS_DEFECTO, MAX_BLOQUES } = require('../../utils/bloques');
const { armarPasillos } = require('../../utils/pasillos');
const ProductoModel = require('../../models/productoModel');

const TiendaVistasController = {
    // Las categorías con productos alimentan el selector del bloque "Una categoría"
    mostrarConfiguracion: (req, res) => ProductoModel.obtenerTodos((error, productos) => res.render('admin/configuracionTienda', {
        usuario: req.session.usuario,
        configuracion: tiendaService.obtener(),
        tiposNegocio: TIPOS,
        TIPOGRAFIAS,
        ESQUINAS,
        STOCK,
        editorBloques: {
            tipos: TIPOS_BLOQUE,
            pasosDefecto: PASOS_DEFECTO,
            max: MAX_BLOQUES,
            bloques: tiendaService.obtener().bloques_inicio,
            categorias: error ? [] : armarPasillos(productos).map((p) => p.nombre),
        }
    }))
};

module.exports = TiendaVistasController;
