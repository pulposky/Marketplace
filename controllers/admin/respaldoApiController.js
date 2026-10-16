// =============================================
// API DE RESPALDO Y EXPORTACIÓN
// =============================================
// Endpoints (permiso 'respaldo') que devuelven los
// datos como descarga:
//   - GET /api/admin/respaldo/tabla/:clave  → CSV
//   - GET /api/admin/respaldo/completo      → JSON
// Los CSV usan ';' y BOM UTF-8 (igual que los
// reportes) para que Excel en español los abra bien.
// Las contraseñas nunca se exportan (ver respaldoModel).
// =============================================

const RespaldoModel = require('../../models/respaldoModel');
const auditoriaService = require('../../services/auditoriaService');

// Convierte un arreglo de objetos a texto CSV.
const aCSV = (filas) => {
    if (!filas || filas.length === 0) return '\uFEFF';
    const encabezados = Object.keys(filas[0]);
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const lineas = [encabezados.map(escapar).join(';')];
    filas.forEach((fila) => lineas.push(encabezados.map((col) => escapar(fila[col])).join(';')));
    return '\uFEFF' + lineas.join('\r\n');
};

// Marca de tiempo para nombrar los archivos (AAAA-MM-DD_HH-mm-ss).
const marcaDeTiempo = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
};

const RespaldoApiController = {

    // GET /api/admin/respaldo/tabla/:clave  → descarga CSV
    exportarTabla: async (req, res) => {
        const clave = String(req.params.clave || '').trim().toLowerCase();
        const tabla = RespaldoModel.buscarTabla(clave);
        if (!tabla) {
            return res.status(404).json({ ok: false, mensaje: 'Tabla no permitida.' });
        }

        try {
            const filas = await RespaldoModel.obtenerFilas(clave);
            const csv = aCSV(filas);
            auditoriaService.registrar(req, 'respaldo_exportar', `Exportó la tabla "${clave}" (${filas.length} filas).`);

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${clave}_${marcaDeTiempo()}.csv"`);
            return res.send(csv);
        } catch (error) {
            console.error('Error exportando tabla:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al exportar la tabla.' });
        }
    },

    // GET /api/admin/respaldo/completo  → descarga JSON con todas las tablas
    exportarCompleto: async (req, res) => {
        try {
            const datos = await RespaldoModel.obtenerTodo();
            const paquete = {
                generado_en: new Date().toISOString(),
                sistema: 'Marketplace SENA - Centro Agroindustrial Hachón',
                nota: 'Respaldo sin contraseñas (solo datos).',
                tablas: datos
            };
            auditoriaService.registrar(req, 'respaldo_completo', 'Descargó el respaldo completo en JSON.');

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="respaldo_completo_${marcaDeTiempo()}.json"`);
            return res.send(JSON.stringify(paquete, null, 2));
        } catch (error) {
            console.error('Error generando respaldo completo:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al generar el respaldo.' });
        }
    }
};

module.exports = RespaldoApiController;
