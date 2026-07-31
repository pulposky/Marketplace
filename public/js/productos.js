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

    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;
        
        if (ventanaApartar) ventanaApartar.style.display = 'flex';
    }

    // Botones de apartar en la rejilla del catálogo
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', async () => {
            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio
            };

            try {
                const respuestaSesion = await fetch("/api/verificar-sesion");
                const estadoSesion = await respuestaSesion.json();

                if (estadoSesion.login) {
                    mostrarVentanaApartado(infoProducto);
                } else {
                    // Si no ha iniciado sesión, despliega el modal de login
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                }
            } catch (error) {
                console.error("Error al verificar la sesión:", error);
            }
        });
    });

    // Delegación del formulario de Login
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const usuarioIngresado = document.getElementById('usuario').value;
            const claveIngresada = document.getElementById('password').value;

            const esExitoso = await procesarLogin(usuarioIngresado, claveIngresada);

            if (esExitoso) {
                // Recarga la vista mediante tu ruta para que EJS habilite la sesión y la barra lateral
                window.location.reload();
            }
        });
    }

    // Formulario de Apartado
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const datosApartado = {
                productoId: campoIdProducto.value,
                cantidad: document.getElementById('cantidadApartar').value
            };

            try {
                const respuestaApartar = await fetch("/api/apartar-producto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosApartado)
                });

                if (respuestaApartar.ok) {
                    alert("¡Producto apartado con éxito!");
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset();
                } else {
                    alert("Error al procesar el apartado.");
                }
            } catch (error) {
                console.error("Error al apartar producto:", error);
            }
        });
    }

    // Cierre de modales
    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});