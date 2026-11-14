// =============================================
// API DEL DASHBOARD DEL PANEL
// =============================================
// GET /api/admin/dashboard?dias=7|30|90
// Devuelve solo los bloques que el rol puede ver:
//   analitica -> indicadores, ventas y gráficas
//   pedidos   -> pendientes y últimos apartados
//   productos -> agotados y stock bajo
// =============================================

const DashboardModel = require('../../models/dashboardModel');
const permisosService = require('../../services/permisosService');
const tiendaService = require('../../services/tiendaService');
const { normalizarDias, serieDiaria, variacion, serieHoras } = require('../../utils/dashboard');

// Inicio del día de hoy menos 'n' días (hora local del servidor)
const inicioDia = (n) => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - n);
};

const DashboardApiController = {
    obtener: async (req, res) => {
        const rol = req.session.usuario.role;
        const puede = (clave) => permisosService.tienePermiso(rol, clave);
        const dias = normalizarDias(req.query.dias);

        // Período actual: los últimos 'dias' días contando hoy; el anterior, los 'dias' previos
        const desde = inicioDia(dias - 1);
        const desdeAnterior = inicioDia(2 * dias - 1);
        const manana = inicioDia(-1);

        try {
            const respuesta = { ok: true, dias };

            if (puede('analitica')) {
                const [actual, anterior, porDia, porEstado, topProductos, porCategoria, porHora, visitas] = await Promise.all([
                    DashboardModel.resumen(desde, manana),
                    DashboardModel.resumen(desdeAnterior, desde),
                    DashboardModel.porDia(desde),
                    DashboardModel.porEstado(desde),
                    DashboardModel.topProductos(desde),
                    DashboardModel.porCategoria(desde),
                    DashboardModel.porHora(desde),
                    DashboardModel.visitasPorDia(desde),
                ]);

                const ticket = (r) => (Number(r.entregados) ? Number(r.ventas) / Number(r.entregados) : 0);
                const tasaCancelacion = (r) => (Number(r.apartados) ? (Number(r.cancelados) / Number(r.apartados)) * 100 : 0);

                respuesta.indicadores = {
                    ventas: { valor: Number(actual.ventas), cambio: variacion(actual.ventas, anterior.ventas) },
                    apartados: { valor: Number(actual.apartados), cambio: variacion(actual.apartados, anterior.apartados) },
                    ticket: { valor: ticket(actual), cambio: variacion(ticket(actual), ticket(anterior)) },
                    cancelacion: { valor: tasaCancelacion(actual), cambio: variacion(tasaCancelacion(actual), tasaCancelacion(anterior)) },
                    clientes: { valor: Number(actual.clientes), cambio: variacion(actual.clientes, anterior.clientes) },
                };
                respuesta.serie = serieDiaria(porDia, dias, ['ventas', 'apartados']);
                respuesta.visitas = serieDiaria(visitas, dias, ['visitas']);
                respuesta.estados = porEstado.map((f) => ({ estado: f.estado, total: Number(f.total) }));
                respuesta.topProductos = topProductos.map((f) => ({ nombre: f.nombre, unidad: f.unidad, ventas: Number(f.ventas), unidades: Number(f.unidades) }));
                respuesta.categorias = porCategoria.map((f) => ({ categoria: f.categoria, ventas: Number(f.ventas) }));
                respuesta.horas = serieHoras(porHora);
            }

            if (puede('pedidos')) {
                const minutos = Number(tiendaService.obtener().minutos_expiracion_apartado) || 60;
                const [pendientes, ultimos] = await Promise.all([
                    DashboardModel.pendientes(minutos),
                    DashboardModel.ultimosApartados(),
                ]);
                respuesta.pendientes = { total: Number(pendientes.pendientes), porVencer: Number(pendientes.porVencer) };
                respuesta.ultimos = ultimos.map((f) => ({
                    id: f.id_apartado, cliente: f.nombre_cliente, producto: f.producto, estado: f.estado, fecha: f.fecha,
                    cantidad: Number(f.cantidad), unidad: f.unidad, total: Number(f.total) || 0,
                    presentacion: f.presentacion_nombre && Number(f.presentacion_factor) > 0
                        ? { nombre: f.presentacion_nombre, factor: Number(f.presentacion_factor) } : null,
                }));
            }

            if (puede('productos')) {
                const stock = await DashboardModel.stockBajo();
                respuesta.stock = {
                    agotados: Number(stock.agotados),
                    bajo: stock.lista.map((f) => ({ id: f.id_producto, nombre: f.nombre, unidad: f.unidad, disponibles: Number(f.limite_venta) })),
                };
            }

            return res.json(respuesta);
        } catch (error) {
            console.error('Error armando el dashboard:', error);
            return res.status(500).json({ ok: false, mensaje: 'No se pudieron cargar los datos del panel.' });
        }
    },
};

module.exports = DashboardApiController;
