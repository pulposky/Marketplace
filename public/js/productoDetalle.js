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

    const agregar = () => {
        if (maximo < 1) { toast('advertencia', 'Este producto está agotado.'); return false; }
        const opcion = elegida();
        const antes = Number(inputCantidad.value) || 1;
        const final = window.Carrito.agregar({
            id: caja.dataset.id,
            presentacionId: opcion ? opcion.value : null,
            nombre: caja.dataset.nombre + (opcion ? ` (${etiqueta})` : ''),
            imagen: caja.dataset.imagen,
            precioNum: precioUnitario * factor,
            unidad: etiqueta,
            limite: maximo
        }, cantidad());
        if (antes > maximo) toast('advertencia', `Solo hay ${maximo} disponibles.`);
        return final;
    };

    document.getElementById('btnAgregarCarrito').addEventListener('click', () => {
        const total = agregar();
        if (total) toast('exito', `Agregado al carrito (${total} en total).`);
    });
    document.getElementById('btnComprarAhora').addEventListener('click', () => {
        if (agregar()) window.location.href = '/carrito';
    });
});
