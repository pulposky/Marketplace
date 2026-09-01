// =============================================
// GESTIÓN DE CARRUSEL - JAVASCRIPT
// =============================================
// Sube nuevas imágenes (base64) para la portada
// y permite eliminar las que ya no se necesitan.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const formulario = document.getElementById('formSubirImagen');
    const archivoInput = document.getElementById('archivoCarrusel');
    const nombreInput = document.getElementById('nombreCarrusel');
    const vistaPrevia = document.getElementById('vistaPrevia');
    const imagenPrevia = document.getElementById('imagenPrevia');
    const rejilla = document.getElementById('rejillaCarrusel');
    const totalImagenes = document.getElementById('totalImagenes');
    const sinResultados = document.getElementById('sinResultados');
    const botonSubir = document.getElementById('btnSubirImagen');

    // Vista previa al elegir el archivo
    archivoInput.addEventListener('change', () => {
        const archivo = archivoInput.files[0];
        if (!archivo) return;

        if (!/^image\/(jpeg|png|webp)$/i.test(archivo.type)) {
            toast('advertencia', 'Solo se permiten imágenes JPG, PNG o WebP.');
            archivoInput.value = '';
            vistaPrevia.hidden = true;
            return;
        }

        if (archivo.size > 3 * 1024 * 1024) {
            toast('advertencia', 'La imagen es demasiado pesada (máximo 3 MB).');
            archivoInput.value = '';
            vistaPrevia.hidden = true;
            return;
        }

        const lector = new FileReader();
        lector.onload = (e) => {
            imagenPrevia.src = e.target.result;
            vistaPrevia.hidden = false;
        };
        lector.readAsDataURL(archivo);
    });

    // Subir la imagen
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const archivo = archivoInput.files[0];
        if (!archivo) {
            toast('advertencia', 'Elige una imagen primero.');
            return;
        }

        if (!/^image\/(jpeg|png|webp)$/i.test(archivo.type)) {
            toast('advertencia', 'Solo se permiten imágenes JPG, PNG o WebP.');
            return;
        }
        if (archivo.size > 3 * 1024 * 1024) {
            toast('advertencia', 'La imagen es demasiado pesada (máximo 3 MB).');
            return;
        }

        botonSubir.disabled = true;
        botonSubir.textContent = 'Subiendo...';

        try {
            const dataURL = await new Promise((resuelta, rechazada) => {
                const lector = new FileReader();
                lector.onload = () => resuelta(lector.result);
                lector.onerror = () => rechazada(new Error('No se pudo leer la imagen.'));
                lector.readAsDataURL(archivo);
            });

            const respuesta = await fetch('/api/admin/carrusel/subir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imagen: dataURL,
                    nombre: nombreInput.value.trim()
                })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok && data.ok) {
                toast('exito', data.mensaje || 'Imagen subida correctamente.');
                formulario.reset();
                vistaPrevia.hidden = true;

                // Recargo la lista para ver la nueva imagen en su posición
                setTimeout(() => window.location.reload(), 900);
            } else {
                botonSubir.disabled = false;
                botonSubir.textContent = 'Subir al carrusel';
                toast('error', data.error || 'No se pudo subir la imagen.');
            }
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            botonSubir.disabled = false;
            botonSubir.textContent = 'Subir al carrusel';
            toast('error', 'Error de conexión con el servidor.');
        }
    });

    // Eliminar imagen (delegación de eventos)
    document.addEventListener('click', async (evento) => {
        const botonEliminar = evento.target.closest('.btn-eliminar');
        if (!botonEliminar) return;

        const nombre = botonEliminar.dataset.nombre;
        if (!confirm(`¿Eliminar "${nombre}" del carrusel?`)) return;

        botonEliminar.disabled = true;
        botonEliminar.textContent = 'Eliminando...';

        try {
            const respuesta = await fetch('/api/admin/carrusel/eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagen: nombre })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok && data.ok) {
                const tarjeta = botonEliminar.closest('.tarjeta-imagen');
                if (tarjeta) tarjeta.remove();
                toast('exito', data.mensaje || 'Imagen eliminada.');

                if (totalImagenes) {
                    const actual = Number(totalImagenes.textContent) || 0;
                    totalImagenes.textContent = String(Math.max(0, actual - 1));
                }
                if (rejilla && rejilla.children.length === 0 && sinResultados) {
                    sinResultados.style.display = 'block';
                }
            } else {
                botonEliminar.disabled = false;
                botonEliminar.textContent = 'Eliminar';
                toast('error', data.error || 'No se pudo eliminar la imagen.');
            }
        } catch (error) {
            console.error('Error eliminando imagen:', error);
            botonEliminar.disabled = false;
            botonEliminar.textContent = 'Eliminar';
            toast('error', 'Error de conexión con el servidor.');
        }
    });
});