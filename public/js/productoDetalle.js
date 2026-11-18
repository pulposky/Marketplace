// =============================================
// PÁGINA DEL PRODUCTO
// =============================================
// Presentación y cantidad -> "Agregar al carrito" o "Comprar ahora"
// (agrega y lleva a /carrito). La entrega y el pedido se hacen en el
// carrito. El precio es informativo: el servidor lo recalcula al pedir.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const caja = document.getElementById('fichaCompra');
    const inputCantidad = document.getElementById('cantidadDetalle');
    if (!caja || !inputCantidad || !window.Carrito) return;

    const stockUnidades = Number(caja.dataset.limite) || 0;
    const precioUnitario = Number(caja.dataset.precioUnitario) || 0;
    const elegida = () => document.querySelector('input[name="presentacionDetalle"]:checked');
    const cop = (n) => '$' + Math.round(n).toLocaleString('es-CO');
    const texto = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
    let maximo = stockUnidades;
    let factor = 1;
    let etiqueta = caja.dataset.unidad || 'unidad';

    const cantidad = () => Math.min(maximo, Math.max(1, Math.floor(Number(inputCantidad.value) || 1)));

    // Máximo, precio y subtotal según la presentación y la cantidad
    const actualizar = () => {
        const opcion = elegida();
        factor = opcion ? Number(opcion.dataset.factor) || 1 : 1;
        etiqueta = opcion ? opcion.dataset.nombre : (caja.dataset.unidad || 'unidad');
        maximo = Math.floor(stockUnidades / factor);
        inputCantidad.max = maximo;
        if (Number(inputCantidad.value) > maximo) inputCantidad.value = Math.max(1, maximo);
        const linea = document.getElementById('textoDisponiblesDetalle');
        if (linea) linea.hidden = !(linea.dataset.mostrar && maximo <= 5);
        texto('cantDisponiblesDetalle', maximo);
        texto('unidadDisponiblesDetalle', etiqueta);
        texto('fichaPrecio', cop(precioUnitario * factor));
        texto('fichaEtiqueta', `/ ${etiqueta}`);
        texto('fichaSubtotal', cop(precioUnitario * factor * cantidad()));
    };
    document.querySelectorAll('input[name="presentacionDetalle"]').forEach((r) => r.addEventListener('change', actualizar));
    inputCantidad.addEventListener('input', actualizar);
    document.querySelectorAll('.selector-cantidad [data-paso]').forEach((b) => b.addEventListener('click', () => {
        inputCantidad.value = Math.min(maximo, Math.max(1, cantidad() + Number(b.dataset.paso)));
        actualizar();
    }));
    actualizar();

    // Agrega al carrito del servidor; devuelve true si quedó agregado
    const botones = [document.getElementById('btnAgregarCarrito'), document.getElementById('btnComprarAhora')];
    const agregar = async () => {
        if (maximo < 1) { toast('advertencia', 'Este producto está agotado.'); return false; }
        const opcion = elegida();
        botones.forEach((b) => { b.disabled = true; });
        try {
            const r = await window.Carrito.agregar(Number(caja.dataset.id), opcion ? Number(opcion.value) : undefined, cantidad());
            if (r.aviso) toast('advertencia', r.aviso);
            return true;
        } catch (e) {
            toast('error', e.message);
            return false;
        } finally {
            botones.forEach((b) => { b.disabled = false; });
        }
    };

    botones[0].addEventListener('click', async () => {
        if (await agregar()) toast('exito', 'Agregado al carrito.');
    });
    botones[1].addEventListener('click', async () => {
        if (await agregar()) window.location.href = '/carrito';
    });
});
