// =============================================
// API DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Endpoints que devuelven JSON para los gráficos
// de analytics: productos más vendidos, clientes
// que más compran, pedidos por estado, ventas y
// visitas por día, rutas visitadas, y exportación
// a PDF con el mismo resumen de información.
// =============================================

const HistoricosModel = require('../../models/historicosModel');
const PDFDocument = require('pdfkit');

// Paleta de colores usada en el PDF (coincide con la del panel)
const COLOR_VERDE_OSCURO = '#0F5132';
const COLOR_VERDE_CLARO = '#D1FAE5';
const COLOR_GRIS_CLARO = '#F3F4F6';
const COLOR_BORDE = '#E5E7EB';
const COLOR_TEXTO = '#111827';
const COLOR_MUTED = '#6B7280';

// Convierte un valor de fecha (Date o string "YYYY-MM-DD...") a "DD/MM/YYYY"
const formatearDia = (valor) => {
    if (valor == null || valor === '') return '';
    if (typeof valor === 'string') {
        const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (coincidencia) return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
        return valor;
    }
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return String(valor);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
};

// Dibuja una tabla con título dentro del PDF.
// 'columnas' es un arreglo de { header, key, peso }; el ancho se
// reparte proporcionalmente al peso de cada columna.
const dibujarTabla = (doc, titulo, columnas, filas) => {
    const margenIzq = doc.page.margins.left;
    const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const altoFila = 20;
    const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

    const totalPeso = columnas.reduce((suma, col) => suma + col.peso, 0);
    const anchos = columnas.map((col) => (anchoDisponible * col.peso) / totalPeso);

    // Si no cabe el título + encabezado, salto de página
    if (doc.y + 70 > limiteInferior()) {
        doc.addPage();
    }

    // Título de la sección
    const yTitulo = doc.y;
    doc.rect(margenIzq, yTitulo, anchoDisponible, 22).fill(COLOR_VERDE_CLARO);
    doc.fillColor(COLOR_VERDE_OSCURO).font('Helvetica-Bold').fontSize(12)
        .text(titulo, margenIzq + 8, yTitulo + 6, { width: anchoDisponible - 16 });
    doc.y = yTitulo + 22 + 6;

    // Encabezado de la tabla (se repite al cambiar de página)
    const dibujarEncabezado = () => {
        const yh = doc.y;
        doc.rect(margenIzq, yh, anchoDisponible, altoFila).fill(COLOR_VERDE_OSCURO);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
        let x = margenIzq;
        columnas.forEach((col, i) => {
            doc.text(col.header, x + 4, yh + 6, { width: anchos[i] - 8, height: altoFila, ellipsis: true });
            x += anchos[i];
        });
        doc.y = yh + altoFila;
    };

    dibujarEncabezado();

    const filasAMostrar = Array.isArray(filas) ? filas : [];

    // Estado vacío: un mensaje en lugar de una tabla en blanco
    if (filasAMostrar.length === 0) {
        const yv = doc.y;
        doc.rect(margenIzq, yv, anchoDisponible, altoFila).fillAndStroke(COLOR_GRIS_CLARO, COLOR_BORDE);
        doc.fillColor(COLOR_MUTED).font('Helvetica-Oblique').fontSize(9)
            .text('Sin datos para este período.', margenIzq + 6, yv + 6, { width: anchoDisponible - 12 });
        doc.y = yv + altoFila;
        doc.fillColor(COLOR_TEXTO).font('Helvetica');
        return;
    }

    filasAMostrar.forEach((fila, i) => {
        if (doc.y + altoFila > limiteInferior()) {
            doc.addPage();
            dibujarEncabezado();
        }
        const yf = doc.y;
        if (i % 2 === 1) {
            doc.rect(margenIzq, yf, anchoDisponible, altoFila).fill(COLOR_GRIS_CLARO);
        }
        doc.fillColor(COLOR_TEXTO).font('Helvetica').fontSize(9);
        let x = margenIzq;
        columnas.forEach((col, idx) => {
            const valor = fila[col.key] == null ? '' : String(fila[col.key]);
            doc.text(valor, x + 4, yf + 6, { width: anchos[idx] - 8, height: altoFila, ellipsis: true });
            x += anchos[idx];
        });
        doc.y = yf + altoFila;
    });

    doc.fillColor(COLOR_TEXTO);
};

