/* ============================================= */
/* AUDITORIASERVICE.JS - REGISTRO DE ACTUACIONES  */
/* ============================================= */
/* Helper para anotar en la tabla 'auditoria' lo   */
/* que hace el personal del panel. Se llama desde  */
/* los controllers con:                            */
/*   auditoriaService.registrar(req, 'accion', 'detalle') */
/*                                                 */
/* Es "fire and forget": nunca lanza ni frena una  */
/* petición; si falla, solo lo deja en el log.     */
/* ============================================= */

const AuditoriaModel = require('../models/auditoriaModel');

// Registra una acción. NO se debe esperar (no devuelve promesa útil).
function registrar(req, accion, detalle) {
    try {
        const usuario = req && req.session ? req.session.usuario : null;
        const datos = {
            usuario: usuario ? (usuario.usuario || usuario.nombre || 'desconocido') : 'sistema',
            rol: usuario ? (usuario.role || usuario.rol || null) : null,
            accion: String(accion || 'otro').slice(0, 50),
            detalle: detalle === null || detalle === undefined ? null : String(detalle).slice(0, 255)
        };

        AuditoriaModel.registrar(datos).catch((error) => {
            console.error('[Auditoría] No se pudo registrar la acción:', error.message);
        });
    } catch (error) {
        console.error('[Auditoría] Error inesperado al registrar:', error.message);
    }
}

module.exports = { registrar };
