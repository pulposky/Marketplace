// Variable global para capturar la respuesta del login desde otros scripts
window.resultadoLoginUltimo = null;

async function procesarLogin(documento) {
    const etiquetaMensaje = document.getElementById('mensaje');

    try {
        const respuesta = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento })
        });

        const datos = await respuesta.json();
        window.resultadoLoginUltimo = datos;

        if (datos.ok) {
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = "none";
                etiquetaMensaje.textContent = "";
                etiquetaMensaje.className = "mensaje-error";
            }
            return true; // Login exitoso
        } else {
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = "block";
                etiquetaMensaje.textContent = datos.mensaje;

                if (datos.tipo === "vacio") {
                    etiquetaMensaje.className = "mensaje-error mensaje-naranja";
                } else {
                    etiquetaMensaje.className = "mensaje-error mensaje-rojo";
                }
            }
            document.getElementById('doc').value = '';
            return false; // Credenciales incorrectas
        }
    } catch (error) {
        console.error('Error en login:', error);
        if (etiquetaMensaje) {
            etiquetaMensaje.style.display = "block";
            etiquetaMensaje.textContent = 'Error de conexión con el servidor';
            etiquetaMensaje.className = "mensaje-error mensaje-rojo";
        }
        return false;
    }
}