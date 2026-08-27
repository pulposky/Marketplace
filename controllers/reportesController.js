// =============================================
// CONTROLADOR DE REPORTES (EXPORTAR CSV)
// =============================================
// Genera los archivos CSV que descarga el admin:
//   - Reporte de pedidos (todos los apartados)
//   - Reporte de clientes (con sus compras)
//
// El CSV usa ';' como separador porque es el que
// abre directo Excel en español, y lleva BOM UTF-8
// para que las tildes se vean bien.
// =============================================

const ApartadoModel = require('../models/apartadoModel');
const UsuarioModel = require('../models/usuarioModel');

// Convierte un arreglo de objetos a texto CSV.
// Los valores van entre comillas y las comillas
// internas se duplican ("") para no romper el formato.
const aCSV = (encabezados, filas) => {
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const lineas = [encabezados.map(escapar).join(';')];
    filas.forEach((fila) => lineas.push(fila.map(escapar).join(';')));
    return '\uFEFF' + lineas.join('\r\n');
};

// Manda el CSV como descarga con nombre de archivo
const descargarCSV = (res, nombreArchivo, contenido) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(contenido);
};

const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? String(fecha) : d.toLocaleString('es-CO');
};

const ReportesController = {

    // GET /api/admin/reportes/pedidos.csv
    // Descarga todos los pedidos con su estado actual
    exportarPedidosCSV: (req, res) => {
        ApartadoModel.obtenerTodosApartados('todos', (error, apartados) => {
            if (error) {
                console.error('Error generando reporte de pedidos:', error);
                return res.status(500).json({ error: 'Error al generar el reporte de pedidos.' });
            }

            const lista = Array.isArray(apartados) ? apartados : [];
            const filas = lista.map((a) => [
                a.id_apartado,
                a.nombre_cliente,
                a.nombre_producto,
                a.cantidad,
                a.unidad || 'UND',
                Number(a.precio || 0),
                Number(a.precio || 0) * Number(a.cantidad || 0),
                a.estado,
                formatearFecha(a.fecha)
            ]);

            const csv = aCSV(
                ['ID', 'Cliente', 'Producto', 'Cantidad', 'Unidad', 'Precio unitario', 'Total', 'Estado', 'Fecha'],
                filas
            );

            const fechaHoy = new Date().toISOString().slice(0, 10);
            descargarCSV(res, `reporte-pedidos-${fechaHoy}.csv`, csv);
        });
    },

    // GET /api/admin/reportes/clientes.csv
    // Descarga todos los clientes registrados con sus compras
    exportarClientesCSV: (req, res) => {
        UsuarioModel.obtenerClientesAdmin('', (error, clientes) => {
            if (error) {
                console.error('Error generando reporte de clientes:', error);
                return res.status(500).json({ error: 'Error al generar el reporte de clientes.' });
            }

            const lista = Array.isArray(clientes) ? clientes : [];
            const filas = lista.map((c) => [
                c.id,
                c.nombre,
                c.documento,
                c.telefono || '',
                c.direccion || '',
                c.rol || '',
                Number(c.total_pedidos || 0),
                Number(c.total_compras || 0)
            ]);

            const csv = aCSV(
                ['ID', 'Nombre', 'Documento', 'Teléfono', 'Dirección', 'Rol', 'Total pedidos', 'Compras confirmadas/entregadas'],
                filas
            );

            const fechaHoy = new Date().toISOString().slice(0, 10);
            descargarCSV(res, `reporte-clientes-${fechaHoy}.csv`, csv);
        });
    }
};

module.exports = ReportesController;
