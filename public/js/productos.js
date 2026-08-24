// =============================================
// CATÁLOGO DE PRODUCTOS - JAVASCRIPT
// =============================================
// Script de la página del catálogo (/catalogo).
// Similar a main.js pero con extras:
//   - Animación del carrito cuando se aparta
//   - Filtro de categorías desde la URL
//   - Indicador de cantidad disponible en el modal
//   - Conversión de cubetas de huevos (x30)
//
// La animación del carrito es un efecto visual:
// una bola sale del botón de apartar, llega al
// carrito, explota, y el carrito recorre la pantalla.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los modales y elementos
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
    const carritoAnimado = document.getElementById('carritoAnimado');

    // Inputs para cantidad
    const inputCantidadApartar = document.getElementById('cantidadApartar');
    const textoCantDisponiblesModal = document.getElementById('cantDisponiblesModal');

    // Guardo el botón que abrió el modal para la animación del carrito
    let botonOrigenActual = null;

    // Bandera: si el usuario quiso ver sus apartados sin sesión,
    // tras loguearse lo llevo directo a /verApartados
    let irApartadosTrasLogin = false;

    // -----------------------------------------------
    // CARRITO FIJO (ESQUINA INFERIOR DERECHA)
    // -----------------------------------------------
    // Visible desde que se entra al catálogo. Al hacer
    // clic lleva a mis apartados; si no hay sesión, abre
    // el login y después de loguearse redirige solo.
    async function irAMisApartados() {
        const estadoSesion = await verificarSesion();
        if (estadoSesion.login) {
            window.location.href = '/verApartados';
            return;
        }
        irApartadosTrasLogin = true;
        if (ventanaLogin) ventanaLogin.style.display = 'flex';
        toast('info', 'Inicia sesión para ver tus apartados.');
    }

    if (carritoAnimado) {
        carritoAnimado.classList.add('visible');
        carritoAnimado.addEventListener('click', irAMisApartados);
        carritoAnimado.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                irAMisApartados();
            }
        });
    }

    // Si llegaron redirigidos desde /verApartados sin sesión (?login=1),
    // abro el modal de login directamente y limpio la URL
    const parametrosUrl = new URLSearchParams(window.location.search);
    if (parametrosUrl.get('login') === '1') {
        irApartadosTrasLogin = true;
        if (ventanaLogin) ventanaLogin.style.display = 'flex';
        toast('advertencia', 'Inicia sesión para ver tus apartados.');
        window.history.replaceState({}, '', '/catalogo');
    }

    // -----------------------------------------------
    // BÚSQUEDA EN VIVO DE PRODUCTOS
    // -----------------------------------------------
    // El input del catálogo filtra las tarjetas por nombre
    // mientras se escribe, sin recargar ni tocar el diseño.
    const inputBuscarProducto = document.getElementById('inputBuscar');

    if (inputBuscarProducto) {
        inputBuscarProducto.addEventListener('input', () => {
            const texto = inputBuscarProducto.value.trim().toLowerCase();
            let visibles = 0;

            document.querySelectorAll('.rejilla-productos .tarjeta-producto').forEach((tarjeta) => {
                const nombre = tarjeta.querySelector('.nombre-producto');
                const coincide = !texto || (nombre && nombre.textContent.toLowerCase().includes(texto));
                tarjeta.style.display = coincide ? '' : 'none';
                if (coincide) visibles++;
            });

            // Si hay un aviso de "sin resultados" lo muestro u oculto
            const avisoVacio = document.getElementById('avisoSinResultados');
            if (avisoVacio) {
                avisoVacio.style.display = (visibles === 0) ? 'block' : 'none';
            }
        });
    }

    // -----------------------------------------------
    // ANIMACIÓN DEL CARRITO DE COMPRAS
    // -----------------------------------------------
    // Paleta del proyecto para el confeti
    const COLORES_CONFETI = ['#39A900', '#00A1DE', '#F5A623', '#8E44AD', '#FFD700', '#FFFFFF'];

    // Hace volar la imagen del producto en un arco suave hasta el carrito.
    // Devuelve una promesa que se resuelve cuando el producto "llega".
    function volarProductoHaciaCarrito(origenX, origenY, imagenSrc) {
        return new Promise((resolver) => {
            const rectCarrito = carritoAnimado.getBoundingClientRect();
            const destinoX = rectCarrito.left + rectCarrito.width / 2;
            const destinoY = rectCarrito.top + rectCarrito.height / 2;

            const volador = document.createElement('div');
            volador.className = 'producto-volador';
            if (imagenSrc) {
                const imagen = document.createElement('img');
                imagen.src = imagenSrc;
                imagen.alt = '';
                volador.appendChild(imagen);
            } else {
                volador.innerHTML =
                    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M21 8l-9-5-9 5v10l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v10"/>' +
                    '</svg>';
            }
            document.body.appendChild(volador);

            // Punto de control del arco: elevado sobre la línea recta origen→destino
            const controlX = (origenX + destinoX) / 2;
            const controlY = Math.min(origenY, destinoY) - Math.max(160, Math.abs(destinoX - origenX) * 0.25);

            const duracion = 800;
            const inicio = performance.now();

            function paso(now) {
                const t = Math.min((now - inicio) / duracion, 1);
                const facilidad = t * t; // ease-in: acelera como si cayera al carrito

                // Curva bezier cuadrática
                const x = (1 - facilidad) * (1 - facilidad) * origenX +
                    2 * (1 - facilidad) * facilidad * controlX +
                    facilidad * facilidad * destinoX;
                const y = (1 - facilidad) * (1 - facilidad) * origenY +
                    2 * (1 - facilidad) * facilidad * controlY +
                    facilidad * facilidad * destinoY;

                const escala = 1 - 0.45 * facilidad;
                volador.style.transform =
                    `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${escala}) rotate(${facilidad * 200}deg)`;

                if (t < 1) {
                    requestAnimationFrame(paso);
                } else {
                    volador.remove();
                    resolver();
                }
            }
            requestAnimationFrame(paso);
        });
    }

    // Rebote squash & stretch del carrito al recibir el producto
    function rebotarCarrito() {
        carritoAnimado.classList.remove('recibiendo');
        void carritoAnimado.offsetWidth; // reinicia la animación si estaba corriendo
        carritoAnimado.classList.add('recibiendo');
        setTimeout(() => carritoAnimado.classList.remove('recibiendo'), 650);
    }

    // Anillo que se expande desde el carrito
    function crearOnda(x, y) {
        const onda = document.createElement('div');
        onda.className = 'onda-carrito';
        onda.style.left = x + 'px';
        onda.style.top = y + 'px';
        document.body.appendChild(onda);
        setTimeout(() => onda.remove(), 750);
    }

    // Badge "+N" que flota hacia arriba desde el carrito
    function crearBadgeCantidad(x, y, cantidad) {
        const badge = document.createElement('div');
        badge.className = 'badge-apartado';
        badge.textContent = '+' + cantidad;
        badge.style.left = x + 'px';
        badge.style.top = (y - 44) + 'px';
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 950);
    }

    // Confeti sutil que salta y cae alrededor del carrito
    function crearConfeti(x, y) {
        for (let i = 0; i < 10; i++) {
            const pieza = document.createElement('div');
            pieza.className = 'confeti-apartado';
            pieza.style.left = x + 'px';
            pieza.style.top = y + 'px';
            pieza.style.backgroundColor = COLORES_CONFETI[i % COLORES_CONFETI.length];
            const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
            const distancia = 45 + Math.random() * 55;
            pieza.style.setProperty('--cx', (Math.cos(angulo) * distancia) + 'px');
            pieza.style.setProperty('--cy', (Math.sin(angulo) * distancia + 70) + 'px');
            document.body.appendChild(pieza);
            setTimeout(() => pieza.remove(), 1100);
        }
    }

    // Secuencia completa al confirmar un apartado:
    // vuelo → rebote del carrito → onda + badge + confeti
    async function animarApartado(botonOrigen, cantidadApartada) {
        if (!carritoAnimado) return;

        carritoAnimado.classList.add('visible');

        let origenX = window.innerWidth / 2;
        let origenY = window.innerHeight / 2;
        let imagenSrc = null;

        if (botonOrigen && document.contains(botonOrigen)) {
            const rectBoton = botonOrigen.getBoundingClientRect();
            origenX = rectBoton.left + rectBoton.width / 2;
            origenY = rectBoton.top + rectBoton.height / 2;
            imagenSrc = botonOrigen.dataset.imagen || null;
        }

        await volarProductoHaciaCarrito(origenX, origenY, imagenSrc);

        const rectCarrito = carritoAnimado.getBoundingClientRect();
        const centroX = rectCarrito.left + rectCarrito.width / 2;
        const centroY = rectCarrito.top + rectCarrito.height / 2;

        rebotarCarrito();
        crearOnda(centroX, centroY);
        crearBadgeCantidad(centroX, centroY, cantidadApartada || 1);
        crearConfeti(centroX, centroY);
    }

    // Actualiza el stock de la tarjeta al momento, sin recargar la página
    function actualizarStockTarjeta(botonOrigen, cantidadRestada) {
        if (!botonOrigen) return;

        const nuevoLimite = Math.max(0, (Number(botonOrigen.dataset.limite) || 0) - cantidadRestada);
        botonOrigen.dataset.limite = String(nuevoLimite);

        const tarjeta = botonOrigen.closest('.tarjeta-producto');
        if (tarjeta) {
            const strongStock = tarjeta.querySelector('.stock-producto strong');
            if (strongStock) strongStock.textContent = nuevoLimite;
        }

        if (nuevoLimite === 0) {
            botonOrigen.disabled = true;
            botonOrigen.textContent = 'Agotado';
        }
    }

    // -----------------------------------------------
    // ABRIR MODAL DE APARTADO
    // -----------------------------------------------
    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;

        // Configuro la cantidad máxima y el indicador de disponibles
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

    // -----------------------------------------------
    // FORMULARIO DE LOGIN (DENTRO DEL MODAL)
    // -----------------------------------------------
    if (formularioLogin) {
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
                // Si el login salió por querer ver apartados, lo llevo directo
                if (irApartadosTrasLogin) {
                    window.location.href = '/verApartados';
                    return;
                }
                window.location.reload();
            }
        });
    }

    // -----------------------------------------------
    // VERIFICAR SESIÓN
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
    // BOTONES DE APARTAR
    // -----------------------------------------------
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', () => {
            botonOrigenActual = botonApartar; // Guardo para la animación

            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio,
                imagen: botonApartar.dataset.imagen || '',
                limite: Number(botonApartar.dataset.limite) || 0,
                esHuevo: botonApartar.dataset.esHuevo === 'true'
            };

            // Guardo si es huevo en el dataset del formulario para usarlo al enviar
            if (formularioApartado) {
                formularioApartado.dataset.esHuevo = infoProducto.esHuevo;
            }

            mostrarVentanaApartado(infoProducto);
        });
    });

    // -----------------------------------------------
    // ENVIAR APARTADO
    // -----------------------------------------------
    // Valida, verifica sesión, envía, y si sale bien lanza la animación
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const idVal = campoIdProducto ? campoIdProducto.value : '';
            const cantidadVal = Number(inputCantidadApartar?.value || 0);
            const limiteMax = Number(inputCantidadApartar?.max || 0);
            const esHuevo = formularioApartado.dataset.esHuevo === 'true';

            if (!idVal) {
                toast('error', 'Error: No se ha detectado la ID del producto.');
                return;
            }

            if (cantidadVal > limiteMax) {
                toast('advertencia', `No puedes apartar más de la cantidad disponible (${limiteMax}).`);
                return;
            }

            if (cantidadVal <= 0) {
                toast('advertencia', 'La cantidad a apartar debe ser mayor a 0.');
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
                    // Cierro el modal, actualizo el stock en vivo y lanzo la animación
                    const cantidadRestada = cantidadVal;
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    actualizarStockTarjeta(botonOrigenActual, cantidadRestada);
                    toast('exito', 'Producto apartado correctamente.');
                    animarApartado(botonOrigenActual, cantidadRestada);
                } else if (respuestaApartar.status === 401) {
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                    toast('advertencia', datosRespuesta.error || 'Debes iniciar sesión para apartar este producto.');
                } else {
                    toast('error', datosRespuesta.error || datosRespuesta.mensaje || 'Error al procesar el apartado.');
                }
            } catch (error) {
                console.error('Error al apartar producto:', error);
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

    // Click afuera del modal lo cierra
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});
