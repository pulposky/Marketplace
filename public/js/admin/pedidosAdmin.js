    // =============================================
    // PEDIDOS ADMIN - JAVASCRIPT
    // =============================================
    // Sirve a las DOS vistas del admin (la distinción la hace
    // window.MODO_PEDIDOS que pinta el EJS). En ambas, los pedidos
    // se AGRUPAN POR CLIENTE: una tarjeta por cliente con un botón
    // "Ver" que despliega su información y sus productos.
    //
    //   - modo 'pendientes' (/admin/pedidos):
    //       pendientes + confirmados (fila de trabajo).
    //       Flujo: pendiente -> confirmado -> entregado (o cancelar en cualquier paso).
    //         "Confirmar" -> confirma todos los pendientes
    //         "Entregado" -> marca todos como entregados (solo si hay confirmados)
    //         "Cancelar" -> cancela todos y devuelve stock
    //   - modo 'historial' (/admin/historial-pedidos):
    //       entregados + cancelados; SOLO LECTURA (Ver / Ver Todo).
    // =============================================

    document.addEventListener('DOMContentLoaded', () => {

        const contenedorPedidos = document.getElementById('contenedor-pedidos');
        const btnRefrescar = document.getElementById('btnRefrescar');
        const filtrosEstado = document.getElementById('filtrosEstado');

        // Modo de la vista actual ('pendientes' | 'historial');
        // si el EJS no lo pintó, asumo pendientes por seguridad.
        const modoVista = (window.MODO_PEDIDOS === 'historial') ? 'historial' : 'pendientes';

        // Filtro activo según el modo:
        //   pendientes -> activos = pendientes + confirmados
        //   historial  -> entregados + cancelados
        let estadoFiltro = (modoVista === 'historial') ? 'historial' : 'activos';

        // Textos legibles para cada estado
        const TEXTO_ESTADO = {
            pendiente: 'Pendiente',
            confirmado: 'Confirmado',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        };

        // -----------------------------------------------
        // UTILIDADES
        // -----------------------------------------------
        // Escapa HTML para que los datos del cliente no
        // inyecten etiquetas al armar las cards
        function escaparHTML(texto) {
            return String(texto ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function formatearFecha(fecha) {
            if (!fecha) return '';
            const d = new Date(fecha);
            return isNaN(d.getTime()) ? String(fecha) : d.toLocaleString('es-CO');
        }

        // Mensaje vacío según el filtro activo
        function renderizarVacio() {
            const mensajes = {
                historial: ['No hay pedidos en el historial', 'Los pedidos entregados o cancelados aparecerán aquí.'],
                activos: ['No hay pedidos por gestionar', 'Cuando los clientes realicen pedidos, aparecerán aquí.'],
                confirmado: ['No hay pedidos confirmados', 'Confirma pedidos pendientes para verlos aquí.'],
                entregado: ['No hay pedidos entregados', 'Los pedidos confirmados que entregues aparecerán aquí.'],
                cancelado: ['No hay pedidos cancelados', 'Los pedidos cancelados aparecerán aquí.']
            };
            const [titulo, texto] = mensajes[estadoFiltro] || mensajes.activos;

            contenedorPedidos.innerHTML = `
                <div class="estado-vacio">
                    <h3>${titulo}</h3>
                    <p>${texto}</p>
                </div>
            `;
        }

        // -----------------------------------------------
        // AGRUPAR PEDIDOS POR CLIENTE
        // -----------------------------------------------
        // Un cliente puede apartar varios productos; en vez de
        // repetir su nombre en varias tarjetas, armo UNA tarjeta
        // por cliente con todos sus pedidos adentro.
        function agruparPorCliente(pedidos) {
            const grupos = new Map();

            pedidos.forEach((item) => {
                const clave = String(item.nombre_cliente ?? '').trim().toLowerCase() || 'sin nombre';
                if (!grupos.has(clave)) {
                    grupos.set(clave, {
                        clave: clave,
                        nombre: item.nombre_cliente || 'Sin nombre',
                        documento: item.cliente_documento,
                        telefono: item.cliente_telefono,
                        direccion: item.cliente_direccion,
                        items: []
                    });
                }
                grupos.get(clave).items.push(item);
            });

            return Array.from(grupos.values());
        }

        // -----------------------------------------------
        // RENDERIZAR LA LISTA DE PEDIDOS (AGRUPADA)
        // -----------------------------------------------
        function renderizarPedidos(pedidos) {
            if (!pedidos || pedidos.length === 0) {
                renderizarVacio();
                return;
            }

            const grupos = agruparPorCliente(pedidos);
            let html = '<div class="lista-pedidos">';

            grupos.forEach((grupo) => {
                const totalGrupo = grupo.items.reduce(
                    (suma, i) => suma + Number(i.precio || 0) * Number(i.cantidad || 0), 0
                );

                // UNA sola acción para todo el pedido del cliente,
                // según lo que falte por gestionar.
                // Ya no existe la opción "Entregar": el admin solo
                // confirma (pendiente -> confirmado) o cancela.
                let botonGrupo = '';
                if (modoVista === 'pendientes') {
                    const hayPendientes = grupo.items.some((i) => (i.estado || 'pendiente') === 'pendiente');
                    const hayConfirmados = grupo.items.some((i) => (i.estado || 'pendiente') === 'confirmado');
                    const hayNoEntregados = grupo.items.some((i) => {
                        const est = i.estado || 'pendiente';
                        return est === 'pendiente' || est === 'confirmado';
                    });

                    if (hayPendientes) {
                        botonGrupo = '<button class="btn-grupo-accion btn-grupo-confirmar">Confirmar</button>' +
                            '<button class="btn-grupo-accion btn-grupo-cancelar">Cancelar</button>';
                    } else if (hayConfirmados && hayNoEntregados) {
                        botonGrupo = '<button class="btn-grupo-accion btn-grupo-entregar">Entregado</button>' +
                            '<button class="btn-grupo-accion btn-grupo-cancelar">Cancelar</button>';
                    }
                }

                html += `
                    <div class="pedido-grupo" data-grupo="${escaparHTML(grupo.clave)}">
                        <div class="grupo-cabecera">
                            <div class="grupo-cliente">
                                <span class="grupo-nombre">${escaparHTML(grupo.nombre)}</span>
                                <span class="grupo-meta">${grupo.items.length} producto(s)</span>
                            </div>
                            <span class="grupo-total">Total: $${totalGrupo.toLocaleString('es-CO')}</span>
                            <button class="btn-ver-grupo">Ver</button>
                        </div>
                        <div class="grupo-detalle" hidden>
                            <div class="grupo-info-cliente">
                                <div class="info-campo">
                                    <span class="campo-label">Documento</span>
                                    <span class="campo-valor">${escaparHTML(grupo.documento || '—')}</span>
                                </div>
                                <div class="info-campo">
                                    <span class="campo-label">Teléfono</span>
                                    <span class="campo-valor">${escaparHTML(grupo.telefono || '—')}</span>
                                </div>
                                <div class="info-campo">
                                    <span class="campo-label">Dirección</span>
                                    <span class="campo-valor">${escaparHTML(grupo.direccion || '—')}</span>
                                </div>
                            </div>
                            <div class="grupo-productos">
                                ${grupo.items.map(renderizarFilaPedido).join('')}
                            </div>
                            ${botonGrupo ? `<div class="grupo-acciones">${botonGrupo}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            contenedorPedidos.innerHTML = html;
        }

        // -----------------------------------------------
        // FILA DE UN PRODUCTO DENTRO DEL GRUPO
        // -----------------------------------------------
        // Las filas son SOLO lectura: el estado viaja en
        // data-estado para que la acción del grupo sepa a cuáles
        // productos afectar. Los botones van UNOS SOLOS por grupo.
        function renderizarFilaPedido(item) {
            const estado = item.estado || 'pendiente';
            const canceladoPor = item.cancelado_por;
            let infoCancelacion = '';
            if (estado === 'cancelado' && canceladoPor) {
                const quien = canceladoPor === 'admin' ? 'Administrador' : 'Cliente';
                infoCancelacion = `<span class="cancelado-por">Cancelado por: ${quien}</span>`;
            }

            const esAccionable = modoVista === 'pendientes' && estado !== 'cancelado' && estado !== 'entregado';
            const btnCancelar = esAccionable
                ? `<button class="btn-fila-cancelar" data-id="${item.id_apartado}" title="Cancelar este producto">&times;</button>`
                : '';

            return `
                <div class="pedido-fila" data-id="${item.id_apartado}" data-estado="${estado}">
                    <div class="fila-principal">
                        <span class="fila-producto">${escaparHTML(item.nombre_producto)}</span>
                        <span class="pedido-badge ${estado}">${TEXTO_ESTADO[estado] || estado}</span>
                    </div>
                    <div class="fila-detalles">
                        <span>Cant: <strong>${escaparHTML(item.cantidad)} ${escaparHTML(item.unidad || 'ud')}</strong></span>
                        <span>$${Number(item.precio || 0).toLocaleString('es-CO')} c/u</span>
                        <span class="campo-fecha">${formatearFecha(item.fecha)}</span>
                        ${infoCancelacion}
                    </div>
                    ${btnCancelar}
                </div>
            `;
        }

        // -----------------------------------------------
        // CARGAR PEDIDOS DESDE LA API
        // -----------------------------------------------
        async function cargarPedidos() {
            btnRefrescar.disabled = true;
            btnRefrescar.textContent = 'Cargando...';

            try {
                const respuesta = await fetch(`/api/admin/apartados?estado=${encodeURIComponent(estadoFiltro)}`);
                if (!respuesta.ok) throw new Error('Error al cargar pedidos');

                const pedidos = await respuesta.json();
                renderizarPedidos(pedidos);
            } catch (error) {
                console.error('Error:', error);
                contenedorPedidos.innerHTML = `
                    <div class="estado-vacio">
                        <h3>Error al cargar pedidos</h3>
                        <p>${escaparHTML(error.message)}</p>
                    </div>
                `;
            } finally {
                btnRefrescar.disabled = false;
                btnRefrescar.textContent = 'Refrescar';
            }
        }

        // -----------------------------------------------
        // ACCIÓN GRUPAL (UN SOLO BOTÓN POR CLIENTE)
        // -----------------------------------------------
        // Aplica la misma acción a todos los productos del cliente
        // que estén en el estado de origen:
        //   Confirmar -> confirma todos los pendientes
        // Ya no existe la acción "Entregar" en la web (la entrega
        // física la registra el POS).
        async function accionGrupo(boton, estadoOrigen) {
            const grupo = boton.closest('.pedido-grupo');
            if (!grupo) return;

            const filas = Array.from(grupo.querySelectorAll(`.pedido-fila[data-estado="${estadoOrigen}"]`));
            let exitos = 0;

            for (const fila of filas) {
                try {
                    const respuesta = await fetch(`/api/admin/apartados/confirmar/${fila.dataset.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const data = await respuesta.json();

                    if (respuesta.ok) {
                        exitos++;
                        const nuevoEstado = 'confirmado';
                        fila.dataset.estado = nuevoEstado;

                        const badge = fila.querySelector('.pedido-badge');
                        if (badge) {
                            badge.classList.remove('pendiente', 'confirmado', 'entregado', 'cancelado');
                            badge.classList.add(nuevoEstado);
                            badge.textContent = TEXTO_ESTADO[nuevoEstado] || nuevoEstado;
                        }
                    } else {
                        toast('error', data.error || 'No se pudo procesar la acción.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toast('error', 'Error de conexion con el servidor.');
                }
            }

            if (exitos > 0) {
                toast('exito', `${exitos} producto(s) procesado(s) correctamente.`);
            }

            // Refresco el botón según lo que quede por gestionar.
            const zonaAcciones = grupo.querySelector('.grupo-acciones');
            if (!zonaAcciones) return;

            const hayPendientes = grupo.querySelector('.pedido-fila[data-estado="pendiente"]');
            const hayConfirmados = grupo.querySelector('.pedido-fila[data-estado="confirmado"]');

            if (hayPendientes) {
                zonaAcciones.innerHTML = '<button class="btn-grupo-accion btn-grupo-confirmar">Confirmar</button>' +
                    '<button class="btn-grupo-accion btn-grupo-cancelar">Cancelar</button>';
            } else if (hayConfirmados) {
                zonaAcciones.innerHTML = '<button class="btn-grupo-accion btn-grupo-entregar">Entregado</button>' +
                    '<button class="btn-grupo-accion btn-grupo-cancelar">Cancelar</button>';
            } else {
                zonaAcciones.innerHTML = '';
            }
        }

        // -----------------------------------------------
        // ACCIÓN ENTREGAR GRUPAL (el admin marca todo como entregado)
        // -----------------------------------------------
        async function accionEntregarGrupo(boton) {
            const grupo = boton.closest('.pedido-grupo');
            if (!grupo) return;

            const filas = Array.from(grupo.querySelectorAll('.pedido-fila'));
            let exitos = 0;

            for (const fila of filas) {
                const estado = fila.dataset.estado;
                if (estado === 'cancelado' || estado === 'entregado') continue;

                try {
                    const respuesta = await fetch(`/api/admin/apartados/entregado/${fila.dataset.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const data = await respuesta.json();

                    if (respuesta.ok) {
                        exitos++;
                        fila.dataset.estado = 'entregado';

                        const badge = fila.querySelector('.pedido-badge');
                        if (badge) {
                            badge.classList.remove('pendiente', 'confirmado', 'entregado', 'cancelado');
                            badge.classList.add('entregado');
                            badge.textContent = 'Entregado';
                        }

                        const btnFila = fila.querySelector('.btn-fila-cancelar');
                        if (btnFila) btnFila.remove();
                    } else {
                        toast('error', data.error || 'No se pudo marcar como entregado.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toast('error', 'Error de conexion con el servidor.');
                }
            }

            if (exitos > 0) {
                toast('exito', `${exitos} producto(s) marcado(s) como entregado(s).`);
            }

            const zonaAcciones = grupo.querySelector('.grupo-acciones');
            if (zonaAcciones) {
                zonaAcciones.innerHTML = '';
            }
        }

        // Si al quitar tarjetas la lista queda vacía, muestro el aviso
        function revisarListaVacia() {
            if (!contenedorPedidos.querySelector('.pedido-grupo')) {
                renderizarVacio();
            }
        }

        // -----------------------------------------------
        // ACCIÓN CANCELAR GRUPAL (el admin cancela todo el pedido)
        // -----------------------------------------------
        async function accionCancelarGrupo(boton) {
            const grupo = boton.closest('.pedido-grupo');
            if (!grupo) return;

            const filas = Array.from(grupo.querySelectorAll('.pedido-fila'));
            let exitos = 0;

            for (const fila of filas) {
                const estado = fila.dataset.estado;
                if (estado === 'cancelado' || estado === 'entregado') continue;

                try {
                    const respuesta = await fetch(`/api/admin/apartados/cancelar/${fila.dataset.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const data = await respuesta.json();

                    if (respuesta.ok) {
                        exitos++;
                        fila.dataset.estado = 'cancelado';

                        const badge = fila.querySelector('.pedido-badge');
                        if (badge) {
                            badge.classList.remove('pendiente', 'confirmado', 'entregado', 'cancelado');
                            badge.classList.add('cancelado');
                            badge.textContent = 'Cancelado';
                        }

                        const detalles = fila.querySelector('.fila-detalles');
                        if (detalles && !detalles.querySelector('.cancelado-por')) {
                            detalles.insertAdjacentHTML('beforeend',
                                '<span class="cancelado-por">Cancelado por: Administrador</span>');
                        }
                    } else {
                        toast('error', data.error || 'No se pudo cancelar el producto.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    toast('error', 'Error de conexion con el servidor.');
                }
            }

            if (exitos > 0) {
                toast('exito', `${exitos} producto(s) cancelado(s). Stock devuelto.`);
            }

            // Refresco el botón: si todo quedó cancelado, quito los botones de acción
            const zonaAcciones = grupo.querySelector('.grupo-acciones');
            if (zonaAcciones) {
                zonaAcciones.innerHTML = '';
            }
        }

        // -----------------------------------------------
        // ACCIÓN CANCELAR INDIVIDUAL (una sola fila)
        // -----------------------------------------------
        async function accionCancelarIndividual(boton) {
            const fila = boton.closest('.pedido-fila');
            if (!fila) return;

            try {
                const respuesta = await fetch(`/api/admin/apartados/cancelar/${fila.dataset.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    fila.dataset.estado = 'cancelado';

                    const badge = fila.querySelector('.pedido-badge');
                    if (badge) {
                        badge.classList.remove('pendiente', 'confirmado', 'entregado', 'cancelado');
                        badge.classList.add('cancelado');
                        badge.textContent = 'Cancelado';
                    }

                    const detalles = fila.querySelector('.fila-detalles');
                    if (detalles && !detalles.querySelector('.cancelado-por')) {
                        detalles.insertAdjacentHTML('beforeend',
                            '<span class="cancelado-por">Cancelado por: Administrador</span>');
                    }

                    boton.remove();
                    toast('exito', 'Producto cancelado. Stock devuelto.');
                } else {
                    toast('error', data.error || 'No se pudo cancelar el producto.');
                }
            } catch (error) {
                console.error('Error:', error);
                toast('error', 'Error de conexion con el servidor.');
            }
        }

        // -----------------------------------------------
        // EVENTOS DE CLICK EN BOTONES
        // -----------------------------------------------
        // Delegación de eventos sobre el contenedor
        contenedorPedidos.addEventListener('click', (e) => {
            // Ver / Ocultar el detalle de un cliente
            const btnVer = e.target.closest('.btn-ver-grupo');
            if (btnVer) {
                const detalle = btnVer.closest('.pedido-grupo')?.querySelector('.grupo-detalle');
                if (detalle) {
                    const abrir = detalle.hidden;
                    detalle.hidden = !abrir;
                    btnVer.textContent = abrir ? 'Ocultar' : 'Ver';
                }
                return;
            }

            // UN solo botón para todo el pedido del cliente
            const btnConfirmarGrupo = e.target.closest('.btn-grupo-confirmar');
            if (btnConfirmarGrupo) {
                if (confirm('Confirmar TODOS los pedidos de este cliente?')) {
                    accionGrupo(btnConfirmarGrupo, 'pendiente');
                }
                return;
            }

            const btnEntregarGrupo = e.target.closest('.btn-grupo-entregar');
            if (btnEntregarGrupo) {
                if (confirm('Marcar TODOS los pedidos de este cliente como entregados?')) {
                    accionEntregarGrupo(btnEntregarGrupo);
                }
                return;
            }

            const btnCancelarGrupo = e.target.closest('.btn-grupo-cancelar');
            if (btnCancelarGrupo) {
                if (confirm('Cancelar TODOS los pedidos de este cliente? Se devolverá el stock.')) {
                    accionCancelarGrupo(btnCancelarGrupo);
                }
                return;
            }

            const btnCancelarFila = e.target.closest('.btn-fila-cancelar');
            if (btnCancelarFila) {
                if (confirm('Cancelar este producto? Se devolverá el stock.')) {
                    accionCancelarIndividual(btnCancelarFila);
                }
                return;
            }
        });

        // -----------------------------------------------
        // VER TODO / OCULTAR TODO (solo historial)
        // -----------------------------------------------
        const btnVerTodo = document.getElementById('btnVerTodo');
        if (btnVerTodo) {
            btnVerTodo.addEventListener('click', () => {
                const abrir = btnVerTodo.textContent.trim().toLowerCase() === 'ver todo';

                contenedorPedidos.querySelectorAll('.grupo-detalle').forEach((d) => { d.hidden = !abrir; });
                contenedorPedidos.querySelectorAll('.btn-ver-grupo').forEach((b) => { b.textContent = abrir ? 'Ocultar' : 'Ver'; });

                btnVerTodo.textContent = abrir ? 'Ocultar Todo' : 'Ver Todo';
            });
        }

        // -----------------------------------------------
        // FILTROS POR ESTADO
        // -----------------------------------------------
        if (filtrosEstado) {
            filtrosEstado.addEventListener('click', (e) => {
                const chip = e.target.closest('.chip-filtro');
                if (!chip) return;

                // Marco el chip activo y recargo con el nuevo filtro
                filtrosEstado.querySelectorAll('.chip-filtro').forEach((c) => c.classList.remove('activo'));
                chip.classList.add('activo');

                estadoFiltro = chip.dataset.estado;
                cargarPedidos();
            });
        }

        // Botón de refrescar: vuelve a cargar los pedidos desde la API
        btnRefrescar.addEventListener('click', cargarPedidos);

        // Carga inicial
        cargarPedidos();

    });
