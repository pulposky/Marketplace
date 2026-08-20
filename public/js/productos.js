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

    // -----------------------------------------------
    // ANIMACIÓN DEL CARRITO DE COMPRAS
    // -----------------------------------------------
    // Colores aleatorios para las partículas de la explosión
    const COLORES_ESTRELLA = ['#ffe066', '#ffaa00', '#ff8800', '#ffcc33', '#ffffff', '#ff6600', '#ffee88'];

    // Crea partículas pequeñas que salen volando desde una posición
    function crearParticulas(x, y, contenedor) {
        const cantidad = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < cantidad; i++) {
            const p = document.createElement('div');
            p.className = 'particula';
            p.style.left = (x - 3) + 'px';
            p.style.top = (y - 3) + 'px';
            p.style.backgroundColor = COLORES_ESTRELLA[Math.floor(Math.random() * COLORES_ESTRELLA.length)];
            // Ángulo y distancia aleatorios para que cada partícula vaya en una dirección
            const angulo = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 25;
            p.style.setProperty('--px', Math.cos(angulo) * dist + 'px');
            p.style.setProperty('--py', Math.sin(angulo) * dist + 'px');
            (contenedor || document.body).appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    // Crea una explosión más grande (16 partículas) en el destino
    function crearExplosion(x, y) {
        const cont = document.createElement('div');
        cont.className = 'explosion';
        cont.style.left = x + 'px';
        cont.style.top = y + 'px';
        const colores = ['#ffe066', '#ffaa00', '#ff8800', '#ffffff', '#ffcc33', '#ff6600', '#ffee88', '#ffd700'];
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'explosion-particula';
            p.style.backgroundColor = colores[i % colores.length];
            const angulo = (Math.PI * 2 / 16) * i + (Math.random() * 0.3);
            const dist = 40 + Math.random() * 50;
            p.style.setProperty('--ex', Math.cos(angulo) * dist + 'px');
            p.style.setProperty('--ey', Math.sin(angulo) * dist + 'px');
            cont.appendChild(p);
        }
        document.body.appendChild(cont);
        setTimeout(() => cont.remove(), 700);
    }

    // Animación completa: bola voladora → explosión → carrito se mueve → recarga
    function animarCarrito(botonOrigen) {
        if (!botonOrigen || !carritoAnimado) return;

        const rectBoton = botonOrigen.getBoundingClientRect();
        const rectCarrito = carritoAnimado.getBoundingClientRect();

        const origenX = rectBoton.left + rectBoton.width / 2;
        const origenY = rectBoton.top + rectBoton.height / 2;
        const destinoX = rectCarrito.left + rectCarrito.width / 2;
        const destinoY = rectCarrito.top + rectCarrito.height / 2;

        // 1. Muestro el carrito
        carritoAnimado.classList.add('visible');

        // 2. Creo la bola que va a volar desde el botón hasta el carrito
        const bola = document.createElement('div');
        bola.className = 'bola-voladora';
        bola.style.left = (origenX - 14) + 'px';
        bola.style.top = (origenY - 14) + 'px';
        document.body.appendChild(bola);

        // 3. Cada 60ms suelto partículas mientras la bola vuela
        letPosX = origenX;
        letPosY = origenY;
        const intervaloParticulas = setInterval(() => {
            crearParticulas(letPosX, letPosY);
        }, 60);

        // 4. Fuerzo reflow y lanzo la bola al carrito (1 segundo de vuelo)
        bola.offsetHeight;
        requestAnimationFrame(() => {
            bola.style.left = (destinoX - 14) + 'px';
            bola.style.top = (destinoY - 14) + 'px';
        });

        // Actualizo la posición de las partículas para que sigan a la bola
        const inicioVuelo = performance.now();
        function actualizarParticulas(now) {
            const progreso = Math.min((now - inicioVuelo) / 1000, 1);
            letPosX = origenX + (destinoX - origenX) * progreso;
            letPosY = origenY + (destinoY - origenY) * progreso;
            if (progreso < 1) {
                requestAnimationFrame(actualizarParticulas);
            }
        }
        requestAnimationFrame(actualizarParticulas);

        // 5. A los 1s: la bola llega, exploto, paro las partículas
        setTimeout(() => {
            clearInterval(intervaloParticulas);
            bola.remove();
            crearExplosion(destinoX, destinoY);
        }, 1000);

        // 6. Un instante después, el carrito arranca de esquina a esquina
        setTimeout(() => {
            carritoAnimado.classList.add('andando');
        }, 1150);

        // 7. Cuando el carrito termina de recorrer la pantalla, recargo la página
        setTimeout(() => {
            window.location.reload();
        }, 3100);
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

            // Si es huevo, multiplico por 30 para enviar unidades reales a la BD
            const cantidadAEnviar = esHuevo ? cantidadVal * 30 : cantidadVal;

            const datosApartado = {
                productoId: idVal,
                cantidad: cantidadAEnviar
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
                    // Cierro el modal primero y luego lanzo la animación
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    setTimeout(() => {
                        animarCarrito(botonOrigenActual);
                    }, 200);
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
