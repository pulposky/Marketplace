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
// =============================================

// Variable global para guardar el último resultado del login
// (por si otro script necesita acceder a ella)
window.resultadoLoginUltimo = null;

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
            // Login fallido: muestro el mensaje de error
            // Color naranja si el campo está vacío, rojo si las credenciales son incorrectas
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'block';
                etiquetaMensaje.textContent = datos.mensaje;
                etiquetaMensaje.className = datos.tipo === 'vacio' ? 'mensaje-error mensaje-naranja' : 'mensaje-error mensaje-rojo';
            }
            // Limpio los campos de entrada
            const docInput = document.getElementById('doc');
            const pwdInput = document.getElementById('pwd');
            const userInput = document.getElementById('user');
            if (docInput) docInput.value = '';
            if (pwdInput) pwdInput.value = '';
            if (userInput) userInput.value = '';
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
