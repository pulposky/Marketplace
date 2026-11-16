/* =============================================
   EDITOR DEL INICIO POR BLOQUES - PANEL ADMIN
   =============================================
   Lista de bloques que el dueño agrega, ordena,
   edita y quita. Los datos llegan en #datosBloques
   (tipos, bloques guardados, categorías). Se envían
   con el botón Guardar de la configuración:
   configuracionTienda.js llama a bloquesInicio.recoger().
   Las imágenes se suben a POST /api/admin/tienda/imagen.
   El servidor vuelve a validar todo (utils/bloques.js).
   ============================================= */

(function () {
    'use strict';

    const datos = JSON.parse(document.getElementById('datosBloques').dataset.json);
    const lista = document.getElementById('listaBloques');
    const selectTipo = document.getElementById('tipoNuevoBloque');
    const btnAgregar = document.getElementById('btnAgregarBloque');
    const MAX_IMAGEN = 3 * 1024 * 1024;

    const ETIQUETAS = {
        titulo: 'Título', texto: 'Texto', texto_boton: 'Texto del botón', enlace_boton: 'Enlace del botón', enlace: 'Enlace del botón',
        imagen: 'Imagen', cantidad: 'Cantidad de productos', con_reloj: 'Mostrar el reloj de la oferta', categoria: 'Categoría',
        cantidad_categorias: 'Cuántas categorías mostrar', pasos: 'Pasos',
    };
    const AYUDAS = {
        portada: { titulo: 'Vacío = el eslogan de la tienda.', texto_boton: 'Vacío = "Ver el catálogo".', imagen: 'Opcional. Sin imagen se muestran tres productos destacados.' },
        destacados: { titulo: 'Vacío = el nombre por defecto según el tipo de negocio.' },
        categoria: { titulo: 'Vacío = el nombre de la categoría.' },
        categorias_auto: { cantidad_categorias: 'Muestra las categorías con más productos, cada una en su franja.' },
        banner: { enlace: 'Empieza por / (una página de la tienda) o por https://' },
    };

    let bloques = Array.isArray(datos.bloques) ? datos.bloques.map((b) => JSON.parse(JSON.stringify(b))) : [];
    let abierto = -1; // índice del bloque que se está editando

    const el = (etiqueta, props, hijos) => {
        const nodo = document.createElement(etiqueta);
        Object.assign(nodo, props || {});
        (hijos || []).forEach((h) => nodo.append(h));
        return nodo;
    };

    // Bloque nuevo con los valores por defecto de su tipo
    function nuevoBloque(tipo) {
        const b = { tipo };
        Object.entries(datos.tipos[tipo].campos).forEach(([nombre, regla]) => {
            if (regla.clase === 'pasos') b[nombre] = datos.pasosDefecto.map((p) => ({ ...p }));
            else if (regla.clase === 'categoria') b[nombre] = datos.categorias[0] || '';
            else b[nombre] = regla.defecto !== undefined ? regla.defecto : '';
        });
        return b;
    }

    function resumen(b) {
        if (b.tipo === 'categoria') return b.categoria + (datos.categorias.includes(b.categoria) ? '' : ' · categoría no encontrada');
        if (b.tipo === 'categorias_auto') return `${b.cantidad_categorias} categorías`;
        if (b.tipo === 'banner' && !b.imagen) return 'Falta la imagen';
        return b.titulo || '';
    }

    // ---------- Campos del formulario de un bloque ----------
    function campoTexto(b, nombre, regla, idBase) {
        const id = `${idBase}-${nombre}`;
        const largo = regla.max > 120;
        const input = el(largo ? 'textarea' : 'input', { id, maxLength: regla.max, value: b[nombre] || '' });
        if (!largo) input.type = 'text';
        if (largo) input.rows = 3;
        input.addEventListener('input', () => { b[nombre] = input.value; refrescarResumen(); });
        return [input, id];
    }

    function campo(b, nombre, regla, idBase) {
        const id = `${idBase}-${nombre}`;
        let control;
        switch (regla.clase) {
        case 'texto':
            [control] = campoTexto(b, nombre, regla, idBase);
            break;
        case 'entero':
            control = el('input', { id, type: 'number', min: regla.min, max: regla.max, step: 1, value: b[nombre] });
            control.addEventListener('input', () => { b[nombre] = Number(control.value); refrescarResumen(); });
            break;
        case 'bool': {
            control = el('input', { id, type: 'checkbox', checked: !!b[nombre] });
            control.addEventListener('change', () => { b[nombre] = control.checked; });
            return el('div', { className: 'campo campo-check' }, [el('label', { htmlFor: id }, [control, ' ' + ETIQUETAS[nombre]])]);
        }
        case 'enlace':
            control = el('input', { id, type: 'text', maxLength: 200, value: b[nombre] || '', placeholder: '/catalogo' });
            control.addEventListener('input', () => { b[nombre] = control.value.trim(); });
            break;
        case 'categoria': {
            control = el('select', { id });
            const opciones = datos.categorias.includes(b[nombre]) || !b[nombre] ? datos.categorias : [b[nombre], ...datos.categorias];
            opciones.forEach((nombreCat) => control.append(el('option', {
                value: nombreCat, selected: nombreCat === b[nombre],
                textContent: datos.categorias.includes(nombreCat) ? nombreCat : `${nombreCat} (no encontrada)`,
            })));
            control.addEventListener('change', () => { b[nombre] = control.value; refrescarResumen(); });
            break;
        }
        case 'imagen':
            return campoImagen(b, nombre, id);
        case 'pasos':
            return campoPasos(b, nombre, idBase);
        default:
            return document.createTextNode('');
        }
        const ayuda = (AYUDAS[b.tipo] || {})[nombre];
        return el('div', { className: 'campo' }, [
            el('label', { htmlFor: id, textContent: ETIQUETAS[nombre] || nombre }),
            control,
            ...(ayuda ? [el('span', { className: 'ayuda-campo', textContent: ayuda })] : []),
        ]);
    }

    function campoImagen(b, nombre, id) {
        const vista = el('img', { className: 'bloque-imagen-vista', alt: '', hidden: !b[nombre] });
        if (b[nombre]) vista.src = b[nombre];
        const archivo = el('input', { id, type: 'file', accept: 'image/jpeg,image/png,image/webp' });
        const quitar = el('button', { type: 'button', className: 'btn-texto', textContent: 'Quitar imagen', hidden: !b[nombre] });
        const estado = el('span', { className: 'ayuda-campo', textContent: (AYUDAS[b.tipo] || {})[nombre] || 'JPG, PNG o WebP de hasta 3 MB.' });
        archivo.addEventListener('change', async () => {
            const f = archivo.files[0];
            if (!f) return;
            if (f.size > MAX_IMAGEN) { estado.textContent = 'La imagen pesa más de 3 MB.'; return; }
            estado.textContent = 'Subiendo...';
            try {
                const dataUrl = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(f); });
                const resp = await fetch('/api/admin/tienda/imagen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagen: dataUrl }) });
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok || !json.ok) { estado.textContent = json.mensaje || 'No se pudo subir la imagen.'; return; }
                b[nombre] = json.ruta;
                vista.src = json.ruta; vista.hidden = false; quitar.hidden = false;
                estado.textContent = 'Imagen lista. Recuerda guardar los cambios.';
                refrescarResumen();
            } catch (e) {
                estado.textContent = 'Error de conexión al subir la imagen.';
            }
        });
        quitar.addEventListener('click', () => { b[nombre] = ''; vista.hidden = true; quitar.hidden = true; archivo.value = ''; refrescarResumen(); });
        return el('div', { className: 'campo' }, [el('label', { htmlFor: id, textContent: ETIQUETAS[nombre] }), vista, archivo, quitar, estado]);
    }

    function campoPasos(b, nombre, idBase) {
        const caja = el('fieldset', { className: 'campo bloque-pasos-editor' }, [el('legend', { textContent: 'Los cuatro pasos' })]);
        b[nombre].forEach((paso, i) => {
            const idT = `${idBase}-paso${i}-t`;
            const idX = `${idBase}-paso${i}-x`;
            const t = el('input', { id: idT, type: 'text', maxLength: 40, value: paso.titulo });
            const x = el('input', { id: idX, type: 'text', maxLength: 160, value: paso.texto });
            t.addEventListener('input', () => { paso.titulo = t.value; });
            x.addEventListener('input', () => { paso.texto = x.value; });
            caja.append(el('div', { className: 'bloque-paso' }, [
                el('label', { htmlFor: idT, textContent: `Paso ${i + 1}` }), t,
                el('label', { htmlFor: idX, className: 'solo-lector', textContent: `Texto del paso ${i + 1}` }), x,
            ]));
        });
        return caja;
    }

    // ---------- Lista ----------
    function refrescarResumen() {
        const li = lista.children[abierto];
        if (li) li.querySelector('.bloque-resumen').textContent = resumen(bloques[abierto]);
    }

    function boton(texto, etiqueta, accion, deshabilitado) {
        const b = el('button', { type: 'button', className: 'btn-icono-bloque', textContent: texto, disabled: !!deshabilitado });
        b.setAttribute('aria-label', etiqueta);
        b.addEventListener('click', accion);
        return b;
    }

    function mover(i, paso) {
        const j = i + paso;
        [bloques[i], bloques[j]] = [bloques[j], bloques[i]];
        if (abierto === i) abierto = j; else if (abierto === j) abierto = i;
        pintar();
        lista.children[j].querySelector(`[data-accion="${paso < 0 ? 'subir' : 'bajar'}"]`)?.focus();
    }

    function pintar() {
        lista.replaceChildren();
        bloques.forEach((b, i) => {
            const tipo = datos.tipos[b.tipo];
            const nombre = tipo ? tipo.nombre : b.tipo;
            const subir = boton('↑', `Subir ${nombre}`, () => mover(i, -1), i === 0);
            const bajar = boton('↓', `Bajar ${nombre}`, () => mover(i, 1), i === bloques.length - 1);
            subir.dataset.accion = 'subir'; bajar.dataset.accion = 'bajar';
            const tieneCampos = tipo && Object.keys(tipo.campos).length > 0;
            // Sin campos el botón queda invisible pero ocupa su lugar, así las filas no se desalinean
            const editar = el('button', { type: 'button', className: 'btn-texto' + (tieneCampos ? '' : ' sin-editar'), textContent: abierto === i ? 'Cerrar' : 'Editar', disabled: !tieneCampos });
            editar.setAttribute('aria-expanded', String(abierto === i));
            editar.addEventListener('click', () => { abierto = abierto === i ? -1 : i; pintar(); lista.children[i].querySelector('.btn-texto').focus(); });
            const quitar = el('button', { type: 'button', className: 'btn-texto btn-peligro', textContent: 'Quitar' });
            quitar.addEventListener('click', () => {
                bloques.splice(i, 1);
                if (abierto === i) abierto = -1; else if (abierto > i) abierto -= 1;
                pintar();
            });
            const fila = el('div', { className: 'bloque-fila' }, [
                el('span', { className: 'bloque-num', textContent: String(i + 1) }),
                el('div', { className: 'bloque-nombre' }, [el('b', { textContent: nombre }), el('span', { className: 'bloque-resumen', textContent: resumen(b) })]),
                el('div', { className: 'bloque-acciones' }, [subir, bajar, editar, quitar]),
            ]);
            const li = el('li', { className: 'bloque-item' + (abierto === i ? ' abierto' : '') }, [fila]);
            if (abierto === i && tieneCampos) {
                const idBase = `bloque${i}`;
                li.append(el('div', { className: 'bloque-editor config-grid' }, Object.entries(tipo.campos).map(([n, regla]) => campo(b, n, regla, idBase))));
            }
            lista.append(li);
        });
        btnAgregar.disabled = bloques.length >= datos.max;
        if (!bloques.length) lista.append(el('li', { className: 'bloques-vacio', textContent: 'El inicio no tiene bloques. Agrega al menos una portada.' }));
    }

    btnAgregar.addEventListener('click', () => {
        bloques.push(nuevoBloque(selectTipo.value));
        abierto = bloques.length - 1;
        pintar();
        lista.children[abierto].querySelector('input, select, textarea')?.focus();
    });

    pintar();
    window.bloquesInicio = { recoger: () => bloques };
})();
