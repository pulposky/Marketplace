// =============================================
// CATÁLOGO DE PRODUCTOS - JAVASCRIPT
// =============================================
// Script de la página del catálogo (/catalogo).
// Maneja:
//   - Carrito real (localStorage): agregar, quitar,
//     modificar cantidades y confirmar en bloque vía
//     /api/apartar-lote.
//   - Animación del carrito cuando se agrega un producto.
//   - Filtro de categorías desde la URL.
//   - Indicador de cantidad disponible en el modal.
//   - Conversión de cubetas de huevos (x30).
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
    const imagenApartar = document.getElementById('apartarImagenProducto');

    // Inputs para cantidad
    const inputCantidadApartar = document.getElementById('cantidadApartar');
    const textoCantDisponiblesModal = document.getElementById('cantDisponiblesModal');

    // Carrito (drawer lateral)
    const carritoAnimado = document.getElementById('carritoAnimado');
    const badgeCarritoFijo = document.getElementById('badgeCarritoFijo');
    const carritoDrawer = document.getElementById('carritoDrawer');
    const carritoFondo = document.getElementById('carritoFondo');
    const carritoLista = document.getElementById('carritoLista');
    const carritoVacio = document.getElementById('carritoVacio');
    const botonCerrarCarrito = document.getElementById('cerrarCarrito');
    const botonConfirmarCarrito = document.getElementById('btnConfirmarCarrito');
    const botonVaciarCarrito = document.getElementById('btnVaciarCarrito');

    // Guardo el botón que abrió el modal para la animación del carrito
    let botonOrigenActual = null;

    // Bandera: si el usuario quiso ver sus apartados sin sesión,
    // tras loguearse lo llevo directo a /verApartados
    let irApartadosTrasLogin = false;

    // Bandera: pendiente confirmar el carrito tras iniciar sesión
    let confirmarCarritoPendiente = false;

    const CLAVE_CARRITO = 'carritoMarketplace_v1';

    // -----------------------------------------------
    // UTILIDADES DEL CARRITO (localStorage)
    // -----------------------------------------------
    function leerCarrito() {
        try {
            const crudo = localStorage.getItem(CLAVE_CARRITO);
            const datos = crudo ? JSON.parse(crudo) : [];
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error('Error leyendo carrito:', error);
            return [];
        }
    }

    function guardarCarrito(carrito) {
        try {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
        } catch (error) {
            console.error('Error guardando carrito:', error);
        }
    }

    function formatearCOP(valor) {
        return '$' + Number(valor || 0).toLocaleString('es-CO');
    }

    function totalCantidadCarrito(carrito) {
        return (carrito || []).reduce((suma, item) => suma + (Number(item.cantidad) || 0), 0);
    }

    function totalPrecioCarrito(carrito) {
        return (carrito || []).reduce((suma, item) => suma + (Number(item.cantidad) || 0) * (Number(item.precioNum) || 0), 0);
    }

    // -----------------------------------------------
    // RENDERIZAR CARRITO
    // -----------------------------------------------
    function renderizarCarrito() {
        const carrito = leerCarrito();

        if (badgeCarritoFijo) {
            badgeCarritoFijo.textContent = String(totalCantidadCarrito(carrito));
            badgeCarritoFijo.classList.toggle('visible-badge', carrito.length > 0);
        }

        if (!carritoLista) return;

        carritoLista.innerHTML = '';

        if (carrito.length === 0) {
            if (carritoVacio) carritoVacio.style.display = 'block';
            if (carritoPieElemento) carritoPieElemento.style.display = 'none';
            return;
        }

        if (carritoVacio) carritoVacio.style.display = 'none';
        if (carritoPieElemento) carritoPieElemento.style.display = '';

        carrito.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'carrito-item';
            li.dataset.id = item.id;

            const imagenHtml = item.imagen
                ? `<img src="${item.imagen}" alt="${item.nombre}">`
                : `<span class="carrito-item-sin-imagen">${item.nombre.charAt(0)}</span>`;

            li.innerHTML = `
                <div class="carrito-item-imagen">${imagenHtml}</div>
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-precio">${formatearCOP(item.precioNum)} / ${item.unidad || 'unidad'}</div>
                </div>
                <div class="carrito-item-controles">
                    <div class="carrito-cantidad">
                        <button type="button" class="carrito-stepper" data-accion="menos" aria-label="Quitar uno">&minus;</button>
                        <span class="carrito-valor">${item.cantidad}</span>
                        <button type="button" class="carrito-stepper" data-accion="mas" aria-label="Agregar uno">&plus;</button>
                    </div>
                    <button type="button" class="carrito-quitar" data-accion="quitar" aria-label="Quitar producto">&times;</button>
                </div>
            `;
            carritoLista.appendChild(li);
        });

        const totalUnidadesTexto = document.getElementById('carritoTotalUnidades');
        const totalPrecioTexto = document.getElementById('carritoTotalPrecio');
        if (totalUnidadesTexto) totalUnidadesTexto.textContent = `${totalCantidadCarrito(carrito)} unidades`;
        if (totalPrecioTexto) totalPrecioTexto.textContent = formatearCOP(totalPrecioCarrito(carrito));
    }

    // Elemento contenedor del pie del carrito (se oculta cuando está vacío)
    const carritoPieElemento = document.querySelector('.carrito-pie');

    // -----------------------------------------------
    // ABRIR / CERRAR CARRITO
    // -----------------------------------------------
    function abrirCarrito() {
        if (!carritoDrawer) return;
        renderizarCarrito();
        carritoDrawer.classList.add('abierto');
        carritoDrawer.setAttribute('aria-hidden', 'false');
        if (carritoFondo) carritoFondo.style.display = 'block';
    }

    function cerrarCarrito() {
        if (carritoDrawer) {
            carritoDrawer.classList.remove('abierto');
            carritoDrawer.setAttribute('aria-hidden', 'true');
        }
        if (carritoFondo) carritoFondo.style.display = 'none';
    }

    if (carritoAnimado) {
        carritoAnimado.classList.add('visible');
        carritoAnimado.addEventListener('click', abrirCarrito);
        carritoAnimado.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirCarrito();
            }
        });
    }

    if (botonCerrarCarrito) botonCerrarCarrito.addEventListener('click', cerrarCarrito);
    if (carritoFondo) carritoFondo.addEventListener('click', cerrarCarrito);

    // -----------------------------------------------
    // ALERTA DE TIEMPO DE APARTADO (una vez por pestaña)
    // -----------------------------------------------
    if (!sessionStorage.getItem('alertaApartadoMostrada')) {
        const alertaApartado = document.getElementById('alertaApartado');
        const cerrarAlertaApartado = document.getElementById('cerrarAlertaApartado');

        if (alertaApartado) alertaApartado.style.display = 'flex';
        sessionStorage.setItem('alertaApartadoMostrada', '1');

        if (cerrarAlertaApartado) {
            cerrarAlertaApartado.addEventListener('click', () => {
                alertaApartado.style.display = 'none';
            });
        }
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

            const avisoVacio = document.getElementById('avisoSinResultados');
            if (avisoVacio) {
                avisoVacio.style.display = (visibles === 0) ? 'block' : 'none';
            }
        });
    }

    // -----------------------------------------------
    // ANIMACIÓN DEL CARRITO DE COMPRAS
    // -----------------------------------------------
    const COLORES_CONFETI = ['#39A900', '#00A1DE', '#F5A623', '#8E44AD', '#FFD700', '#FFFFFF'];

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

            const controlX = (origenX + destinoX) / 2;
            const controlY = Math.min(origenY, destinoY) - Math.max(160, Math.abs(destinoX - origenX) * 0.25);

            const duracion = 800;
            const inicio = performance.now();

            function paso(now) {
                const t = Math.min((now - inicio) / duracion, 1);
                const facilidad = t * t;

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

    function rebotarCarrito() {
        carritoAnimado.classList.remove('recibiendo');
        void carritoAnimado.offsetWidth;
        carritoAnimado.classList.add('recibiendo');
        setTimeout(() => carritoAnimado.classList.remove('recibiendo'), 650);
    }

    function crearOnda(x, y) {
        const onda = document.createElement('div');
        onda.className = 'onda-carrito';
        onda.style.left = x + 'px';
        onda.style.top = y + 'px';
        document.body.appendChild(onda);
        setTimeout(() => onda.remove(), 750);
    }

    function crearBadgeCantidad(x, y, cantidad) {
        const badge = document.createElement('div');
        badge.className = 'badge-apartado';
        badge.textContent = '+' + cantidad;
        badge.style.left = x + 'px';
        badge.style.top = (y - 44) + 'px';
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 950);
    }

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

    async function animarApartado(botonOrigen, cantidadAgregada) {
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
        crearBadgeCantidad(centroX, centroY, cantidadAgregada || 1);
        crearConfeti(centroX, centroY);
    }

    // -----------------------------------------------
    // ABRIR MODAL PARA ELEGIR CANTIDAD
    // -----------------------------------------------
    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;

        const textoDescripcionModal = document.getElementById('apartarDescripcionProducto');
        if (textoDescripcionModal) {
            if (datosProducto.descripcion) {
                textoDescripcionModal.textContent = datosProducto.descripcion;
                textoDescripcionModal.style.display = 'block';
            } else {
                textoDescripcionModal.textContent = '';
                textoDescripcionModal.style.display = 'none';
            }
        }

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
    // AGREGAR PRODUCTO AL CARRITO
    // -----------------------------------------------
    function agregarAlCarrito(infoProducto, cantidad) {
        const carrito = leerCarrito();
        const existente = carrito.find((item) => String(item.id) === String(infoProducto.id));

        const limite = Number(infoProducto.limite) || 0;

        if (existente) {
            existente.cantidad = Math.min(limite, existente.cantidad + cantidad);
            if (existente.cantidad > limite) {
                toast('advertencia', `No puedes apartar más de la cantidad disponible (${limite} ${infoProducto.unidad.toLowerCase()}).`);
            }
        } else {
            carrito.push({
                id: String(infoProducto.id),
                nombre: infoProducto.nombre,
                precioNum: Number(infoProducto.precioNum) || 0,
                esHuevo: infoProducto.esHuevo,
                unidad: infoProducto.unidad,
                imagen: infoProducto.imagen || '',
                limite,
                cantidad: Math.min(limite, cantidad)
            });
        }

        guardarCarrito(carrito);
        renderizarCarrito();
    }

    // -----------------------------------------------
    // FORMULARIO DE LOGIN (DENTRO DEL MODAL)
    // -----------------------------------------------
    if (formularioLogin) {
        configurarFormLogin(formularioLogin, {
            alLoginExitoso: () => {
                if (irApartadosTrasLogin) {
                    window.location.href = '/verApartados';
                    return;
                }
                if (confirmarCarritoPendiente) {
                    confirmarCarritoPendiente = false;
                    confirmarCarrito();
                    return;
                }
                window.location.reload();
            }
        });
    }

    // -----------------------------------------------
    // CONFIRMAR CARRITO (apartar en bloque)
    // -----------------------------------------------
    async function confirmarCarrito() {
        const carrito = leerCarrito();
        if (carrito.length === 0) {
            toast('advertencia', 'Tu carrito está vacío.');
            return;
        }

        const estadoSesion = await verificarSesion();
        if (!estadoSesion.login) {
            confirmarCarritoPendiente = true;
            if (ventanaLogin) ventanaLogin.style.display = 'flex';
            toast('info', 'Inicia sesión para confirmar tu apartado.');
            return;
        }

        const items = carrito.map((item) => ({
            productoId: Number(item.id),
            cantidad: Number(item.cantidad)
        }));

        try {
            const respuesta = await fetch('/api/apartar-lote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ items })
            });

            let datos = {};
            try {
                datos = await respuesta.json();
            } catch (e) {
                console.error('Respuesta no JSON:', e);
            }

            if (respuesta.ok) {
                guardarCarrito([]);
                renderizarCarrito();
                cerrarCarrito();
                toast('exito', datos.mensaje || '¡Productos apartados con éxito!');
                setTimeout(() => window.location.reload(), 1400);
            } else if (respuesta.status === 401) {
                confirmarCarritoPendiente = true;
                if (ventanaLogin) ventanaLogin.style.display = 'flex';
                toast('advertencia', datos.error || 'Debes iniciar sesión para apartar estos productos.');
            } else {
                toast('error', datos.error || 'Error al procesar el carrito. Revisa el stock disponible.');
                setTimeout(() => window.location.reload(), 1800);
            }
        } catch (error) {
            console.error('Error al confirmar el carrito:', error);
            toast('error', 'Error de conexión con el servidor.');
        }
    }

    if (botonConfirmarCarrito) {
        botonConfirmarCarrito.addEventListener('click', confirmarCarrito);
    }

    if (botonVaciarCarrito) {
        botonVaciarCarrito.addEventListener('click', () => {
            guardarCarrito([]);
            renderizarCarrito();
            toast('info', 'Carrito vaciado.');
        });
    }

    // Delegación de eventos dentro de la lista del carrito
    if (carritoLista) {
        carritoLista.addEventListener('click', (evento) => {
            const botonPulsado = evento.target.closest('[data-accion]');
            if (!botonPulsado) return;

            const itemLi = botonPulsado.closest('.carrito-item');
            if (!itemLi) return;

            const idItem = itemLi.dataset.id;
            const accion = botonPulsado.dataset.accion;
            const carrito = leerCarrito();
            const item = carrito.find((i) => String(i.id) === idItem);
            if (!item) return;

            if (accion === 'quitar') {
                const nuevoCarrito = carrito.filter((i) => String(i.id) !== idItem);
                guardarCarrito(nuevoCarrito);
                renderizarCarrito();
                return;
            }

            if (accion === 'mas') {
                if (item.cantidad < (Number(item.limite) || 0)) {
                    item.cantidad += 1;
                } else {
                    toast('advertencia', `Máximo disponible: ${item.limite} ${(item.unidad || 'unidad').toLowerCase()}.`);
                }
            } else if (accion === 'menos') {
                item.cantidad = Math.max(1, item.cantidad - 1);
            }

            guardarCarrito(carrito);
            renderizarCarrito();
        });
    }

    // -----------------------------------------------
    // TARJETAS: clic en la tarjeta abre el modal de apartado
    // -----------------------------------------------
    document.querySelectorAll('.rejilla-productos .tarjeta-producto').forEach(tarjeta => {
        tarjeta.addEventListener('click', (evento) => {
            const botonApartarTarjeta = tarjeta.querySelector('.btn-accion-apartar');
            if (!botonApartarTarjeta) return;
            if (evento.target.closest('.btn-accion-apartar')) return;
            evento.preventDefault();
            botonApartarTarjeta.click();
        });
    });

    // -----------------------------------------------
    // BOTONES DE AGREGAR (TARJETAS)
    // -----------------------------------------------
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', () => {
            botonOrigenActual = botonApartar; // Guardo para la animación

            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio,
                precioNum: Number(botonApartar.dataset.precioNum) || 0,
                imagen: botonApartar.dataset.imagen || '',
                descripcion: botonApartar.dataset.descripcion || '',
                limite: Number(botonApartar.dataset.limite) || 0,
                esHuevo: botonApartar.dataset.esHuevo === 'true',
                unidad: botonApartar.dataset.unidad || 'Unidad(es)'
            };

            if (formularioApartado) {
                formularioApartado.dataset.esHuevo = infoProducto.esHuevo;
            }

            mostrarVentanaApartado(infoProducto);
        });
    });

    // -----------------------------------------------
    // ENVIAR AL CARRITO (modal de cantidad)
    // -----------------------------------------------
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', (evento) => {
            evento.preventDefault();

            const idVal = campoIdProducto ? campoIdProducto.value : '';
            const cantidadVal = Number(inputCantidadApartar?.value || 0);
            const limiteMax = Number(inputCantidadApartar?.max || 0);

            if (!idVal) {
                toast('error', 'Error: No se ha detectado la ID del producto.');
                return;
            }

            if (cantidadVal > limiteMax) {
                toast('advertencia', `No puedes apartar más de la cantidad disponible (${limiteMax}).`);
                return;
            }

            if (cantidadVal <= 0 || !Number.isFinite(cantidadVal)) {
                toast('advertencia', 'La cantidad a apartar debe ser mayor a 0.');
                return;
            }

            if (!botonOrigenActual) {
                toast('error', 'Error: no se encontró el producto seleccionado.');
                return;
            }

            const infoProducto = {
                id: botonOrigenActual.dataset.id,
                nombre: botonOrigenActual.dataset.nombre,
                precioNum: Number(botonOrigenActual.dataset.precioNum) || 0,
                esHuevo: botonOrigenActual.dataset.esHuevo === 'true',
                unidad: botonOrigenActual.dataset.unidad || 'Unidad(es)',
                imagen: botonOrigenActual.dataset.imagen || '',
                limite: Number(botonOrigenActual.dataset.limite) || 0
            };

            agregarAlCarrito(infoProducto, cantidadVal);

            if (ventanaApartar) ventanaApartar.style.display = 'none';
            toast('exito', 'Producto agregado al carrito.');
            animarApartado(botonOrigenActual, cantidadVal);
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

    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });

    renderizarCarrito();
});