// Genera el PDF con todas las estadísticas y lo escribe en 'destino'
// (un stream, normalmente la respuesta HTTP).
const generarPdfHistoricos = (destino, resultados) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const margenIzq = doc.page.margins.left;

    doc.pipe(destino);

    // ---- Encabezado ----
    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLOR_VERDE_OSCURO)
        .text('Reporte de Analítica', { align: 'left' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).fillColor(COLOR_MUTED)
        .text(`Marketplace · Generado el ${formatearDia(new Date())}`);
    doc.moveDown(0.9);

    // ---- Tarjetas resumen ----
    const resumen = resultados.resumen || {};
    const yResumen = doc.y;
    const altoResumen = 36;
    doc.rect(margenIzq, yResumen, anchoDisponible, altoResumen).fillAndStroke(COLOR_GRIS_CLARO, COLOR_BORDE);
    doc.fillColor(COLOR_VERDE_OSCURO).font('Helvetica-Bold').fontSize(11);
    doc.text(`Ventas entregadas: ${resumen.ventasEntregadas ?? 0}`, margenIzq + 12, yResumen + 12);
    doc.text(`Clientes compradores: ${resumen.clientesCompradores ?? 0}`, margenIzq + 12 + anchoDisponible / 3, yResumen + 12);
    doc.text(`Visitas (30 días): ${resumen.totalVisitas ?? 0}`, margenIzq + 12 + (anchoDisponible * 2) / 3, yResumen + 12);
    doc.y = yResumen + altoResumen + 6;

    // ---- Secciones ----
    dibujarTabla(doc, 'Productos Más Vendidos', [
        { header: 'Producto', key: 'producto', peso: 5 },
        { header: 'Unidad', key: 'unidad', peso: 1.5 },
        { header: 'Categoría', key: 'categoria', peso: 2.5 },
        { header: 'Total vendido', key: 'total_vendido', peso: 2 },
        { header: 'Total pedidos', key: 'total_pedidos', peso: 2 }
    ], resultados.productos);

    dibujarTabla(doc, 'Clientes Que Más Compran', [
        { header: 'Cliente', key: 'cliente', peso: 5 },
        { header: 'Total pedidos', key: 'total_pedidos', peso: 2 },
        { header: 'Total unidades', key: 'total_unidades', peso: 2 }
    ], resultados.clientes);

    dibujarTabla(doc, 'Ventas Por Día (últimos 30 días)', [
        { header: 'Fecha', key: 'dia', peso: 2 },
        { header: 'Total ventas', key: 'total_ventas', peso: 2 }
    ], (resultados.ventasDia || []).map((v) => ({ dia: formatearDia(v.dia), total_ventas: v.total_ventas })));

    dibujarTabla(doc, 'Visitas Por Día (últimos 30 días)', [
        { header: 'Fecha', key: 'dia', peso: 2 },
        { header: 'IPs únicas', key: 'total_visitas', peso: 2 }
    ], (resultados.visitasDia || []).map((v) => ({ dia: formatearDia(v.dia), total_visitas: v.total_visitas })));

    dibujarTabla(doc, 'Estado de Pedidos', [
        { header: 'Estado', key: 'estado', peso: 3 },
        { header: 'Total', key: 'total', peso: 2 }
    ], (resultados.estados || []).map((e) => ({
        estado: e.estado ? e.estado.charAt(0).toUpperCase() + e.estado.slice(1) : '',
        total: e.total
    })));

    dibujarTabla(doc, 'Rutas Más Visitadas (Top 10)', [
        { header: 'Ruta', key: 'ruta', peso: 5 },
        { header: 'Total visitas', key: 'total_visitas', peso: 2 }
    ], resultados.rutas);

    // ---- Pie de página con numeración ----
    const paginas = doc.bufferedPageRange();
    for (let i = 0; i < paginas.count; i++) {
        doc.switchToPage(paginas.start + i);
        doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text(
            `Página ${i + 1} de ${paginas.count}`,
            margenIzq,
            doc.page.height - doc.page.margins.bottom + 12,
            { width: anchoDisponible, align: 'right', lineBreak: false }
        );
    }

    doc.end();
};

const HistoricosApiController = {

    apiProductosMasVendidos: (req, res) => {
        HistoricosModel.productosMasVendidos((err, resultados) => {
            if (err) {
                console.error('Error en productosMasVendidos:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiClientesQueMasCompran: (req, res) => {
        HistoricosModel.clientesQueMasCompran((err, resultados) => {
            if (err) {
                console.error('Error en clientesQueMasCompran:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiPedidosPorEstado: (req, res) => {
        HistoricosModel.pedidosPorEstado((err, resultados) => {
            if (err) {
                console.error('Error en pedidosPorEstado:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVentasPorDia: (req, res) => {
        HistoricosModel.ventasPorDia((err, resultados) => {
            if (err) {
                console.error('Error en ventasPorDia:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVisitasPorDia: (req, res) => {
        HistoricosModel.visitasPorDia((err, resultados) => {
            if (err) {
                console.error('Error en visitasPorDia:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    apiVisitasPorRuta: (req, res) => {
        HistoricosModel.visitasPorRuta((err, resultados) => {
            if (err) {
                console.error('Error en visitasPorRuta:', err.message);
                return res.json([]);
            }
            res.json(Array.isArray(resultados) ? resultados : []);
        });
    },

    // GET /api/admin/historicos/exportar
    // Descarga un archivo .pdf con el resumen de la analítica
    // y una tabla por cada sección (con mensaje si no hay datos).
    exportarHistoricos: (req, res) => {
        const queries = {
            productos: HistoricosModel.productosMasVendidos,
            clientes: HistoricosModel.clientesQueMasCompran,
            ventasDia: HistoricosModel.ventasPorDia,
            visitasDia: HistoricosModel.visitasPorDia,
            estados: HistoricosModel.pedidosPorEstado,
            rutas: HistoricosModel.visitasPorRuta,
            resumen: HistoricosModel.resumen
        };

        const resultados = {};
        const claves = Object.keys(queries);
        let completadas = 0;

        const verificarListo = () => {
            completadas++;
            if (completadas < claves.length) return;

            try {
                const fechaHoy = new Date().toISOString().slice(0, 10);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="analitica-${fechaHoy}.pdf"`);
                generarPdfHistoricos(res, resultados);
            } catch (error) {
                console.error('Error generando PDF:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al generar el archivo PDF.' });
                }
            }
        };

        claves.forEach((clave) => {
            queries[clave]((err, r) => {
                resultados[clave] = r;
                verificarListo();
            });
        });
    }
};

module.exports = HistoricosApiController;
module.exports.generarPdfHistoricos = generarPdfHistoricos;
