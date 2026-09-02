// =============================================
// VISTAS DEL CLIENTE
// =============================================
// Renderiza las páginas que ve un cliente
// autenticado: "Mis apartados" y "Mi perfil".
// =============================================

const ApartadoModel = require('../../models/apartadoModel');
const UsuarioModel = require('../../models/usuarioModel');
const { asociarImagenesAProductos } = require('../../utils/imagenes');

const ClienteVistasController = {

    // Vista "Mis apartados"
    // Muestra solo los apartados que el cliente creó
    mostrarVerApartados: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/catalogo?login=1');
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        ApartadoModel.obtenerApartadosPorCliente(nombreCliente, (error, apartados) => {
            if (error) {
                console.error('Error al consultar apartados:', error);
                return res.status(500).send('Error en el servidor');
            }

            const listaApartadosRaw = Array.isArray(apartados) ? apartados : [];

            asociarImagenesAProductos(listaApartadosRaw, (apartadosConImagen) => {
                res.render('verApartados', {
                    apartados: apartadosConImagen,
                    usuario: req.session.usuario
                });
            });
        });
    },

    // Vista "Mi perfil"
    // Muestra sus datos y le permite editarlos.
    // Es solo para clientes; el admin va a su panel.
    mostrarPerfil: async (req, res) => {
        const usuarioSesion = req.session?.usuario;
        if (!usuarioSesion) {
            return res.redirect('/');
        }

        const rol = String(usuarioSesion.role || '').trim().toLowerCase();
        if (rol === 'admin' || rol === 'aprendiz') {
            return res.redirect('/admin');
        }

        try {
            // Traigo los datos frescos desde la BD por si cambiaron
            const cliente = await UsuarioModel.obtenerClientePorId(usuarioSesion.id);

            if (!cliente) {
                req.session.destroy(() => {});
                return res.redirect('/catalogo?login=1');
            }

            res.render('perfil', {
                cliente,
                usuario: usuarioSesion
            });
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            return res.status(500).send('Error en el servidor');
        }
    }
};

module.exports = ClienteVistasController;
