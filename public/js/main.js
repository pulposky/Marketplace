// Script de la página principal del marketplace.
// Controla los modales de login y apartado, la verificación de sesión y el envío de apartados.
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. REFERENCIAS A ELEMENTOS DEL DOM
    // ==========================================
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');

    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const formularioApartado = document.getElementById('formConfirmarApartado');
    const formularioLogin = document.getElementById('formLogin');

    // ==========================================
    // 2. FUNCIONES AUXILIARES
    // ==========================================
    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre || '';
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio || '';
        if (campoIdProducto) campoIdProducto.value = datosProducto.id || ''; // <--- Se asigna la ID al input oculto
        
        if (ventanaApartar) ventanaApartar.style.display = 'flex';
    }

    async function requerirLogin(accionSiAutenticado) {
        try {
            const respuestaSesion = await fetch("/api/verificar-sesion");
            const estadoSesion = await respuestaSesion.json();

            if (estadoSesion.login) {
                accionSiAutenticado();
            } else {
                if (ventanaLogin) ventanaLogin.style.display = 'flex';
            }
        } catch (error) {
            console.error("Error al verificar la sesión:", error);
        }
    }

    // ==========================================
    // 3. EVENTOS DE BOTONES APARTAR
    // ==========================================
    document.querySelectorAll('.accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', () => {
            // Lee dataset.id o fallback a getAttribute si data-id falla
            const idObtenido = botonApartar.dataset.id || botonApartar.getAttribute('data-id');
            const nombreObtenido = botonApartar.dataset.nombre || botonApartar.getAttribute('data-nombre');
            const precioObtenido = botonApartar.dataset.precio || botonApartar.getAttribute('data-precio');

            const infoProducto = {
                id: idObtenido,
                nombre: nombreObtenido,
                precio: precioObtenido
            };

            requerirLogin(() => {
                mostrarVentanaApartado(infoProducto);
            });
        });
    });

    document.querySelectorAll('.enlace-protegido').forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            const destino = enlace.href;

            requerirLogin(() => {
                window.location.href = destino;
            });
        });
    });

    // ==========================================
    // 4. ENVÍO DE FORMULARIOS
    // ==========================================
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

    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const idVal = campoIdProducto ? campoIdProducto.value : '';
            const cantidadVal = document.getElementById('cantidadApartar')?.value;

            // Validación en el cliente antes de enviar la petición
            if (!idVal) {
                alert("Error: No se ha detectado la ID del producto.");
                console.error("campoIdProducto está vacío al intentar enviar.");
                return;
            }

            const datosApartado = {
                productoId: idVal,
                cantidad: cantidadVal
            };

            try {
                const respuestaApartar = await fetch("/api/apartar-producto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'same-origin',
                    body: JSON.stringify(datosApartado)
                });

                let datosRespuesta = {};
                try {
                    datosRespuesta = await respuestaApartar.json();
                } catch (err) {
                    console.error("Respuesta no válida de la API:", err);
                }

                if (respuestaApartar.ok) {
                    alert(datosRespuesta.mensaje || "¡Producto apartado con éxito!");
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset();
                } else {
                    alert(datosRespuesta.error || datosRespuesta.mensaje || "Error al procesar el apartado.");
                }
            } catch (error) {
                console.error("Error de red al apartar producto:", error);
            }
        });
    }

    // ==========================================
    // 5. CONTROL DE CIERRE DE MODALES
    // ==========================================
    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});