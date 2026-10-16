// =============================================
// API DE CATEGORÍAS
// =============================================
// Endpoints (permiso 'categorias') para listar, crear,
// renombrar y eliminar categorías de productos.
// Al renombrar se actualizan los productos que la usaban.
// =============================================

const CategoriaModel = require('../../models/categoriaModel');
const auditoriaService = require('../../services/auditoriaService');

const CategoriasApiController = {

    // GET /api/admin/categorias
    listar: async (req, res) => {
        try {
            const categorias = await CategoriaModel.listar();
            return res.json({ ok: true, categorias });
        } catch (error) {
            console.error('Error listando categorías:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al obtener las categorías.' });
        }
    },

    // POST /api/admin/categorias  Body: { nombre }
    crear: async (req, res) => {
        const nombre = String(req.body?.nombre || '').trim();

        if (!nombre) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio.' });
        }
        if (nombre.length > 100) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre es demasiado largo (máx. 100 caracteres).' });
        }

        try {
            const yaExiste = await CategoriaModel.existeNombre(nombre, 0);
            if (yaExiste) {
                return res.status(409).json({ ok: false, mensaje: 'Ya existe una categoría con ese nombre.' });
            }

            const id = await CategoriaModel.crear(nombre);
            auditoriaService.registrar(req, 'categoria_crear', `Creó la categoría "${nombre}" (id ${id}).`);
            return res.status(201).json({ ok: true, id, mensaje: 'Categoría creada correctamente.' });
        } catch (error) {
            console.error('Error creando categoría:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al crear la categoría.' });
        }
    },

    // PATCH /api/admin/categorias/:id  Body: { nombre }
    renombrar: async (req, res) => {
        const id = Number(req.params.id);
        const nombre = String(req.body?.nombre || '').trim();

        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Categoría inválida.' });
        }
        if (!nombre) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio.' });
        }
        if (nombre.length > 100) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre es demasiado largo (máx. 100 caracteres).' });
        }

        try {
            const yaExiste = await CategoriaModel.existeNombre(nombre, id);
            if (yaExiste) {
                return res.status(409).json({ ok: false, mensaje: 'Ya existe otra categoría con ese nombre.' });
            }

            const anterior = await CategoriaModel.renombrar(id, nombre);
            if (anterior === null) {
                return res.status(404).json({ ok: false, mensaje: 'La categoría no existe.' });
            }

            auditoriaService.registrar(req, 'categoria_renombrar', `Renombró "${anterior}" a "${nombre}".`);
            return res.json({ ok: true, mensaje: 'Categoría renombrada correctamente.' });
        } catch (error) {
            console.error('Error renombrando categoría:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al renombrar la categoría.' });
        }
    },

    // DELETE /api/admin/categorias/:id
    eliminar: async (req, res) => {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Categoría inválida.' });
        }

        try {
            const resultado = await CategoriaModel.eliminar(id);

            if (!resultado.eliminada && resultado.motivo === 'noexiste') {
                return res.status(404).json({ ok: false, mensaje: 'La categoría no existe.' });
            }
            if (!resultado.eliminada && resultado.motivo === 'enuso') {
                return res.status(409).json({
                    ok: false,
                    mensaje: `No se puede eliminar: ${resultado.total} producto(s) usan esta categoría.`
                });
            }

            auditoriaService.registrar(req, 'categoria_eliminar', `Eliminó la categoría "${resultado.nombre}".`);
            return res.json({ ok: true, mensaje: 'Categoría eliminada correctamente.' });
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al eliminar la categoría.' });
        }
    }
};

module.exports = CategoriasApiController;
