// Script del catálogo de productos.
// Aquí se controlan los modales, el login y el filtro de categorías desde la vista.

document.addEventListener('DOMContentLoaded', () => {
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');
    const botonAbrirLogin = document.getElementById('abrirModalLogin');

    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const formularioApartado = document.getElementById('formConfirmarApartado');
    const formularioLogin = document.getElementById('formLogin');
    const formularioCategorias = document.querySelector('.filtros-categorias-form');
    const imagenApartar = document.getElementById('apartarImagenProducto');
    const seccionProductos = document.querySelector('.rejilla-productos');

    // Elementos nuevos para la cantidad disponible / límite
    const inputCantidadApartar = document.getElementById('cantidadApartar');
    const textoCantDisponiblesModal = document.getElementById('cantDisponiblesModal');

    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;

        // Configurar la cantidad máxima y actualizar el indicador dinámico
        const limiteMax = Number(datosProducto.limite) || 0;
        
        if (inputCantidadApartar) {
            inputCantidadApartar.max = limiteMax;
            inputCantidadApartar.value = limiteMax > 0 ? 1 : 0;
        }

        if (textoCantDisponiblesModal) {
            textoCantDisponiblesModal.textContent = limiteMax;
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
            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio,
                nota: botonApartar.dataset.nota || '',
                imagen: botonApartar.dataset.imagen || '',
                limite: botonApartar.dataset.limite || 0 // Captura la cantidad temporal/disponible
            };

            mostrarVentanaApartado(infoProducto);
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

    if (formularioCategorias && seccionProductos) {
        formularioCategorias.addEventListener('submit', (evento) => {
            evento.preventDefault();

            const categoriasSeleccionadas = Array.from(
                formularioCategorias.querySelectorAll('input[name="categoria"]:checked')
            ).map((input) => input.value);

            const tarjetas = Array.from(seccionProductos.querySelectorAll('.tarjeta-producto'));

            tarjetas.forEach((tarjeta) => {
                const nombreProducto = tarjeta.querySelector('.nombre-producto')?.textContent || '';
                const categoriaProducto = tarjeta.dataset.categoria || '';
                const coincide = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoriaProducto);
                tarjeta.style.display = coincide ? '' : 'none';
            });
        });
    }

    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const idVal = campoIdProducto ? campoIdProducto.value : '';
            const cantidadVal = Number(inputCantidadApartar?.value || 0);
            const limiteMax = Number(inputCantidadApartar?.max || 0);

            if (!idVal) {
                alert('Error: No se ha detectado la ID del producto.');
                console.error('campoIdProducto está vacío al intentar enviar.');
                return;
            }

            // Validar de lado del cliente que no supere el stock/límite disponible
            if (cantidadVal > limiteMax) {
                alert(`No puedes apartar más de la cantidad disponible (${limiteMax}).`);
                return;
            }

            if (cantidadVal <= 0) {
                alert('La cantidad a apartar debe ser mayor a 0.');
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
                } catch (error) {
                    console.error('Respuesta no JSON:', error);
                }

                if (respuestaApartar.ok) {
                    alert(datosRespuesta.mensaje || '¡Producto apartado con éxito!');
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset();
                } else if (respuestaApartar.status === 401) {
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                    alert(datosRespuesta.error || 'Debes iniciar sesión para apartar este producto.');
                } else {
                    alert(datosRespuesta.error || datosRespuesta.mensaje || 'Error al procesar el apartado.');
                }
            } catch (error) {
                console.error('Error al apartar producto:', error);
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