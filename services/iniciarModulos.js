/* ============================================= */
/* INICIAR MODULOS DEL PANEL                     */
/* Asegura las columnas y tablas requeridas por  */
/* usuarios, categorias y auditoria al arrancar. */
/* ============================================= */

const UsuarioModel = require('../models/usuarioModel');
const CategoriaModel = require('../models/categoriaModel');
const AuditoriaModel = require('../models/auditoriaModel');

async function iniciar() {
    try {
        await UsuarioModel.asegurarEsquema();
    } catch (error) {
        console.error('[Modulos] No se pudo asegurar usuarios.activo:', error.message);
    }

    try {
        await CategoriaModel.asegurarTabla();
        await CategoriaModel.sembrarDesdeProductos();
    } catch (error) {
        console.error('[Modulos] No se pudo preparar categorias:', error.message);
    }

    try {
        await AuditoriaModel.asegurarTabla();
    } catch (error) {
        console.error('[Modulos] No se pudo preparar auditoria:', error.message);
    }
}

module.exports = { iniciar };
