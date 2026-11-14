// =============================================
// LOGIN - Inicio de sesión (cliente y staff del panel)
// =============================================
// Función para procesar el login desde los modales.
// Se usa tanto en main.ejs como en productos.ejs.
//
// Soporta dos tipos de payload:
//   - { documento, password } → login de cliente
//   - { usuario, password } → login del staff del panel
//
// Muestra mensajes de error o éxito en el
// elemento #mensaje del modal.
//
// Además expone configurarFormLogin(formulario, opciones),
// que cablea el formulario del modal.
// =============================================

// Variable global para guardar el último resultado del login
// (por si otro script necesita acceder a ella)
window.resultadoLoginUltimo = null;

// Limpia el mensaje del modal #mensaje
function limpiarMensajeLogin() {
    const etiquetaMensaje = document.getElementById('mensaje');
    if (etiquetaMensaje) {
        etiquetaMensaje.style.display = 'none';
        etiquetaMensaje.textContent = '';
        etiquetaMensaje.className = 'mensaje-error';
    }
}

// Muestra un mensaje en el modal #mensaje con la clase indicada
// (mensaje-rojo, mensaje-naranja o mensaje-exito)
function mostrarMensajeLogin(texto, clase) {
    const etiquetaMensaje = document.getElementById('mensaje');
    if (etiquetaMensaje) {
        etiquetaMensaje.style.display = 'block';
        etiquetaMensaje.textContent = texto;
        etiquetaMensaje.className = `mensaje-error ${clase}`;
    }
}

// Recibe el payload, hace POST a /login, y muestra el resultado
async function procesarLogin(payload) {
    const etiquetaMensaje = document.getElementById('mensaje');

    try {
        const respuesta = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        const datos = await respuesta.json();
        window.resultadoLoginUltimo = datos;

        // Si el servidor respondió un error de sesión/seguridad (p. ej.
        // el token CSRF caducó), muestro un mensaje claro en vez de un
        // cuadro rojo vacío. El wrapper de csrf.js ya recarga la página
        // automáticamente en el caso 403.
        if (!datos || typeof datos !== 'object' || (datos.error && !datos.ok)) {
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'block';
                etiquetaMensaje.textContent = datos && datos.error
                    ? datos.error
                    : 'Tu sesión expiró. Recarga la página e intenta de nuevo.';
                etiquetaMensaje.className = 'mensaje-error mensaje-rojo';
            }
            return false;
        }

        if (datos.ok) {
            // Login exitoso: limpio el mensaje de error si existía
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'none';
                etiquetaMensaje.textContent = '';
                etiquetaMensaje.className = 'mensaje-error';
            }
            return datos;
        } else {
            // Login fallido o paso intermedio: muestro el mensaje
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'block';
                etiquetaMensaje.textContent = datos.mensaje;
                // Color según el tipo: vacío→naranja, éxito→verde, resto→rojo
                if (datos.tipo === 'vacio' || datos.tipo === 'naranja') {
                    etiquetaMensaje.className = 'mensaje-error mensaje-naranja';
                } else if (datos.tipo === 'exito') {
                    etiquetaMensaje.className = 'mensaje-error mensaje-exito';
                } else {
                    etiquetaMensaje.className = 'mensaje-error mensaje-rojo';
                }
            }
            // Solo borro las contraseñas; el documento o usuario se conservan para reintentar
            const pwdInput = document.getElementById('pwd');
            const pwdClienteInput = document.getElementById('pwdCliente');
            if (pwdInput) pwdInput.value = '';
            if (pwdClienteInput) pwdClienteInput.value = '';
            return datos;
        }
    } catch (error) {
        // Error de red o del servidor
        console.error('Error en login:', error);
        if (etiquetaMensaje) {
            etiquetaMensaje.style.display = 'block';
            etiquetaMensaje.textContent = 'Error de conexión con el servidor';
            etiquetaMensaje.className = 'mensaje-error mensaje-rojo';
        }
        return false;
    }
}

// =============================================
// CONFIGURAR FORMULARIO DE LOGIN
// =============================================
// Cliente: documento y contraseña en un solo envío.
// Personal de la tienda: usuario y contraseña.
// opciones.alLoginExitoso: función opcional que se llama al
//   loguearse un cliente (p. ej. para ir a /verApartados).
//   Si no se provee, recarga la página.
function configurarFormLogin(formulario, opciones) {
    if (!formulario) return;

    const alLoginExitoso = (opciones && opciones.alLoginExitoso) || null;
    const clienteFields = document.getElementById('clienteFields');
    const usuarioFields = document.getElementById('usuarioFields');
    const boton = document.getElementById('btnLoginSubmit');

    // Muestra los campos del tipo de cuenta elegido
    function actualizarCampos() {
        const esCliente = (document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente') === 'cliente';
        if (clienteFields) clienteFields.style.display = esCliente ? 'block' : 'none';
        if (usuarioFields) usuarioFields.style.display = esCliente ? 'none' : 'block';
        limpiarMensajeLogin();
    }
    document.querySelectorAll('input[name="tipoLogin"]').forEach((radio) => radio.addEventListener('change', actualizarCampos));
    actualizarCampos();

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const esCliente = (document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente') === 'cliente';

        let payload;
        if (esCliente) {
            const documento = (document.getElementById('doc')?.value || '').trim();
            const password = document.getElementById('pwdCliente')?.value || '';
            if (!documento || !password) {
                mostrarMensajeLogin('Escribe tu documento y tu contraseña.', 'mensaje-naranja');
                return;
            }
            payload = { documento, password };
        } else {
            payload = {
                usuario: document.getElementById('user')?.value || '',
                password: document.getElementById('pwd')?.value || ''
            };
        }

        if (boton) boton.disabled = true;
        const resultado = await procesarLogin(payload);
        if (boton) boton.disabled = false;
        if (!resultado || !resultado.ok) return;

        if (resultado.redirect) {
            window.location.href = resultado.redirect;
        } else if (esCliente && alLoginExitoso) {
            alLoginExitoso();
        } else {
            window.location.reload();
        }
    });
}

// Enlaces como "Inicia sesión para apartar" (ficha de producto) llegan con
// ?login=1&desde=producto: abro el login aquí y limpio la URL antes de que
// productos.js lo tome como redirección desde /verApartados (aviso + ir a apartados).
(function abrirLoginSinAvisoApartados() {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('login') !== '1' || !parametros.get('desde')) return;
    const ventanaLogin = document.getElementById('modalLogin');
    if (ventanaLogin) ventanaLogin.style.display = 'flex';
    window.history.replaceState({}, '', window.location.pathname);
})();
