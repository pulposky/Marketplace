// =============================================
// DASHBOARD DEL PANEL - GRÁFICAS E INDICADORES
// =============================================
// Pide /api/admin/dashboard?dias=N y pinta solo los
// bloques que llegan (el servidor filtra por permisos).
// Gráficas con Chart.js: una sola serie por gráfica,
// en un solo tono, con tooltip al pasar el mouse.
// Las comparaciones (estados, productos, categorías)
// van como filas con nombre, barra y cifra.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const SERIE = '#2a78d6';            // azul de la paleta validada
    const SERIE_SUAVE = 'rgba(42,120,214,0.12)';
    const REJILLA = '#e1e0d9';
    const TINTA_SUAVE = '#52514e';

    const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const copCorto = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
    const entero = new Intl.NumberFormat('es-CO');
    const pesos = (n) => cop.format(Math.round(Number(n) || 0));

    const graficas = {};

    function escaparHTML(texto) {
        return String(texto ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }

    // 'yyyy-mm-dd' -> '14 nov'
    function diaCorto(clave) {
        const [a, m, d] = clave.split('-').map(Number);
        return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    }

    // ---------- Indicadores ----------
    // menosEsMejor: para cancelaciones, bajar es buena noticia
    function pintarIndicador(clave, texto, cambio, menosEsMejor) {
        const tarjeta = document.querySelector(`[data-kpi="${clave}"]`);
        if (!tarjeta) return;
        tarjeta.querySelector('.kpi-valor').textContent = texto;
        const nodo = tarjeta.querySelector('.kpi-cambio');
        if (cambio === null || cambio === undefined) {
            nodo.textContent = 'Sin datos del período anterior';
            nodo.className = 'kpi-cambio neutro';
            return;
        }
        const sube = cambio > 0;
        const bueno = cambio === 0 ? null : (sube !== Boolean(menosEsMejor));
        nodo.textContent = `${cambio === 0 ? '=' : (sube ? '▲' : '▼')} ${Math.abs(cambio).toLocaleString('es-CO')}% vs. anterior`;
        nodo.className = 'kpi-cambio ' + (bueno === null ? 'neutro' : (bueno ? 'bueno' : 'malo'));
    }

    function pintarIndicadores(ind) {
        pintarIndicador('ventas', pesos(ind.ventas.valor), ind.ventas.cambio);
        pintarIndicador('apartados', entero.format(ind.apartados.valor), ind.apartados.cambio);
        pintarIndicador('ticket', pesos(ind.ticket.valor), ind.ticket.cambio);
        pintarIndicador('cancelacion', `${ind.cancelacion.valor.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`, ind.cancelacion.cambio, true);
        pintarIndicador('clientes', entero.format(ind.clientes.valor), ind.clientes.cambio);
    }

    // ---------- Filas con barra (medidores) ----------
    function pintarMedidores(id, filas, vacio) {
        const lista = document.getElementById(id);
        if (!lista) return;
        if (!filas.length) {
            lista.innerHTML = `<li class="vacio">${escaparHTML(vacio)}</li>`;
            return;
        }
        const maximo = Math.max(...filas.map((f) => f.valor), 1);
        lista.innerHTML = filas.map((f) => `
            <li>
                <span class="medidor-nombre">${escaparHTML(f.nombre)}${f.detalle ? `<small>${escaparHTML(f.detalle)}</small>` : ''}</span>
                <span class="medidor-barra"><i style="width:${Math.max(2, (f.valor / maximo) * 100)}%"></i></span>
                <b class="medidor-cifra">${escaparHTML(f.texto)}</b>
            </li>`).join('');
    }

    // ---------- Chart.js ----------
    function opcionesBase(formatoY, formatoTooltip) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 300 },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1d2321', padding: 10, cornerRadius: 6, displayColors: false,
                    callbacks: { label: (ctx) => formatoTooltip(ctx.parsed.y) },
                },
            },
            scales: {
                x: { grid: { display: false }, border: { color: '#c3c2b7' }, ticks: { color: TINTA_SUAVE, maxRotation: 0, autoSkipPadding: 12 } },
                y: {
                    beginAtZero: true, border: { display: false }, grid: { color: REJILLA },
                    ticks: { color: TINTA_SUAVE, maxTicksLimit: 5, precision: 0, callback: formatoY },
                },
            },
        };
    }

    function dibujar(id, config) {
        const lienzo = document.getElementById(id);
        if (!lienzo || typeof Chart === 'undefined') return;
        if (graficas[id]) graficas[id].destroy();
        graficas[id] = new Chart(lienzo, config);
    }

    function columnas(id, etiquetas, valores, formatoY, formatoTooltip) {
        dibujar(id, {
            type: 'bar',
            data: { labels: etiquetas, datasets: [{ data: valores, backgroundColor: SERIE, hoverBackgroundColor: '#1c5cab', borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'start', maxBarThickness: 28 }] },
            options: opcionesBase(formatoY, formatoTooltip),
        });
    }

    function linea(id, etiquetas, valores, formatoTooltip) {
        dibujar(id, {
            type: 'line',
            data: { labels: etiquetas, datasets: [{ data: valores, borderColor: SERIE, backgroundColor: SERIE_SUAVE, fill: true, borderWidth: 2, tension: 0.25, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: SERIE, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2 }] },
            options: opcionesBase((v) => entero.format(v), formatoTooltip),
        });
    }

    function pintarTablaVentas(serie) {
        const cont = document.getElementById('tablaVentas');
        if (!cont) return;
        cont.innerHTML = `<table class="tabla"><thead><tr><th>Día</th><th>Ventas</th><th>Apartados</th></tr></thead><tbody>${
            serie.slice().reverse().map((p) => `<tr><td>${escaparHTML(diaCorto(p.dia))}</td><td>${escaparHTML(pesos(p.ventas))}</td><td>${p.apartados}</td></tr>`).join('')
        }</tbody></table>`;
    }

    // ---------- Requiere atención ----------
    function pintarAtencion(datos) {
        const bloque = document.getElementById('bloqueAtencion');
        const items = [];
        if (datos.pendientes) {
            items.push({ cifra: datos.pendientes.total, texto: 'Pendientes por confirmar', href: '/admin/pedidos', alerta: datos.pendientes.total > 0 });
            items.push({ cifra: datos.pendientes.porVencer, texto: 'Vencen en menos de 15 min', href: '/admin/pedidos', alerta: datos.pendientes.porVencer > 0 });
        }
        if (datos.stock) {
            items.push({ cifra: datos.stock.agotados, texto: 'Productos agotados', href: '/admin/habilitar-producto?stock=agotado', alerta: datos.stock.agotados > 0 });
            items.push({ cifra: datos.stock.bajo.filter((p) => p.disponibles > 0).length, texto: 'Con 10 o menos disponibles', href: '/admin/habilitar-producto?stock=bajo', alerta: false });
        }
        if (!items.length) { bloque.hidden = true; return; }
        bloque.hidden = false;
        bloque.innerHTML = items.map((i) => `
            <a href="${i.href}" class="atencion-item${i.alerta ? ' alerta' : ''}">
                <b>${entero.format(i.cifra)}</b><span>${escaparHTML(i.texto)}</span>
            </a>`).join('');
    }

    function pintarStock(stock) {
        const lista = document.getElementById('listaStock');
        if (!lista) return;
        if (!stock.bajo.length) { lista.innerHTML = '<li class="vacio">Todo el catálogo tiene más de 10 disponibles.</li>'; return; }
        lista.innerHTML = stock.bajo.map((p) => `
            <li><span>${escaparHTML(p.nombre)}</span>
            <b class="${p.disponibles <= 0 ? 'agotado' : ''}">${p.disponibles <= 0 ? 'Agotado' : `Quedan ${entero.format(p.disponibles)} ${escaparHTML(p.unidad || '')}`}</b></li>`).join('');
    }

    const NOMBRE_ESTADO = { pendiente: 'Pendiente', confirmado: 'Confirmado', entregado: 'Entregado', cancelado: 'Cancelado' };

    function pintarUltimos(ultimos) {
        const tabla = document.getElementById('tablaUltimos');
        if (!tabla) return;
        if (!ultimos.length) { tabla.innerHTML = '<tbody><tr><td class="vacio">Todavía no hay apartados.</td></tr></tbody>'; return; }
        tabla.innerHTML = `<thead><tr><th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Estado</th><th>Fecha</th><th class="num">Total</th></tr></thead><tbody>${
            ultimos.map((a) => {
                const cantidad = a.presentacion
                    ? `${Math.floor(a.cantidad / a.presentacion.factor)} ${a.presentacion.nombre}`
                    : `${a.cantidad} ${a.unidad || ''}`;
                const fecha = new Date(a.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return `<tr><td>${escaparHTML(a.cliente)}</td><td>${escaparHTML(a.producto || '—')}</td><td>${escaparHTML(cantidad)}</td>
                    <td><span class="estado estado-${escaparHTML(a.estado)}">${escaparHTML(NOMBRE_ESTADO[a.estado] || a.estado)}</span></td>
                    <td>${escaparHTML(fecha)}</td><td class="num">${escaparHTML(pesos(a.total))}</td></tr>`;
            }).join('')
        }</tbody>`;
    }

    // ---------- Carga ----------
    async function cargar(dias) {
        document.body.classList.add('cargando');
        try {
            const resp = await fetch(`/api/admin/dashboard?dias=${dias}`);
            const datos = await resp.json();
            if (!resp.ok || !datos.ok) throw new Error(datos.mensaje || 'Error');

            pintarAtencion(datos);
            if (datos.stock) pintarStock(datos.stock);
            if (datos.ultimos) pintarUltimos(datos.ultimos);

            if (datos.indicadores) {
                pintarIndicadores(datos.indicadores);
                const etiquetas = datos.serie.map((p) => diaCorto(p.dia));
                columnas('graficaVentas', etiquetas, datos.serie.map((p) => p.ventas), (v) => '$' + copCorto.format(v), (v) => pesos(v));
                pintarTablaVentas(datos.serie);
                linea('graficaVisitas', datos.visitas.map((p) => diaCorto(p.dia)), datos.visitas.map((p) => p.visitas), (v) => `${entero.format(v)} visitantes`);
                columnas('graficaHoras', datos.horas.map((h) => `${h.hora}h`), datos.horas.map((h) => h.total), (v) => entero.format(v), (v) => `${entero.format(v)} apartados`);

                const totalEstados = datos.estados.reduce((s, e) => s + e.total, 0) || 1;
                const orden = ['entregado', 'confirmado', 'pendiente', 'cancelado'];
                pintarMedidores('listaEstados', orden.map((e) => {
                    const total = (datos.estados.find((x) => x.estado === e) || {}).total || 0;
                    return { nombre: NOMBRE_ESTADO[e], valor: total, texto: `${entero.format(total)} · ${Math.round((total / totalEstados) * 100)}%` };
                }).filter((f, i, todas) => todas.some((x) => x.valor > 0)), 'Sin apartados en este período.');
                pintarMedidores('listaTop', datos.topProductos.map((p) => ({
                    nombre: p.nombre, detalle: `${entero.format(p.unidades)} ${p.unidad || ''}`, valor: p.ventas, texto: pesos(p.ventas),
                })), 'Sin ventas entregadas en este período.');
                pintarMedidores('listaCategorias', datos.categorias.map((c) => ({ nombre: c.categoria, valor: c.ventas, texto: pesos(c.ventas) })),
                    'Sin ventas entregadas en este período.');
            }
        } catch (error) {
            console.error('Error cargando el dashboard:', error);
            if (typeof toast === 'function') toast('error', 'No se pudieron cargar los datos del panel.');
        } finally {
            document.body.classList.remove('cargando');
        }
    }

    // Período elegido (se recuerda en este navegador)
    let dias = 30;
    try { dias = Number(localStorage.getItem('panelDias')) || 30; } catch (e) { /* sin almacenamiento */ }
    const radio = document.querySelector(`#periodo input[value="${dias}"]`);
    if (radio) radio.checked = true; else dias = 30;

    document.querySelectorAll('#periodo input').forEach((r) => r.addEventListener('change', () => {
        dias = Number(r.value);
        try { localStorage.setItem('panelDias', String(dias)); } catch (e) { /* sin almacenamiento */ }
        cargar(dias);
    }));

    cargar(dias);
    setInterval(() => cargar(dias), 60000); // refresca cada minuto
});
