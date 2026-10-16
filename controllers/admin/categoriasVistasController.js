// =============================================
// VISTA DE CATEGORÍAS
// =============================================
// Página (permiso 'categorias') para administrar la
// lista de categorías de productos.
// =============================================

const permisosService = require('../../services/permisosService');

const CategoriasVistasController = {

    // Página: GET /admin/categorias
    mostrarCategorias: (req, res) => {
        const usuarioSesion = req.session?.usuario;

        // Defensa en profundidad: la ruta ya exige el permiso 'categorias'.
        if (!usuarioSesion || !permisosService.tienePermiso(usuarioSesion.role, 'categorias')) {
            return res.redirect('/admin');
        }

        res.render('admin/categorias', { usuario: usuarioSesion });
    }
};

module.exports = CategoriasVistasController;
