// =============================================
// VISTA DE GESTIÓN DE CARRUSEL
// =============================================
// Renderiza la página del panel admin para
// gestionar las imágenes del carrusel de la portada.
// =============================================

const { listarImagenes } = require('./carruselApiController');

const CarruselVistasController = {

    // Página: GET /admin/carrusel
    mostrarGestionCarrusel: async (req, res) => {
        try {
            let imagenes = [];
            try {
                imagenes = await listarImagenes();
            } catch (error) {
                console.error('Error listando carrusel:', error);
            }

            res.render('admin/carruselAdmin', {
                imagenes,
                usuario: req.session.usuario
            });
        } catch (error) {
            console.error('Error mostrando gestión de carrusel:', error);
            return res.status(500).render('error', { codigo: 500, mensaje: 'Error en el servidor.' });
        }
    }
};

module.exports = CarruselVistasController;
