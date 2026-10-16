// =============================================
// RECUPERACION ADMINISTRADA DE CLAVES DE CLIENTES
// =============================================
// Solicito el restablecimiento y muestro la clave
// temporal una sola vez para entregarla al cliente.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formRecuperacionCliente');
    const campoDocumento = document.getElementById('documentoCliente');
    const botonRestablecer = document.getElementById('btnRestablecerCliente');
    const resultado = document.getElementById('resultadoRecuperacion');
    const nombre = document.getElementById('nombreClienteRecuperado');
    const mensaje = document.getElementById('mensajeRecuperacion');
    const clave = document.getElementById('claveTemporal');
    const botonCopiar = document.getElementById('btnCopiarClave');
    const formularioContacto = document.getElementById('formContactoRecuperacion');
    const campoTelefono = document.getElementById('telefonoRecuperacion');
    const botonGuardarContacto = document.getElementById('btnGuardarContacto');
    const estadoContacto = document.getElementById('estadoContacto');

    // Cargo el número que ya está publicado para que el Administrador pueda editarlo.
    async function cargarContacto() {
        try {
            const respuesta = await fetch('/api/admin/recuperacion/contacto', { cache: 'no-store' });
            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar el teléfono.');
            if (campoTelefono) campoTelefono.value = datos.telefono || '';
        } catch (error) {
            if (estadoContacto) estadoContacto.textContent = error.message;
        }
    }
    cargarContacto();

    // Guardo el teléfono que se mostrará en el aviso público de recuperación.
    formularioContacto?.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (botonGuardarContacto) botonGuardarContacto.disabled = true;
        try {
            const respuesta = await fetch('/api/admin/recuperacion/contacto', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telefono: campoTelefono?.value?.trim() || '' })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok) {
                const mensajeError = datos.mensaje || datos.error || `No se pudo guardar el teléfono (HTTP ${respuesta.status}).`;
                toast('error', mensajeError);
                if (estadoContacto) estadoContacto.textContent = mensajeError;
                return;
            }
            if (estadoContacto) estadoContacto.textContent = datos.mensaje;
            toast('exito', datos.mensaje);
        } catch (error) {
            console.error('Error guardando el teléfono de recuperación:', error);
            toast('error', 'No se pudo conectar con el servidor.');
        } finally {
            if (botonGuardarContacto) botonGuardarContacto.disabled = false;
        }
    });

    // Restablezco la clave solo tras la confirmación explícita del Administrador.
    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const documento = campoDocumento?.value?.trim() || '';
        if (!documento) {
            toast('advertencia', 'Ingresa el documento del cliente.');
            return;
        }
        if (!window.confirm('La contraseña anterior dejará de funcionar. ¿Deseas generar una clave temporal?')) {
            return;
        }

        if (resultado) resultado.style.display = 'none';
        if (clave) clave.textContent = '';
        if (botonRestablecer) botonRestablecer.disabled = true;
        try {
            const respuesta = await fetch('/api/admin/recuperacion/cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documento })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok) {
                toast('error', datos.mensaje || 'No se pudo restablecer la contraseña.');
                return;
            }

            if (nombre) nombre.textContent = `Cuenta restablecida: ${datos.cliente.nombre}`;
            if (mensaje) mensaje.textContent = datos.mensaje;
            if (clave) clave.textContent = datos.passwordTemporal;
            if (resultado) resultado.style.display = 'block';
            toast('exito', 'Contraseña temporal generada.');
        } catch (error) {
            console.error('Error restableciendo la contraseña del cliente:', error);
            toast('error', 'No se pudo conectar con el servidor.');
        } finally {
            if (botonRestablecer) botonRestablecer.disabled = false;
        }
    });

    // Copio la clave visible para facilitar su entrega segura al cliente.
    botonCopiar?.addEventListener('click', async () => {
        const texto = clave?.textContent || '';
        if (!texto) return;
        try {
            await navigator.clipboard.writeText(texto);
            toast('exito', 'Clave copiada.');
        } catch (error) {
            const auxiliar = document.createElement('textarea');
            auxiliar.value = texto;
            document.body.appendChild(auxiliar);
            auxiliar.select();
            const copiado = document.execCommand('copy');
            auxiliar.remove();
            toast(copiado ? 'exito' : 'error', copiado ? 'Clave copiada.' : 'No se pudo copiar la clave.');
        }
    });
});
