// =============================================
// SERVICIO: EXPIRACIÓN AUTOMÁTICA DE APARTADOS
// =============================================
// Job en segundo plano que cada 60 segundos revisa
// si hay apartados pendientes con más de 1 hora de
// antigüedad. Si los encuentra, los cancela y
// devuelve el stock al producto.
//
// Se arranca desde server.js con:
//   require('./services/expirarApartados').iniciar();
// =============================================

const ProductoModel = require('../models/productoModel');
const ApartadoModel = require('../models/apartadoModel');
const NotificacionClienteModel = require('../models/notificacionClienteModel');

const INTERVALO_MS = 60 * 1000;

function cancelarApartadosExpirados() {
    ApartadoModel.obtenerApartadosExpirados((err, apartados) => {
        if (err) {
            console.error('[Expiración] Error al buscar apartados expirados:', err.message);
            return;
        }

        if (!apartados || apartados.length === 0) return;

        apartados.forEach((apartado) => {
            ApartadoModel.cancelarApartadoPorExpiracion(apartado.id_apartado, (errCancel, resultado) => {
                if (errCancel) {
                    console.error(`[Expiración] Error cancelando apartado #${apartado.id_apartado}:`, errCancel.message);
                    return;
                }

                // Si affectedRows = 0, el apartado ya fue cancelado por otro proceso
                if (!resultado || resultado.affectedRows === 0) return;

                // Aviso al cliente que su apartado se canceló por vencimiento
                NotificacionClienteModel.buscarClientePorNombre(apartado.nombre_cliente, (errCli, registros) => {
                    if (errCli || !registros || registros.length === 0) {
                        return;
                    }
                    NotificacionClienteModel.crear(
                        registros[0].id_cliente,
                        'Apartado vencido',
                        `Tu apartado #${apartado.id_apartado} se canceló por vencer el tiempo de reserva (1 hora).`,
                        () => {}
                    );
                });

                // Devolver stock al producto
                ProductoModel.devolverStockProducto(apartado.producto, apartado.cantidad, (errStock) => {
                    if (errStock) {
                        console.error(`[Expiración] Error devolviendo stock del apartado #${apartado.id_apartado}:`, errStock.message);
                    }
                });
            });
        });
    });
}

function iniciar() {
    setInterval(cancelarApartadosExpirados, INTERVALO_MS);
}

module.exports = { iniciar };