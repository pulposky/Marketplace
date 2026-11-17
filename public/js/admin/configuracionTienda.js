/* =============================================
   CONFIGURACIÓN DE LA TIENDA - PANEL ADMIN
   =============================================
   Valida en el navegador con las mismas reglas que
   services/tiendaService.js (validarConfiguracion),
   guarda con PUT /api/admin/tienda y sube el logo
   con POST /api/admin/tienda/logo (dataURL ≤ 2 MB).
   ============================================= */

(function () {
    const form = document.getElementById('formConfiguracion');
    const btnGuardar = document.getElementById('btnGuardarConfig');
    const mensaje = document.getElementById('mensajeConfig');
    const inputLogo = document.getElementById('inputLogo');
    const btnLogo = document.getElementById('btnLogo');
    const logoPreview = document.getElementById('logoPreview');
    const monedaSelect = document.getElementById('monedaSelect');
    const monedaOtra = document.getElementById('monedaOtra');
    const monedaOtraCampo = document.getElementById('monedaOtraCampo');

    const MAX_LOGO = 2 * 1024 * 1024;

    // Mismas expresiones que el servidor
    const HEX = /^#[0-9a-fA-F]{6}$/;
    const URL_RED = /^https:\/\/[^\s<>"']+$/;
    const TELEFONO = /^\+?[\d\s()-]{7,20}$/;
    const CORREO = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
    const sinHtml = (v) => !/[<>]/.test(v);
    const opcional = (re, texto) => [(v) => v === '' || re.test(v), texto];
    const SIN_HTML = [sinHtml, 'No puede contener los caracteres < o >.'];

    // campo: [longitud máxima, validador, mensaje]
    const REGLAS = {
        nombre: [100, (v) => v.length > 0 && sinHtml(v), 'El nombre es obligatorio y no puede contener < o >.'],
        eslogan: [200, ...SIN_HTML],
        descripcion: [500, ...SIN_HTML],
        color_primario: [7, (v) => HEX.test(v), 'Usa un color hexadecimal como #1F7A4D.'],
        color_secundario: [7, (v) => HEX.test(v), 'Usa un color hexadecimal como #F2A33A.'],
        telefono: [30, ...opcional(TELEFONO, 'Teléfono no válido (7 a 20 dígitos, puede iniciar con +).')],
        whatsapp: [30, ...opcional(TELEFONO, 'Número no válido (7 a 20 dígitos, puede iniciar con +).')],
        correo: [120, ...opcional(CORREO, 'Correo no válido.')],
        direccion: [200, ...SIN_HTML],
        horario: [200, ...SIN_HTML],
        moneda: [3, (v) => /^[A-Z]{3}$/.test(v), 'La moneda debe ser un código de 3 letras (ej. COP).'],
        facebook: [255, ...opcional(URL_RED, 'Debe ser un enlace que empiece por https://')],
        instagram: [255, ...opcional(URL_RED, 'Debe ser un enlace que empiece por https://')],
        tiktok: [255, ...opcional(URL_RED, 'Debe ser un enlace que empiece por https://')],
        productos_ocultos: [500, ...SIN_HTML],
        tipo_negocio: [20, (v) => /^[a-z_]+$/.test(v), 'Elige un tipo de negocio de la lista.']
    };

    function anunciar(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = 'mensaje-config ' + (tipo === 'exito' ? 'ok' : 'error');
        if (typeof toast === 'function') toast(tipo, texto);
    }

    // ---------- Moneda: select + código libre ----------
    function leerMoneda() {
        const valor = monedaSelect.value === 'OTRA' ? monedaOtra.value : monedaSelect.value;
        return valor.trim().toUpperCase();
    }

    monedaSelect.addEventListener('change', function () {
        monedaOtraCampo.hidden = monedaSelect.value !== 'OTRA';
        if (!monedaOtraCampo.hidden) monedaOtra.focus();
    });

    // ---------- Colores: picker <-> texto + muestra ----------
    function enlazarColor(idTexto, idPicker, idMuestra) {
        const texto = document.getElementById(idTexto);
        const picker = document.getElementById(idPicker);
        const muestra = document.getElementById(idMuestra);
        const pintar = () => {
            if (HEX.test(texto.value.trim())) muestra.style.backgroundColor = texto.value.trim();
        };
        picker.addEventListener('input', function () {
            texto.value = picker.value.toUpperCase();
            pintar();
        });
        texto.addEventListener('input', function () {
            if (HEX.test(texto.value.trim())) picker.value = texto.value.trim().toLowerCase();
            pintar();
        });
        pintar();
    }
    enlazarColor('color_primario', 'picker_primario', 'muestraPrimario');
    enlazarColor('color_secundario', 'picker_secundario', 'muestraSecundario');

    // ---------- Validación y errores en línea ----------
    function marcarError(campo, texto) {
        const error = document.getElementById('error-' + campo);
        const input = campo === 'moneda'
            ? (monedaSelect.value === 'OTRA' ? monedaOtra : monedaSelect)
            : form.elements[campo];
        if (error) error.textContent = texto || '';
        if (input) {
            if (texto) input.setAttribute('aria-invalid', 'true');
            else input.removeAttribute('aria-invalid');
        }
        return input;
    }

    function recogerYValidar() {
        const datos = {};
        let primerInvalido = null;

        Object.keys(REGLAS).forEach(function (campo) {
            const [max, valido, texto] = REGLAS[campo];
            const valor = campo === 'moneda' ? leerMoneda() : form.elements[campo].value.trim();
            const ok = valor.length <= max && valido(valor);
            const input = marcarError(campo, ok ? '' : texto);
            if (!ok && !primerInvalido) primerInvalido = input;
            datos[campo] = valor;
        });

        const minutos = Number(form.elements.minutos_expiracion_apartado.value);
        const minutosOk = Number.isInteger(minutos) && (minutos === 0 || minutos >= 5) && minutos <= 10080;
        const inputMin = marcarError('minutos_expiracion_apartado',
            minutosOk ? '' : 'Usa 0 (no vencen) o un número entero entre 5 y 10080.');
        if (!minutosOk && !primerInvalido) primerInvalido = inputMin;
        datos.minutos_expiracion_apartado = minutos;

        return { datos, primerInvalido };
    }

    // ---------- Apariencia: el servidor valida y completa los valores ----------
    function recogerApariencia() {
        const marcado = (id) => document.getElementById(id).checked;
        const valor = (id) => document.getElementById(id).value.trim();
        return {
            tipografia: valor('ap_tipografia'),
            esquinas: valor('ap_esquinas'),
            mostrar_stock: valor('ap_mostrar_stock'),
            nombre_seccion: valor('ap_nombre_seccion'),
            anuncio_activo: marcado('ap_anuncio_activo'),
            anuncio: valor('ap_anuncio')
        };
    }

    // ---------- Guardar ----------
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const { datos, primerInvalido } = recogerYValidar();
        datos.apariencia = recogerApariencia();
        if (window.bloquesInicio) datos.bloques_inicio = window.bloquesInicio.recoger();
        if (primerInvalido) {
            anunciar('Revisa los campos marcados en rojo.', 'error');
            primerInvalido.focus();
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';
        try {
            const resp = await fetch('/api/admin/tienda', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const json = await resp.json().catch(() => ({}));
            if (!resp.ok || !json.ok) {
                anunciar(json.mensaje || 'No se pudo guardar la configuración.', 'error');
                return;
            }
            anunciar(json.mensaje || 'Configuración guardada.', 'exito');
        } catch (err) {
            anunciar('Error de conexión. Intenta de nuevo.', 'error');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar cambios';
        }
    });

    // ---------- Logo ----------
    function leerComoDataURL(archivo) {
        return new Promise(function (resolver, rechazar) {
            const lector = new FileReader();
            lector.onload = () => resolver(lector.result);
            lector.onerror = () => rechazar(lector.error);
            lector.readAsDataURL(archivo);
        });
    }

    inputLogo.addEventListener('change', async function () {
        const archivo = inputLogo.files[0];
        inputLogo.value = '';
        if (!archivo) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(archivo.type)) {
            anunciar('El logo debe ser PNG, JPG o WebP.', 'error');
            return;
        }
        if (archivo.size > MAX_LOGO) {
            anunciar('El logo es demasiado pesado (máximo 2 MB).', 'error');
            return;
        }

        inputLogo.disabled = true;
        btnLogo.setAttribute('aria-disabled', 'true');
        btnLogo.textContent = 'Subiendo...';
        try {
            const imagen = await leerComoDataURL(archivo);
            const resp = await fetch('/api/admin/tienda/logo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagen })
            });
            const json = await resp.json().catch(() => ({}));
            if (!resp.ok || !json.ok) {
                anunciar(json.mensaje || 'No se pudo subir el logo.', 'error');
                return;
            }
            logoPreview.src = json.tienda.logo_url;
            anunciar(json.mensaje || 'Logo actualizado.', 'exito');
        } catch (err) {
            anunciar('Error al subir el logo. Intenta de nuevo.', 'error');
        } finally {
            inputLogo.disabled = false;
            btnLogo.removeAttribute('aria-disabled');
            btnLogo.textContent = 'Subir nuevo logo';
        }
    });
})();
