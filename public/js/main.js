// Script de la página principal del marketplace.
// Controla los modales de login y apartado, la verificación de sesión y el envío de apartados.
document.addEventListener('DOMContentLoaded', () => {
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');
    const botonAbrirLogin = document.getElementById('abrirModalLogin');

    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const inputCantidadApartar = document.getElementById('cantidadApartar'); // <-- CAPTURAMOS EL INPUT DE CANTIDAD
    const formularioApartado = document.getElementById('formConfirmarApartado');
    const formularioLogin = document.getElementById('formLogin');
    const imagenApartar = document.getElementById('apartarImagenProducto');

    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre || '';
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio || '';
        if (campoIdProducto) campoIdProducto.value = datosProducto.id || '';

        // CONFIGURAR EL INPUT DE CANTIDAD CON EL LÍMITE
        if (inputCantidadApartar) {
            const limite = parseInt(datosProducto.limite) || 0;
            inputCantidadApartar.value = limite > 0 ? 1 : 0;
            inputCantidadApartar.min = limite > 0 ? 1 : 0;
            inputCantidadApartar.max = limite; // Se establece el máximo según el stock/límite disponible
        }

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

    async function verificarSesion() {
        try {
            const respuestaSesion = await fetch('/api/verificar-sesion');
            return await respuestaSesion.json();
        } catch (error) {
            console.error('Error al verificar la sesión:', error);
            return { login: false };
        }
    }

    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', () => {
            const idObtenido = botonApartar.dataset.id || botonApartar.getAttribute('data-id');
            const nombreObtenido = botonApartar.dataset.nombre || botonApartar.getAttribute('data-nombre');
            const precioObtenido = botonApartar.dataset.precio || botonApartar.getAttribute('data-precio');
            const imgObtenida = botonApartar.dataset.imagen || botonApartar.getAttribute('data-imagen');
            // EXTRAEMOS EL LÍMITE/CANTIDAD DESDE EL BOTÓN
            const limiteObtenido = botonApartar.dataset.limite || botonApartar.getAttribute('data-limite');

            mostrarVentanaApartado({
                id: idObtenido,
                nombre: nombreObtenido,
                precio: precioObtenido,
                imagen: imgObtenida,
                limite: limiteObtenido // PASSING LIMITE TO THE FUNCTION
            });
        });
    });

    if (formularioLogin) {
        // Mostrar/ocultar campos según tipo de login
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
        // Inicializar estado
        actualizarCampos();

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
                if (resultado.redirect) {
                    window.location.href = resultado.redirect;
                    return;
                }
                window.location.reload();
            }
        });
    }

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

    if (botonAbrirLogin && ventanaLogin) {
        botonAbrirLogin.addEventListener('click', () => {
            ventanaLogin.style.display = 'flex';
        });
    }

    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});