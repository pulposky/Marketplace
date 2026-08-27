// =============================================
// CONTROLADOR DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Renderiza la vista de analytics del admin
// y provee endpoints API para los datos de
// los gráficos.
// =============================================

const HistoricosModel = require('../models/historicosModel');
const ExcelJS = require('exceljs');

const HistoricosController = {

    mostrarHistoricos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        HistoricosModel.resumen((err, resumen) => {
            res.render('admin/historicos', {
                usuario: usuarioSesion,
                resumen: resumen || { ventasEntregadas: 0, totalVisitas: 0, clientesCompradores: 0 }
            });
        });
    },

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
    // Descarga un archivo .xlsx con datos + gráficos OOXML nativos
    exportarHistoricos: (req, res) => {
        const queries = {
            productos: HistoricosModel.productosMasVendidos,
            clientes: HistoricosModel.clientesQueMasCompran,
            ventasDia: HistoricosModel.ventasPorDia,
            visitasDia: HistoricosModel.visitasPorDia,
            estados: HistoricosModel.pedidosPorEstado,
            rutas: HistoricosModel.visitasPorRuta
        };

        const resultados = {};
        const claves = Object.keys(queries);
        let completadas = 0;

        const verificarListo = async () => {
            completadas++;
            if (completadas < claves.length) return;

            try {
                const workbook = new ExcelJS.Workbook();
                workbook.creator = 'Marketplace Admin';
                workbook.created = new Date();

                const verdeOscuro = '0F5132';
                const verdeClaro = 'D1FAE5';
                const grisClaro = 'F3F4F6';
                const bordeGris = { style: 'thin', color: { argb: 'D1D5DB' } };

                const estiloTitulo = (fila) => {
                    fila.font = { bold: true, size: 14, color: { argb: verdeOscuro } };
                    fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: verdeClaro } };
                    fila.alignment = { vertical: 'middle' };
                    fila.height = 30;
                };

                const estiloEncabezado = (fila) => {
                    fila.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
                    fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: verdeOscuro } };
                    fila.alignment = { vertical: 'middle', wrapText: true };
                    fila.height = 24;
                };

                const aplicarBordes = (fila) => {
                    fila.eachCell((cell) => {
                        cell.border = {
                            top: bordeGris, bottom: bordeGris,
                            left: bordeGris, right: bordeGris
                        };
                    });
                };

                const alternarColor = (fila, indice) => {
                    if (indice % 2 === 0) {
                        fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grisClaro } };
                    }
                };

                // ---- HOJA 1: Productos más vendidos ----
                const wsProd = workbook.addWorksheet('Productos Más Vendidos');
                wsProd.columns = [
                    { header: 'Producto', key: 'producto', width: 35 },
                    { header: 'Unidad', key: 'unidad', width: 15 },
                    { header: 'Categoría', key: 'categoria', width: 20 },
                    { header: 'Total vendido', key: 'total_vendido', width: 18 },
                    { header: 'Total pedidos', key: 'total_pedidos', width: 15 }
                ];
                wsProd.spliceRows(1, 0, ['Productos Más Vendidos']);
                estiloTitulo(wsProd.getRow(1));
                wsProd.mergeCells('A1:E1');
                estiloEncabezado(wsProd.getRow(2));
                const prods = Array.isArray(resultados.productos) ? resultados.productos : [];
                prods.forEach((p, i) => {
                    const fila = wsProd.addRow(p);
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                // ---- HOJA 2: Clientes que más compran ----
                const wsClie = workbook.addWorksheet('Clientes Que Más Compran');
                wsClie.columns = [
                    { header: 'Cliente', key: 'cliente', width: 35 },
                    { header: 'Total pedidos', key: 'total_pedidos', width: 18 },
                    { header: 'Total unidades', key: 'total_unidades', width: 18 }
                ];
                wsClie.spliceRows(1, 0, ['Clientes Que Más Compran']);
                estiloTitulo(wsClie.getRow(1));
                wsClie.mergeCells('A1:C1');
                estiloEncabezado(wsClie.getRow(2));
                const clies = Array.isArray(resultados.clientes) ? resultados.clientes : [];
                clies.forEach((c, i) => {
                    const fila = wsClie.addRow(c);
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                // ---- HOJA 3: Ventas por día ----
                const wsVentas = workbook.addWorksheet('Ventas Por Día');
                wsVentas.columns = [
                    { header: 'Fecha', key: 'dia', width: 20 },
                    { header: 'Total ventas', key: 'total_ventas', width: 15 }
                ];
                wsVentas.spliceRows(1, 0, ['Ventas Por Día (Últimos 30 días)']);
                estiloTitulo(wsVentas.getRow(1));
                wsVentas.mergeCells('A1:B1');
                estiloEncabezado(wsVentas.getRow(2));
                const ventas = Array.isArray(resultados.ventasDia) ? resultados.ventasDia : [];
                ventas.forEach((v, i) => {
                    const fila = wsVentas.addRow({ dia: v.dia, total_ventas: v.total_ventas });
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                // ---- HOJA 4: Visitas por día ----
                const wsVisitas = workbook.addWorksheet('Visitas Por Día');
                wsVisitas.columns = [
                    { header: 'Fecha', key: 'dia', width: 20 },
                    { header: 'IPs únicas', key: 'total_visitas', width: 15 }
                ];
                wsVisitas.spliceRows(1, 0, ['Visitas Por Día (Últimos 30 días)']);
                estiloTitulo(wsVisitas.getRow(1));
                wsVisitas.mergeCells('A1:B1');
                estiloEncabezado(wsVisitas.getRow(2));
                const visitas = Array.isArray(resultados.visitasDia) ? resultados.visitasDia : [];
                visitas.forEach((v, i) => {
                    const fila = wsVisitas.addRow({ dia: v.dia, total_visitas: v.total_visitas });
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                // ---- HOJA 5: Estado de pedidos ----
                const wsEstados = workbook.addWorksheet('Estado de Pedidos');
                wsEstados.columns = [
                    { header: 'Estado', key: 'estado', width: 20 },
                    { header: 'Total', key: 'total', width: 15 }
                ];
                wsEstados.spliceRows(1, 0, ['Estado de Pedidos']);
                estiloTitulo(wsEstados.getRow(1));
                wsEstados.mergeCells('A1:B1');
                estiloEncabezado(wsEstados.getRow(2));
                const estados = Array.isArray(resultados.estados) ? resultados.estados : [];
                estados.forEach((e, i) => {
                    const fila = wsEstados.addRow(e);
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                // ---- HOJA 6: Rutas más visitadas ----
                const wsRutas = workbook.addWorksheet('Rutas Más Visitadas');
                wsRutas.columns = [
                    { header: 'Ruta', key: 'ruta', width: 35 },
                    { header: 'Total visitas', key: 'total_visitas', width: 15 }
                ];
                wsRutas.spliceRows(1, 0, ['Rutas Más Visitadas (Top 10)']);
                estiloTitulo(wsRutas.getRow(1));
                wsRutas.mergeCells('A1:B1');
                estiloEncabezado(wsRutas.getRow(2));
                const rutas = Array.isArray(resultados.rutas) ? resultados.rutas : [];
                rutas.forEach((r, i) => {
                    const fila = wsRutas.addRow(r);
                    alternarColor(fila, i);
                    aplicarBordes(fila);
                });

                const fechaHoy = new Date().toISOString().slice(0, 10);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="analitica-${fechaHoy}.xlsx"`);

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error('Error generando Excel:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al generar el archivo Excel.' });
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

module.exports = HistoricosController;
