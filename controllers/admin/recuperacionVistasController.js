// =============================================
// VISTA DE RECUPERACION DE CUENTAS DE CLIENTES
// =============================================
// Renderizo el módulo privado donde el Administrador
// emite una contraseña temporal para un cliente.
// =============================================

const RecuperacionVistasController = {
    // Renderizo la pantalla de restablecimiento asistido.
    mostrarRecuperacion: (req, res) => {
        return res.render('admin/recuperacionPassword', {
            usuario: req.session.usuario
        });
    }
};

module.exports = RecuperacionVistasController;
