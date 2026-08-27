// =============================================
// LOGIN - JAVASCRIPT COMPARTIDO
// =============================================
// Función para procesar el login desde los modales.
// Se usa tanto en main.ejs como en productos.ejs.
//
// Soporta dos tipos de payload:
//   - { documento } → login de cliente
//   - { usuario, password } → login de admin/aprendiz
//
// Muestra mensajes de error o éxito en el
// elemento #mensaje del modal.
//
// Además expone configurarFormLogin(formulario, opciones),
// que cablea todo el flujo de login del cliente en varios
// pasos:
//   1. Documento → si el cliente no tiene contraseña, pide
//      crearla; si ya tiene, pide digitarla.
//   2. Creada la contraseña, vuelve a pedir documento y
//      contraseña para iniciar sesión.
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
            // Limpio los campos de entrada (solo los de admin/verificación)
            const docInput = document.getElementById('doc');
            const pwdInput = document.getElementById('pwd');
            const userInput = document.getElementById('user');
            const pwdClienteInput = document.getElementById('pwdCliente');
            if (docInput) docInput.value = '';
            if (pwdInput) pwdInput.value = '';
            if (userInput) userInput.value = '';
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
// CONFIGURAR FORMULARIO DE LOGIN (multi-paso cliente)
// =============================================
// opciones.alLoginExitoso: función opcional que se llama al
//   loguearse correctamente (para redirigir a /verApartados).
//   Si no se provee, recarga la página.
function configurarFormLogin(formulario, opciones) {
    if (!formulario) return;

    const alLoginExitoso = (opciones && opciones.alLoginExitoso) || null;

    const tipoCliente = document.getElementById('tipo_cliente');
    const tipoUsuario = document.getElementById('tipo_usuario');
    const clienteFields = document.getElementById('clienteFields');
    const usuarioFields = document.getElementById('usuarioFields');

    const campoDoc = document.getElementById('campoDoc');
    const campoPwd = document.getElementById('campoPwd');
    const campoNuevaPwd = document.getElementById('campoNuevaPwd');
    const campoConfirmPwd = document.getElementById('campoConfirmPwd');

    const inputDoc = document.getElementById('doc');
    const inputPwd = document.getElementById('pwdCliente');
    const inputNueva = document.getElementById('nuevaPwd');
    const inputConfirm = document.getElementById('confirmPwd');
    const boton = document.getElementById('btnLoginSubmit');
    const enlaceOlvideLogin = document.getElementById('enlaceOlvideLogin');

    // Muestra u oculta el enlace "Olvidé mi contraseña"
    // (solo debe verse cuando se ingresa la contraseña existente)
    function mostrarEnlaceOlvide(visible) {
        if (enlaceOlvideLogin) {
            enlaceOlvideLogin.style.display = visible ? 'block' : 'none';
        }
    }

    // Estado del flujo del cliente
    // 'documento' | 'clave_existente' | 'crear_clave'
    let paso = 'documento';
    let documentoActual = '';

    // Muestra los campos base del cliente (solo documento)
    function estadoDocumento() {
        paso = 'documento';
        documentoActual = '';
        if (campoDoc) campoDoc.style.display = 'block';
        if (campoPwd) campoPwd.style.display = 'none';
        if (campoNuevaPwd) campoNuevaPwd.style.display = 'none';
        if (campoConfirmPwd) campoConfirmPwd.style.display = 'none';
        if (boton) boton.textContent = 'Iniciar sesión';
        if (inputDoc) inputDoc.value = '';
        if (inputPwd) inputPwd.value = '';
        if (inputNueva) inputNueva.value = '';
        if (inputConfirm) inputConfirm.value = '';
        mostrarEnlaceOlvide(false);
    }

    function mostrarCliente() {
        if (clienteFields) clienteFields.style.display = 'block';
        if (usuarioFields) usuarioFields.style.display = 'none';
        estadoDocumento();
    }

    function mostrarUsuario() {
        if (usuarioFields) usuarioFields.style.display = 'block';
        if (clienteFields) clienteFields.style.display = 'none';
        if (boton) boton.textContent = 'Iniciar sesión';
    }

    function actualizarCampos() {
        const tipo = document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente';
        if (tipo === 'cliente') {
            mostrarCliente();
        } else {
            mostrarUsuario();
        }
    }

    if (tipoCliente) tipoCliente.addEventListener('change', actualizarCampos);
    if (tipoUsuario) tipoUsuario.addEventListener('change', actualizarCampos);
    actualizarCampos();

    // Envío del formulario
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const tipo = document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente';

        // ----- LOGIN ADMIN / APRENDIZ -----
        if (tipo === 'usuario') {
            const payload = {
                usuario: document.getElementById('user')?.value || '',
                password: document.getElementById('pwd')?.value || ''
            };
            const resultado = await procesarLogin(payload);
            if (resultado && resultado.ok) {
                if (resultado.redirect) {
                    window.location.href = resultado.redirect;
                    return;
                }
                window.location.reload();
            }
            return;
        }

        // ----- LOGIN CLIENTE -----

        // PASO 1: ingresa el documento
        if (paso === 'documento') {
            const doc = (inputDoc?.value || '').trim();
            if (!doc) {
                mostrarMensajeLogin('El campo documento no puede estar vacío', 'mensaje-naranja');
                return;
            }
            documentoActual = doc;
            const resultado = await procesarLogin({ documento: doc });
            if (!resultado || resultado.ok) return;

            if (resultado.necesitaPassword) {
                // No tiene contraseña: muestro campos para crearla
                paso = 'crear_clave';
                if (campoDoc) campoDoc.style.display = 'none';
                if (campoPwd) campoPwd.style.display = 'none';
                if (campoNuevaPwd) campoNuevaPwd.style.display = 'block';
                if (campoConfirmPwd) campoConfirmPwd.style.display = 'block';
                if (boton) boton.textContent = 'Crear contraseña';
                limpiarMensajeLogin();
                mostrarEnlaceOlvide(false);
            } else if (resultado.requierePassword) {
                // Ya tiene contraseña: muestro el campo de contraseña
                paso = 'clave_existente';
                if (campoDoc) campoDoc.style.display = 'none';
                if (campoPwd) campoPwd.style.display = 'block';
                if (campoNuevaPwd) campoNuevaPwd.style.display = 'none';
                if (campoConfirmPwd) campoConfirmPwd.style.display = 'none';
                if (boton) boton.textContent = 'Iniciar sesión';
                limpiarMensajeLogin();
                mostrarEnlaceOlvide(true);
            }
            return;
        }

        // PASO 2: crea una nueva contraseña
        if (paso === 'crear_clave') {
            const nueva = (inputNueva?.value || '');
            const confirm = (inputConfirm?.value || '');
            if (!nueva) {
                mostrarMensajeLogin('La contraseña no puede estar vacía', 'mensaje-naranja');
                return;
            }
            if (nueva.length < 6) {
                mostrarMensajeLogin('La contraseña debe tener al menos 6 caracteres', 'mensaje-naranja');
                return;
            }
            if (nueva !== confirm) {
                mostrarMensajeLogin('Las contraseñas no coinciden', 'mensaje-rojo');
                return;
            }
            const resultado = await procesarLogin({ documento: documentoActual, nuevaPassword: nueva });
            if (resultado && resultado.passwordCreada) {
                // Vuelvo al paso de documento: ahora debe iniciar sesión con su contraseña
                paso = 'documento';
                if (campoDoc) campoDoc.style.display = 'block';
                if (campoPwd) campoPwd.style.display = 'none';
                if (campoNuevaPwd) campoNuevaPwd.style.display = 'none';
                if (campoConfirmPwd) campoConfirmPwd.style.display = 'none';
                if (boton) boton.textContent = 'Iniciar sesión';
                if (inputNueva) inputNueva.value = '';
                if (inputConfirm) inputConfirm.value = '';
                if (inputDoc) inputDoc.value = documentoActual;
                mostrarEnlaceOlvide(false);
                // Muestro un mensaje de éxito para guiar el siguiente paso
                mostrarMensajeLogin(
                    'Contraseña creada correctamente. Ingresa tu contraseña para continuar.',
                    'mensaje-exito'
                );
            }
            return;
        }

        // PASO 3: ya tiene contraseña, la verifica
        if (paso === 'clave_existente') {
            const pwd = (inputPwd?.value || '');
            if (!pwd) {
                mostrarMensajeLogin('El campo contraseña no puede estar vacío', 'mensaje-naranja');
                return;
            }
            const resultado = await procesarLogin({ documento: documentoActual, password: pwd });
            if (resultado && resultado.ok) {
                if (resultado.redirect) {
                    window.location.href = resultado.redirect;
                    return;
                }
                if (alLoginExitoso) {
                    alLoginExitoso();
                    return;
                }
                window.location.reload();
            }
        }
    });
}
