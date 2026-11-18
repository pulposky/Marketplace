// =============================================
// TIENDA - MOVIMIENTO Y REPISAS
// =============================================
// Sin librerías. Revela los bloques al bajar, marca la
// categoría visible en el menú fijo, mueve las repisas
// con las flechas y cuenta el tiempo de las ofertas.
// Si el dispositivo pide menos movimiento, solo deja
// las flechas y el reloj.
// =============================================

(function () {
    'use strict';

    const raiz = document.documentElement;
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hayObserver = 'IntersectionObserver' in window;

    // Altura de la barra superior, para que el menú de categorías quede fijo justo debajo
    const barra = document.querySelector('.barra');
    const medirBarra = () => { if (barra) raiz.style.setProperty('--alto-barra', barra.offsetHeight + 'px'); };
    medirBarra();
    window.addEventListener('resize', medirBarra);

    // Retraso escalonado para la entrada de rejillas y del contenido de las páginas
    document.querySelectorAll('.rejilla, main.contenedor').forEach((caja) => {
        Array.from(caja.children).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
    });

    // Bloques que están más abajo de la pantalla: entran al aparecer.
    // Los que ya se ven al cargar no se tocan (la página nunca queda oculta).
    if (!sinMovimiento && hayObserver) {
        const revelador = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.remove('por-revelar');
                revelador.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        document.querySelectorAll('.revelar').forEach((el) => {
            if (el.getBoundingClientRect().top > window.innerHeight) {
                el.classList.add('por-revelar');
                revelador.observe(el);
            }
        });
    }

    // Flechas de las repisas
    document.addEventListener('click', (ev) => {
        const boton = ev.target.closest('[data-mover]');
        if (!boton) return;
        const estante = boton.closest('.bloque') && boton.closest('.bloque').querySelector('.estante');
        if (estante) estante.scrollBy({ left: Number(boton.dataset.mover) * estante.clientWidth * 0.8, behavior: sinMovimiento ? 'auto' : 'smooth' });
    });

    // Forma de entrega y datos de envío del pedido (partials/opcionesEntrega.ejs).
    // Los datos de domicilio se piden en un modal (#modalDomicilio) que se abre al elegir "Envío a domicilio".
    const bloqueEntrega = document.querySelector('.entrega-bloque');
    const modalDomicilio = document.getElementById('modalDomicilio');
    const campoDomicilio = (n) => document.querySelector(`[name="domicilio_${n}"]`);
    const datosDomicilio = () => ({
        direccion: campoDomicilio('direccion').value.trim(),
        telefono: campoDomicilio('telefono').value.trim(),
        indicaciones: campoDomicilio('indicaciones').value.trim(),
    });
    // { error, campo } si falta algo; null si está bien (el servidor vuelve a validar)
    const errorDomicilio = (d) => {
        if (d.direccion.length < 5) return { error: 'Escribe la dirección de entrega.', campo: campoDomicilio('direccion') };
        if (!/^\+?[\d\s()-]{7,20}$/.test(d.telefono)) return { error: 'Escribe un teléfono de contacto válido.', campo: campoDomicilio('telefono') };
        return null;
    };
    let domicilioGuardado = false;
    let alCerrarFoco = null;

    const pintarResumenDomicilio = () => {
        const texto = document.getElementById('domicilioTexto');
        const boton = document.getElementById('btnCambiarDomicilio');
        if (!texto) return;
        const d = datosDomicilio();
        texto.textContent = domicilioGuardado
            ? `Enviar a: ${d.direccion} · Tel. ${d.telefono}${d.indicaciones ? ` · ${d.indicaciones}` : ''}`
            : 'Falta la dirección de entrega.';
        boton.textContent = domicilioGuardado ? 'Cambiar' : 'Agregar dirección';
    };
    const abrirDomicilio = (enfocar) => {
        if (!modalDomicilio) return;
        alCerrarFoco = document.activeElement;
        document.getElementById('errorDomicilio').textContent = '';
        modalDomicilio.style.display = 'flex';
        (enfocar || campoDomicilio('direccion')).focus();
    };
    const cerrarDomicilio = () => {
        modalDomicilio.style.display = 'none';
        // Si cerró sin guardar una dirección válida, vuelve a "Recoger" (solo cuando la tienda ofrece ambas)
        const recoger = bloqueEntrega.querySelector('input[name="entrega"][value="recoger"]');
        if (!domicilioGuardado && recoger) recoger.checked = true;
        if (alCerrarFoco && alCerrarFoco.focus) alCerrarFoco.focus();
    };

    if (modalDomicilio && bloqueEntrega) {
        // Al body: dentro del carrito un contenedor con transform recortaría el fondo del modal
        document.body.appendChild(modalDomicilio);
        // Si la cuenta ya trae datos válidos, el resumen arranca lleno (igual se confirman en el modal al elegir domicilio)
        domicilioGuardado = !errorDomicilio(datosDomicilio()) && bloqueEntrega.dataset.entregaTienda === 'domicilio';
        pintarResumenDomicilio();
        bloqueEntrega.addEventListener('change', (ev) => {
            if (ev.target.name === 'entrega' && ev.target.value === 'domicilio') abrirDomicilio();
        });
        document.getElementById('btnCambiarDomicilio').addEventListener('click', () => abrirDomicilio());
        modalDomicilio.querySelectorAll('[data-cerrar-domicilio]').forEach((b) => b.addEventListener('click', cerrarDomicilio));
        modalDomicilio.addEventListener('click', (ev) => { if (ev.target === modalDomicilio) cerrarDomicilio(); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && modalDomicilio.style.display === 'flex') cerrarDomicilio(); });
        document.getElementById('formDomicilio').addEventListener('submit', (ev) => {
            ev.preventDefault();
            const fallo = errorDomicilio(datosDomicilio());
            if (fallo) {
                document.getElementById('errorDomicilio').textContent = fallo.error;
                fallo.campo.focus();
                return;
            }
            domicilioGuardado = true;
            pintarResumenDomicilio();
            cerrarDomicilio();
        });
    }

    // Devuelve { entrega, domicilio } o { error } para avisar antes de enviar (si faltan datos abre el modal).
    window.leerEntrega = () => {
        if (!bloqueEntrega) return {};
        const elegida = bloqueEntrega.querySelector('input[name="entrega"]:checked');
        const entrega = elegida ? elegida.value : bloqueEntrega.dataset.entregaTienda;
        if (entrega !== 'domicilio') return { entrega };
        const domicilio = datosDomicilio();
        const fallo = errorDomicilio(domicilio);
        if (fallo || !domicilioGuardado) {
            abrirDomicilio(fallo && fallo.campo);
            return { error: fallo ? fallo.error : 'Confirma los datos de envío.' };
        }
        return { entrega, domicilio };
    };

    // Botón "Volver": atrás en el historial solo si se vino de esta misma tienda
    document.addEventListener('click', (ev) => {
        const volver = ev.target.closest('[data-volver]');
        if (!volver) return;
        let mismaTienda = false;
        try { mismaTienda = new URL(document.referrer).origin === location.origin; } catch (e) { /* sin referrer */ }
        if (mismaTienda && history.length > 1) { ev.preventDefault(); history.back(); }
    });

    // Desplegable de categorías del menú: se cierra al tocar fuera o con Esc
    const desplegable = document.querySelector('.menu-desplegable');
    if (desplegable) {
        document.addEventListener('click', (ev) => { if (!desplegable.contains(ev.target)) desplegable.open = false; });
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && desplegable.open) { desplegable.open = false; desplegable.querySelector('summary').focus(); }
        });
    }

    // Reloj de las ofertas: hasta la fecha de fin; al llegar a cero se esconde
    const relojes = Array.from(document.querySelectorAll('.reloj[data-fin]'));
    const dos = (n) => String(n).padStart(2, '0');
    const pintarRelojes = () => {
        const ahora = Date.now();
        relojes.forEach((reloj) => {
            const resta = Math.max(0, Math.floor((new Date(reloj.dataset.fin).getTime() - ahora) / 1000));
            if (!resta || Number.isNaN(resta)) { reloj.hidden = true; return; }
            const partes = [[Math.floor(resta / 86400), 'días'], [Math.floor(resta / 3600) % 24, 'horas'], [Math.floor(resta / 60) % 60, 'min'], [resta % 60, 'seg']];
            reloj.innerHTML = partes.map(([n, txt]) => `<span><b>${dos(n)}</b><small>${txt}</small></span>`).join('');
        });
    };
    if (relojes.length) {
        pintarRelojes();
        setInterval(pintarRelojes, 1000);
    }
})();
