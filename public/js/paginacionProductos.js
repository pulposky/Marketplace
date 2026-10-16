// =============================================
// PAGINACIÓN DE TARJETAS DE PRODUCTOS
// =============================================
// Limita las tarjetas visibles y mantiene la
// paginación al aplicar filtros locales.
// =============================================

window.crearPaginacionProductos = (selector, selectorControles, porPagina = 12) => {
    const tarjetas = Array.from(document.querySelectorAll(selector));
    const controles = document.querySelector(selectorControles);
    let paginaActual = 1;

    function actualizar(tarjetasVisibles = tarjetas) {
        const visibles = new Set(tarjetasVisibles);
        const totalPaginas = Math.max(1, Math.ceil(tarjetasVisibles.length / porPagina));
        paginaActual = Math.min(paginaActual, totalPaginas);
        const inicio = (paginaActual - 1) * porPagina;
        const pagina = new Set(tarjetasVisibles.slice(inicio, inicio + porPagina));
        tarjetas.forEach((tarjeta) => {
            tarjeta.style.display = visibles.has(tarjeta) && pagina.has(tarjeta) ? '' : 'none';
        });
        if (!controles) return;
        controles.replaceChildren();
        if (tarjetasVisibles.length <= porPagina) return;

        const resumen = document.createElement('span');
        resumen.className = 'paginacion-resumen';
        resumen.textContent = `Página ${paginaActual} de ${totalPaginas} · ${tarjetasVisibles.length} productos`;
        controles.appendChild(resumen);

        const boton = (texto, numero, deshabilitado = false, actual = false) => {
            const elemento = document.createElement('button');
            elemento.type = 'button';
            elemento.className = 'boton-paginacion';
            if (texto === 'Anterior' || texto === 'Siguiente') elemento.classList.add('boton-paginacion-direccion');
            elemento.textContent = texto;
            elemento.disabled = deshabilitado;
            if (actual) elemento.setAttribute('aria-current', 'page');
            elemento.addEventListener('click', () => {
                paginaActual = numero;
                actualizar(tarjetasVisibles);
            });
            controles.appendChild(elemento);
        };
        boton('Anterior', paginaActual - 1, paginaActual === 1);
        for (let numero = 1; numero <= totalPaginas; numero++) {
            boton(String(numero), numero, false, numero === paginaActual);
        }
        boton('Siguiente', paginaActual + 1, paginaActual === totalPaginas);
    }

    actualizar();

    return {
        aplicarFiltro(lista) {
            paginaActual = 1;
            actualizar(lista);
        },
        refrescar() { actualizar(); }
    };
};
