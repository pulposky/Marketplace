// =============================================
// HABILITAR PRODUCTO - JAVASCRIPT
// =============================================
// Maneja la vista de gestión de productos del admin.
// Permite buscar/filtrar productos, cambiar la cantidad
// a vender, y habilitar/deshabilitar productos con
// un switch. Los cambios se guardan directo en la BD.
//
// Maneja la conversión de cubetas de huevos (x30)
// para que en la BD se guarden unidades reales.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los filtros del DOM
    const inputBuscar = document.querySelector('.campo-busqueda input');
    const selectEstado = document.querySelector('.ordenar-por select');
    const chkDisponibles = document.getElementById('filtro-disponibles');
    const chkAgotados = document.getElementById('filtro-agotados');
    const btnFiltrar = document.querySelector('.boton-filtrar');
    const tarjetas = document.querySelectorAll('.tarjeta-producto');

    // -----------------------------------------------
    // FILTRADO LOCAL DE PRODUCTOS
    // -----------------------------------------------
    // Filtra las tarjetas según la búsqueda, el estado
    // seleccionado y si se quieren disponibles/agotados
    function aplicarFiltros() {
        const busqueda = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        const estadoSeleccionado = selectEstado ? selectEstado.value : 'todos';
        const soloDisponibles = chkDisponibles ? chkDisponibles.checked : false;
        const soloAgotados = chkAgotados ? chkAgotados.checked : false;

        tarjetas.forEach(tarjeta => {
            const nombre = tarjeta.dataset.nombre || '';
            const estado = tarjeta.dataset.estado; // 'activo' o 'inactivo'
            const cantidad = parseInt(tarjeta.dataset.cantidad, 10) || 0;

            const coincideNombre = nombre.includes(busqueda);
            let coincideEstado = estadoSeleccionado === 'todos' || estado === estadoSeleccionado;

            // Filtro por cantidad: disponibles (> 0) o agotados (=== 0)
            let coincideCantidad = true;
            if (soloDisponibles && !soloAgotados) {
                coincideCantidad = cantidad > 0;
            } else if (soloAgotados && !soloDisponibles) {
                coincideCantidad = cantidad === 0;
            }

            if (coincideNombre && coincideEstado && coincideCantidad) {
                tarjeta.style.display = 'block';
            } else {
                tarjeta.style.display = 'none';
            }
        });
    }

    // Asigno los eventos de filtrado
    if (inputBuscar) inputBuscar.addEventListener('input', aplicarFiltros);
    if (selectEstado) selectEstado.addEventListener('change', aplicarFiltros);
    if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);

    // -----------------------------------------------
    // CAMBIAR CANTIDAD A VENDER
    // -----------------------------------------------
    // Cuando el admin cambia la cantidad de un producto,
    // hago PATCH a la API con la nueva cantidad.
    // Si es huevo, multiplico por 30 antes de enviar a la BD.
    document.querySelectorAll('.campo-cantidad').forEach(input => {
        input.addEventListener('change', async (e) => {
            const idProducto = e.target.dataset.id;
            const esHuevo = e.target.dataset.esHuevo === 'true';
            const nuevaCantidad = parseInt(e.target.value, 10);
            const tarjeta = e.target.closest('.tarjeta-producto');
            const checkbox = tarjeta.querySelector('.check-habilitar');

            if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
                toast('advertencia', 'Ingresa una cantidad válida');
                return;
            }

            // Si es huevo, multiplico por 30 para enviar unidades reales a la BD
            const cantidadEnviar = esHuevo ? nuevaCantidad * 30 : nuevaCantidad;

            const nombreProducto = tarjeta.dataset.nombre || 'este producto';
            const confirmar = confirm(`¿Deseas actualizar la cantidad de "${nombreProducto}" a ${nuevaCantidad}?`);
            if (!confirmar) {
                toast('info', 'Cambios cancelados.');
                return;
            }

            try {
                const response = await fetch(`/api/admin/productos/limite-venta/${idProducto}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cantidad: cantidadEnviar })
                });

                const data = await response.json();

                if (response.ok) {
                    // Actualizo los atributos data de la tarjeta para que los filtros funcionen
                    tarjeta.dataset.cantidad = data.limite;
                    tarjeta.dataset.estado = data.estado;
                    if (checkbox) checkbox.checked = (data.estado === 'activo');
                } else {
                    toast('error', data.error || 'Error al actualizar la cantidad');
                }
            } catch (error) {
                console.error(error);
                toast('error', 'Error de conexión con el servidor');
            }
        });
    });

    // -----------------------------------------------
    // CAMBIAR ESTADO DE UN PRODUCTO (ACTIVO / INACTIVO)
    // -----------------------------------------------
    // Hace PATCH a la API para cambiar el estado manualmente.
    // Se llama desde el switch de habilitar/deshabilitar.
    async function actualizarEstadoProducto(idProducto, nuevoEstado, cantidad) {
        try {
            const response = await fetch(`/api/admin/productos/estado/${idProducto}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: nuevoEstado === 'activo', cantidad })
            });

            const data = await response.json();

            if (response.ok) {
                const tarjeta = document.querySelector(`.check-habilitar[data-id="${idProducto}"]`)?.closest('.tarjeta-producto');
                if (tarjeta) {
                    tarjeta.dataset.estado = data.estado;
                }
                toast('exito', data.mensaje || `Producto ${nuevoEstado === 'activo' ? 'habilitado' : 'deshabilitado'} correctamente.`);
            } else {
                toast('error', data.error || 'Error al actualizar el estado del producto');
                // Revertir el switch si falló
                const checkbox = document.querySelector(`.check-habilitar[data-id="${idProducto}"]`);
                if (checkbox) checkbox.checked = (nuevoEstado !== 'activo');
            }
        } catch (error) {
            console.error(error);
            toast('error', 'Error de conexión con el servidor');
            const checkbox = document.querySelector(`.check-habilitar[data-id="${idProducto}"]`);
            if (checkbox) checkbox.checked = (nuevoEstado !== 'activo');
        }
    }

    // -----------------------------------------------
    // SWITCH DE HABILITAR / DESHABILITAR
    // -----------------------------------------------
    // Cuando el admin cambia el switch de estado de un producto,
    // verifico que no esté intentando activar con cantidad 0.
    document.querySelectorAll('.check-habilitar').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const idProducto = e.target.dataset.id;
            const inputCantidad = document.querySelector(`.campo-cantidad[data-id="${idProducto}"]`);
            
            const esHuevo = inputCantidad?.dataset.esHuevo === 'true';
            const cantidad = Number(inputCantidad?.value || 0);

            // No permito activar un producto con cantidad 0
            if (e.target.checked && cantidad <= 0) {
                e.preventDefault();
                e.target.checked = false;
                toast('advertencia', 'No puedes habilitar un producto con cantidad 0 o vacía. Ingresa una cantidad válida primero.');
                
                if (inputCantidad) inputCantidad.focus();
                return;
            }

            const cantidadEnviar = esHuevo ? cantidad * 30 : cantidad;
            actualizarEstadoProducto(idProducto, e.target.checked ? 'activo' : 'inactivo', cantidadEnviar);
        });
    });

    // -----------------------------------------------
    // CRUD DE PRODUCTOS (CREAR / EDITAR / IMAGEN)
    // -----------------------------------------------
    const modalProducto = document.getElementById('modalProducto');
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    const cerrarModalProducto = document.getElementById('cerrarModalProducto');
    const formularioProducto = document.getElementById('formProducto');
    const campoIdProducto = document.getElementById('campoIdProducto');
    const campoImagen = document.getElementById('campoImagen');
    const previewImagen = document.getElementById('previewImagen');

    // Abre el modal en modo crear o editar
    function abrirModalProducto(modo, tarjeta) {
        if (!modalProducto) return;
        formularioProducto.reset();
        if (previewImagen) previewImagen.innerHTML = '';

        if (modo === 'editar' && tarjeta) {
            document.getElementById('tituloModalProducto').textContent = 'Editar Producto';
            campoIdProducto.value = tarjeta.dataset.id;
            document.getElementById('campoNombre').value = tarjeta.dataset.nombreOriginal || '';
            document.getElementById('campoCategoria').value = tarjeta.dataset.categoria || '';
            document.getElementById('campoUnidad').value = tarjeta.dataset.unidad || '';
            document.getElementById('campoLugar').value = tarjeta.dataset.lugar || '';
            document.getElementById('campoPrecio').value = tarjeta.dataset.precio || '';
            document.getElementById('campoDescripcion').value = tarjeta.dataset.descripcion || '';
            // La cantidad a vender ya se gestiona con el campo de la tarjeta
            const campoLimite = document.getElementById('campoLimiteVenta');
            campoLimite.value = tarjeta.dataset.cantidad || 0;
            campoLimite.disabled = true;
        } else {
            document.getElementById('tituloModalProducto').textContent = 'Nuevo Producto';
            campoIdProducto.value = '';
            const campoLimite = document.getElementById('campoLimiteVenta');
            campoLimite.disabled = false;
        }

        modalProducto.style.display = 'flex';
    }

    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', () => abrirModalProducto('crear', null));
    }

    document.querySelectorAll('.btn-editar-producto').forEach((btnEditar) => {
        btnEditar.addEventListener('click', () => {
            const tarjeta = btnEditar.closest('.tarjeta-producto');
            abrirModalProducto('editar', tarjeta);
        });
    });

    if (cerrarModalProducto) {
        cerrarModalProducto.addEventListener('click', () => { modalProducto.style.display = 'none'; });
    }
    if (modalProducto) {
        window.addEventListener('click', (evento) => {
            if (evento.target === modalProducto) modalProducto.style.display = 'none';
        });
    }

    // Lectura de la imagen en base64 para mostrarla y enviarla al servidor
    function leerImagenBase64(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve(lector.result);
            lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            lector.readAsDataURL(archivo);
        });
    }

    if (campoImagen) {
        campoImagen.addEventListener('change', () => {
            const archivo = campoImagen.files && campoImagen.files[0];
            if (!archivo || !previewImagen) return;
            leerImagenBase64(archivo).then((dataUrl) => {
                previewImagen.innerHTML = `<img src="${dataUrl}" alt="Vista previa">`;
            }).catch(() => {
                toast('error', 'No se pudo previsualizar la imagen.');
            });
        });
    }

    // Guardar (crear o editar) y subir imagen si viene adjunta
    if (formularioProducto) {
        formularioProducto.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const idProducto = campoIdProducto.value;
            const esNuevo = !idProducto;

            const datos = {
                nombre: document.getElementById('campoNombre').value.trim(),
                categoria: document.getElementById('campoCategoria').value.trim(),
                unidad: document.getElementById('campoUnidad').value.trim(),
                lugar: document.getElementById('campoLugar').value.trim(),
                precio: document.getElementById('campoPrecio').value,
                descripcion: document.getElementById('campoDescripcion').value.trim(),
                limiteVenta: document.getElementById('campoLimiteVenta').value
            };

            const botonGuardar = document.getElementById('btnGuardarProducto');
            if (botonGuardar) { botonGuardar.disabled = true; botonGuardar.textContent = 'Guardando...'; }

            try {
                let idFinal = idProducto;
                const urlBase = esNuevo ? '/api/admin/productos' : `/api/admin/productos/${idProducto}/datos`;
                const respuestaGuardar = await fetch(urlBase, {
                    method: esNuevo ? 'POST' : 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const datosGuardar = await respuestaGuardar.json();

                if (!respuestaGuardar.ok) {
                    toast('error', datosGuardar.error || 'Error al guardar el producto.');
                    return;
                }

                if (esNuevo) idFinal = datosGuardar.id;

                // Si el admin eligió una imagen, la subo con el ID ya definido
                const archivoImagen = campoImagen && campoImagen.files && campoImagen.files[0];
                if (archivoImagen && idFinal) {
                    const dataUrl = await leerImagenBase64(archivoImagen);
                    const respuestaImagen = await fetch(`/api/admin/productos/${idFinal}/imagen`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imagen: dataUrl })
                    });
                    const datosImagen = await respuestaImagen.json();
                    if (!respuestaImagen.ok) {
                        toast('advertencia', datosImagen.error || 'El producto se guardó pero no la imagen.');
                    }
                }

                toast('exito', esNuevo ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.');
                setTimeout(() => window.location.reload(), 900);
            } catch (error) {
                console.error(error);
                toast('error', 'Error de conexión con el servidor.');
            } finally {
                const botonGuardar2 = document.getElementById('btnGuardarProducto');
                if (botonGuardar2) { botonGuardar2.disabled = false; botonGuardar2.textContent = 'Guardar producto'; }
            }
        });
    }
});
