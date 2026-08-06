// Script para la página de catálogo y el modal de apartado de producto
// Aquí se controla el login, el modal de apartado y el envío del formulario

// Script de la vista de catálogo.
// Muestra el modal de apartado, verifica la sesión y envía el apartado al backend.
document.addEventListener('DOMContentLoaded', () => {
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');

    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const formularioApartado = document.getElementById('formConfirmarApartado');
    const formularioLogin = document.getElementById('formLogin');
    const imagenApartar = document.getElementById('apartarImagenProducto');

    // Muestra el modal de apartado con los datos seleccionados del producto
    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;
        if (imagenApartar) {
            if (datosProducto.imagen) {
                imagenApartar.src = datosProducto.imagen;
                imagenApartar.alt = `Imagen de ${datosProducto.nombre}`;
                imagenApartar.style.display = 'block';
            } else {
                imagenApartar.src = '';
                imagenApartar.alt = '';
                imagenApartar.style.display = 'none';
            }
        }

        if (ventanaApartar) ventanaApartar.style.display = 'flex';
    }

    // Verifica si el usuario ya está autenticado antes de abrir el modal
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', async () => {
            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio,
                nota: botonApartar.dataset.nota || '',
                imagen: botonApartar.dataset.imagen || ''
            };

            try {
                const respuestaSesion = await fetch('/api/verificar-sesion');
                const estadoSesion = await respuestaSesion.json();

                if (estadoSesion.login) {
                    mostrarVentanaApartado(infoProducto);
                } else {
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                }
            } catch (error) {
                console.error('Error al verificar la sesión:', error);
            }
        });
    });

    // Login desde el modal de catálogo
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const usuarioIngresado = document.getElementById('doc').value;
            const esExitoso = await procesarLogin(usuarioIngresado);

            if (esExitoso) {
                window.location.reload(); 
            }
        });
    }

    // Envío del formulario de apartado al backend
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const datosApartado = {
                productoId: campoIdProducto.value,
                cantidad: document.getElementById('cantidadApartar').value
            };

            try {
                const respuestaApartar = await fetch('/api/apartar-producto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(datosApartado)
                });

                let datosRespuesta = {};
                try {
                    datosRespuesta = await respuestaApartar.json();
                } catch (error) {
                    console.error('Respuesta no JSON:', error);
                }

                if (respuestaApartar.ok) {
                    alert(datosRespuesta.mensaje || '¡Producto apartado con éxito!');
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset();
                } else {
                    alert(datosRespuesta.error || datosRespuesta.mensaje || 'Error al procesar el apartado.');
                }
            } catch (error) {
                console.error('Error al apartar producto:', error);
            }
        });
    }

    // Cierra los modales cuando el usuario hace clic en la 'X' o fuera del contenido
    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});