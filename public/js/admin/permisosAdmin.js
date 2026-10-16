// =============================================
// JAVASCRIPT - ADMINISTRACIÓN DE PERMISOS POR ROL
// =============================================
// Carga la matriz de permisos desde la API y la
// dibuja como una tabla de casillas. Al guardar,
// envía los cambios (PATCH /api/admin/permisos).
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const encabezado = document.getElementById('encabezadoPermisos');
    const cuerpo = document.getElementById('cuerpoPermisos');
    const btnGuardar = document.getElementById('btnGuardarPermisos');
    const estado = document.getElementById('estadoPermisos');

    // Nombre visible de cada rol (las claves que llegan son canónicas).
    const NOMBRES_ROL = {
        admin: 'Administrador',
        supervisor: 'Supervisor',
        promotor: 'Promotor',
        tecnico: 'Técnico'
    };

    let permisosCatalogo = []; // [{ clave, nombre, descripcion }]
    let roles = [];            // ['admin', 'supervisor', ...]
    let matriz = {};           // { rol: [claves permitidas] }

    // -----------------------------------------------
    // LEER DATOS DE LA API
    // -----------------------------------------------
    async function cargarPermisos() {
        try {
            const resp = await fetch('/api/admin/permisos');
            if (!resp.ok) {
                estado.textContent = 'No se pudieron cargar los permisos.';
                estado.className = 'estado-permisos error';
                return;
            }

            const data = await resp.json();
            // Oculto configuracion aunque una respuesta vieja de la API aún la incluya.
            permisosCatalogo = (data.permisos || []).filter((permiso) => permiso.clave !== 'configuracion');
            roles = data.roles || [];
            matriz = data.matriz || {};

            dibujarTabla();
        } catch (error) {
            console.error('Error cargando permisos:', error);
            estado.textContent = 'No se pudieron cargar los permisos.';
            estado.className = 'estado-permisos error';
        }
    }

    // -----------------------------------------------
    // DIBUJAR LA MATRIZ
    // -----------------------------------------------
    function dibujarTabla() {
        // Encabezado: [Permiso] + un título por rol
        let th = '<th class="col-permiso">Permiso</th>';
        roles.forEach((rol) => {
            th += `<th class="col-rol">${NOMBRES_ROL[rol] || rol}</th>`;
        });
        encabezado.innerHTML = `<tr>${th}</tr>`;

        // Cuerpo: una fila por permiso con una casilla por rol
        let html = '';
        permisosCatalogo.forEach((permiso) => {
            html += '<tr>';
            html += `
                <td class="col-permiso">
                    <span class="permiso-nombre">${permiso.nombre}</span>
                    <span class="permiso-desc">${permiso.descripcion || ''}</span>
                </td>
            `;

            roles.forEach((rol) => {
                const esAdmin = rol === 'admin';
                const Marcado = Array.isArray(matriz[rol]) && matriz[rol].includes(permiso.clave);
                html += `
                    <td class="col-rol">
                        <label class="switch">
                            <input type="checkbox"
                                   data-rol="${rol}"
                                   data-permiso="${permiso.clave}"
                                   ${Marcado ? 'checked' : ''}
                                   ${esAdmin ? 'checked disabled' : ''}>
                            <span class="switch-slider"></span>
                        </label>
                    </td>
                `;
            });

            html += '</tr>';
        });
        cuerpo.innerHTML = html;
    }

    // -----------------------------------------------
    // RECOGER EL ESTADO ACTUAL DE LAS CASILLAS
    // -----------------------------------------------
    function recogerCambios() {
        const resultado = {};
        roles.forEach((rol) => {
            if (rol === 'admin') return; // El admin no se toca
            resultado[rol] = [];
        });

        cuerpo.querySelectorAll('input[type="checkbox"][data-rol]').forEach((chk) => {
            const rol = chk.dataset.rol;
            if (rol === 'admin') return;
            if (chk.checked) {
                resultado[rol].push(chk.dataset.permiso);
            }
        });

        return resultado;
    }

    // -----------------------------------------------
    // GUARDAR
    // -----------------------------------------------
    btnGuardar.addEventListener('click', async () => {
        btnGuardar.disabled = true;
        estado.textContent = 'Guardando...';
        estado.className = 'estado-permisos';

        try {
            const resp = await fetch('/api/admin/permisos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roles: recogerCambios() })
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                matriz = recogerCambios();
                estado.textContent = 'Permisos guardados correctamente.';
                estado.className = 'estado-permisos ok';
                if (typeof toast === 'function') toast('exito', 'Permisos actualizados.');
            } else {
                estado.textContent = (data && data.mensaje) || 'No se pudieron guardar los permisos.';
                estado.className = 'estado-permisos error';
            }
        } catch (error) {
            console.error('Error guardando permisos:', error);
            estado.textContent = 'Error de conexión al guardar.';
            estado.className = 'estado-permisos error';
        } finally {
            btnGuardar.disabled = false;
        }
    });

    cargarPermisos();
});
