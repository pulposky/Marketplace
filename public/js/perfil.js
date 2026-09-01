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
        const nuevaPassword = document.getElementById('perfilNuevaPassword')?.value || '';
        const confirmarPassword = document.getElementById('perfilConfirmarPassword')?.value || '';

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

        // Validación de la nueva contraseña (si quiere cambiarla)
        const deseaCambiar = nuevaPassword !== '' || confirmarPassword !== '';
        if (deseaCambiar) {
            if (nuevaPassword.length < 6) {
                toast('advertencia', 'La nueva contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (nuevaPassword !== confirmarPassword) {
                toast('advertencia', 'Las contraseñas nuevas no coinciden.');
                return;
            }
        }

        botonGuardar.disabled = true;
        botonGuardar.textContent = 'Guardando...';

        try {
            const respuesta = await fetch('/api/perfil', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ nombre, telefono, direccion, password, nuevaPassword: deseaCambiar ? nuevaPassword : null })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok && data.ok) {
                toast('exito', data.mensaje || 'Perfil actualizado correctamente.');
                // Limpio los campos de seguridad
                const pwdInput = document.getElementById('perfilPassword');
                if (pwdInput) pwdInput.value = '';
                const nuevaInput = document.getElementById('perfilNuevaPassword');
                if (nuevaInput) nuevaInput.value = '';
                const confirmInput = document.getElementById('perfilConfirmarPassword');
                if (confirmInput) confirmInput.value = '';
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
