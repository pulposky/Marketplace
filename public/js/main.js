// =============================================
// PÁGINA PRINCIPAL - JAVASCRIPT
// =============================================
// Script de la página principal del marketplace.
// Controla los modales de login y apartado, la
// verificación de sesión y el envío de apartados.
//
// Cuando un usuario quiere apartar un producto:
//   1. Se abre el modal de apartado
//   2. Si no está logueado, se abre el modal de login
//   3. Se envía el apartado a la API
//   4. Se recarga la página
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los modales
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    // Botones para cerrar los modales
    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');
    const botonAbrirLogin = document.getElementById('abrirModalLogin');

    // Elementos del modal de apartado
    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const inputCantidadApartar = document.getElementById('cantidadApartar');
    const formularioApartado = document.getElementById('formConfirmarApartado');
    const formularioLogin = document.getElementById('formLogin');
    const imagenApartar = document.getElementById('apartarImagenProducto');

    // -----------------------------------------------
    // ABRIR MODAL DE APARTADO
    // -----------------------------------------------
    // Llena los datos del producto en el modal y lo muestra
    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre || '';
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio || '';
        if (campoIdProducto) campoIdProducto.value = datosProducto.id || '';

        // Configuro el input de cantidad con el límite disponible
        if (inputCantidadApartar) {
            const limite = parseInt(datosProducto.limite) || 0;
            inputCantidadApartar.value = limite > 0 ? 1 : 0;
            inputCantidadApartar.min = limite > 0 ? 1 : 0;
            inputCantidadApartar.max = limite;
        }

        // Muestro u oculto la imagen del producto
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

    // -----------------------------------------------
    // VERIFICAR SI HAY SESIÓN ACTIVA
    // -----------------------------------------------
    async function verificarSesion() {
        try {
            const respuestaSesion = await fetch('/api/verificar-sesion');
            return await respuestaSesion.json();
        } catch (error) {
            console.error('Error al verificar la sesión:', error);
            return { login: false };
        }
    }

    // -----------------------------------------------
    // BOTONES DE "APARTAR" EN CADA PRODUCTO
    // -----------------------------------------------
    // Cuando hago click en un botón de apartar, abro el modal
    // con los datos de ese producto específico
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', () => {
            const idObtenido = botonApartar.dataset.id || botonApartar.getAttribute('data-id');
            const nombreObtenido = botonApartar.dataset.nombre || botonApartar.getAttribute('data-nombre');
            const precioObtenido = botonApartar.dataset.precio || botonApartar.getAttribute('data-precio');
            const imgObtenida = botonApartar.dataset.imagen || botonApartar.getAttribute('data-imagen');
            const limiteObtenido = botonApartar.dataset.limite || botonApartar.getAttribute('data-limite');

            mostrarVentanaApartado({
                id: idObtenido,
                nombre: nombreObtenido,
                precio: precioObtenido,
                imagen: imgObtenida,
                limite: limiteObtenido
            });
        });
    });

    // -----------------------------------------------
    // FORMULARIO DE LOGIN (DENTRO DEL MODAL)
    // -----------------------------------------------
    if (formularioLogin) {
        // Muestro/oculto campos según si es login de cliente o usuario
        const tipoCliente = document.getElementById('tipo_cliente');
        const tipoUsuario = document.getElementById('tipo_usuario');
        const clienteFields = document.getElementById('clienteFields');
        const usuarioFields = document.getElementById('usuarioFields');

        function actualizarCampos() {
            const tipo = document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente';
            if (tipo === 'cliente') {
                if (clienteFields) clienteFields.style.display = 'block';
                if (usuarioFields) usuarioFields.style.display = 'none';
            } else {
                if (clienteFields) clienteFields.style.display = 'none';
                if (usuarioFields) usuarioFields.style.display = 'block';
            }
        }

        if (tipoCliente) tipoCliente.addEventListener('change', actualizarCampos);
        if (tipoUsuario) tipoUsuario.addEventListener('change', actualizarCampos);
        actualizarCampos(); // Estado inicial

        // Envío del formulario de login
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const tipo = document.querySelector('input[name="tipoLogin"]:checked')?.value || 'cliente';

            let payload = {};
            if (tipo === 'cliente') {
                payload.documento = document.getElementById('doc')?.value || '';
            } else {
                payload.usuario = document.getElementById('user')?.value || '';
                payload.password = document.getElementById('pwd')?.value || '';
            }

            const resultado = await procesarLogin(payload);
            if (resultado && resultado.ok) {
                // Si es admin/aprendiz, redirijo al panel; si no, recargo la página
                if (resultado.redirect) {
                    window.location.href = resultado.redirect;
                    return;
                }
                window.location.reload();
            }
        });
    }

    // -----------------------------------------------
    // FORMULARIO DE APARTADO
    // -----------------------------------------------
    // Valida los datos, verifica la sesión, y envía el apartado
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const idVal = campoIdProducto ? campoIdProducto.value : '';
            const cantidadVal = parseInt(inputCantidadApartar?.value) || 0;
            const maxVal = parseInt(inputCantidadApartar?.max) || 0;

            if (!idVal) {
                alert('Error: No se ha detectado la ID del producto.');
                console.error('campoIdProducto está vacío al intentar enviar.');
                return;
            }

            if (maxVal > 0 && cantidadVal > maxVal) {
                alert(`No puedes apartar más del límite disponible (${maxVal}).`);
                return;
            }

            // Si no está logueado, abro el modal de login
            const estadoSesion = await verificarSesion();
            if (!estadoSesion.login) {
                if (ventanaLogin) ventanaLogin.style.display = 'flex';
                return;
            }

            const datosApartado = {
                productoId: idVal,
                cantidad: cantidadVal
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
                } catch (err) {
                    console.error('Respuesta no válida de la API:', err);
                }

                if (respuestaApartar.ok) {
                    alert(datosRespuesta.mensaje || '¡Producto apartado con éxito!');
                    window.location.reload();
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset();
                } else if (respuestaApartar.status === 401) {
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                    alert(datosRespuesta.error || 'Debes iniciar sesión para apartar este producto.');
                } else {
                    alert(datosRespuesta.error || datosRespuesta.mensaje || 'Error al procesar el apartado.');
                }
            } catch (error) {
                console.error('Error de red al apartar producto:', error);
            }
        });
    }

    // -----------------------------------------------
    // ABRIR / CERRAR MODALES
    // -----------------------------------------------
    if (botonAbrirLogin && ventanaLogin) {
        botonAbrirLogin.addEventListener('click', () => {
            ventanaLogin.style.display = 'flex';
        });
    }

    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    // Si hago click afuera del modal (en el overlay), se cierra
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});
