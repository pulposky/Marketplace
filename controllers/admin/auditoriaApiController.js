// =============================================
// API DE AUDITORÍA
// =============================================
// Endpoint (permiso 'auditoria') que devuelve el
// registro de acciones del panel con filtros
// (texto y tipo de acción) y paginación.
// =============================================

const AuditoriaModel = require('../../models/auditoriaModel');

// Registros por página.
const TAMANO_PAGINA = 25;

const AuditoriaApiController = {

    // GET /api/admin/auditoria?buscar=&accion=&pagina=
    listar: async (req, res) => {
        try {
            const busqueda = req.query.buscar || '';
            const accion = req.query.accion || '';
            const pagina = Math.max(1, Number(req.query.pagina) || 1);
            const offset = (pagina - 1) * TAMANO_PAGINA;

            const [registros, total, acciones] = await Promise.all([
                AuditoriaModel.listar({ busqueda, accion, limite: TAMANO_PAGINA, offset }),
                AuditoriaModel.contar({ busqueda, accion }),
                AuditoriaModel.accionesDistintas()
            ]);

            return res.json({
                ok: true,
                registros,
                total,
                acciones,
                pagina,
                tamanoPagina: TAMANO_PAGINA,
                totalPaginas: Math.max(1, Math.ceil(total / TAMANO_PAGINA))
            });
        } catch (error) {
            console.error('Error listando auditoría:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al obtener la auditoría.' });
        }
    }
};

module.exports = AuditoriaApiController;
