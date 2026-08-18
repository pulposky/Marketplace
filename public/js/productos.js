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
            imagen: botonApartar.dataset.imagen || '',
            limite: Number(botonApartar.dataset.limite) || 0, // Cubetas enteras o unidades
            esHuevo: botonApartar.dataset.esHuevo === 'true' // Flag booleano
        };

        // Guardar el flag en la dataset del formulario o un input hidden para leerlo al enviar
        if (formularioApartado) {
            formularioApartado.dataset.esHuevo = infoProducto.esHuevo;
        }

        mostrarVentanaApartado(infoProducto);
    });
});

// Ajuste en el submit del formulario de apartado
if (formularioApartado) {
    formularioApartado.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const idVal = campoIdProducto ? campoIdProducto.value : '';
        const cantidadVal = Number(inputCantidadApartar?.value || 0);
        const limiteMax = Number(inputCantidadApartar?.max || 0);
        const esHuevo = formularioApartado.dataset.esHuevo === 'true';

        if (!idVal) {
            alert('Error: No se ha detectado la ID del producto.');
            return;
        }

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

        // Si es huevo, multiplicamos por 30 para enviar unidades reales a la Base de Datos,
        // o enviamos el indicador "esHuevo" para que la conversión la haga Express.
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
                alert(datosRespuesta.mensaje || '¡Producto apartado con éxito!');
                window.location.reload();
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