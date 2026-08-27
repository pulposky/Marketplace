// =============================================
// PERFIL DEL CLIENTE - JAVASCRIPT
// =============================================
// Maneja el formulario de "Mi perfil".
// Envía los datos por PATCH a /api/perfil y
// muestra un toast con el resultado.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const formulario = document.getElementById('formPerfil');
    const botonGuardar = document.getElementById('btnGuardarPerfil');

    if (!formulario) return;

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById('perfilNombre')?.value.trim() || '';
        const telefono = document.getElementById('perfilTelefono')?.value.trim() || '';
        const direccion = document.getElementById('perfilDireccion')?.value.trim() || '';
        const password = document.getElementById('perfilPassword')?.value || '';

        // Validaciones básicas antes de enviar
        if (!nombre) {
            toast('advertencia', 'El nombre no puede estar vacío.');
            return;
        }
        if (!telefono) {
            toast('advertencia', 'El teléfono no puede estar vacío.');
            return;
        }
        if (!password) {
            toast('advertencia', 'Debes ingresar tu contraseña para guardar los cambios.');
            return;
        }

        botonGuardar.disabled = true;
        botonGuardar.textContent = 'Guardando...';

        try {
            const respuesta = await fetch('/api/perfil', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ nombre, telefono, direccion, password })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok && data.ok) {
                toast('exito', data.mensaje || 'Perfil actualizado correctamente.');
                // Limpio el campo de contraseña por seguridad
                const pwdInput = document.getElementById('perfilPassword');
                if (pwdInput) pwdInput.value = '';
            } else {
                toast('error', data.mensaje || 'No se pudo actualizar el perfil.');
            }
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            toast('error', 'Error de conexión con el servidor.');
        } finally {
            botonGuardar.disabled = false;
            botonGuardar.textContent = 'Guardar cambios';
        }
    });

});
