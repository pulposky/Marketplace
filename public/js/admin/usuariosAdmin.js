// =============================================
// GESTIÓN DE USUARIOS DEL PANEL - JAVASCRIPT
// =============================================
// Vista del personal del panel (permiso 'usuarios'):
// crear, editar, cambiar contraseña y
// activar/desactivar. Solo un Administrador puede
// tocar cuentas de Administrador.
//   - Carga la lista desde /api/admin/usuarios
//   - Búsqueda en vivo por nombre o usuario
//   - Modales para crear/editar y cambiar contraseña
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const cuerpoTabla = document.getElementById('cuerpoTablaUsuarios');
    const estadoVacio = document.getElementById('estadoVacioUsuarios');
    const inputBuscar = document.getElementById('inputBuscarUsuario');
    const btnNuevo = document.getElementById('btnNuevoUsuario');

    const modalUsuario = document.getElementById('modalUsuario');
    const tituloModal = document.getElementById('tituloModalUsuario');
    const formUsuario = document.getElementById('formUsuario');
    const usuarioId = document.getElementById('usuarioId');
    const campoNombre = document.getElementById('campoNombre');
    const campoUsuario = document.getElementById('campoUsuario');
    const campoRol = document.getElementById('campoRol');
    const campoPassword = document.getElementById('campoPassword');
    const campoPasswordContenedor = document.getElementById('campoPasswordContenedor');
    const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');

    const modalPassword = document.getElementById('modalPassword');
    const formPassword = document.getElementById('formPassword');
    const passwordUsuarioId = document.getElementById('passwordUsuarioId');
    const passwordUsuarioTexto = document.getElementById('passwordUsuarioTexto');
    const campoNuevaPassword = document.getElementById('campoNuevaPassword');
    const btnCancelarPassword = document.getElementById('btnCancelarPassword');

    const usuarioActual = window.USUARIO_ACTUAL || {};
    // ¿El que está gestionando es Administrador? (define si puede tocar cuentas admin).
    const esSuperAdmin = window.ES_SUPERADMIN === true;

    // Última lista cargada (para editar sin volver a pedirla).
    let usuariosCache = [];

    // Las opciones del <select> son canónicas; la BD guarda el nombre visible.
    const ROL_A_CANON = {
        administrador: 'admin',
        admin: 'admin',
        supervisor: 'supervisor',
        promotor: 'promotor',
        tecnico: 'tecnico'
    };

    const ETIQUETA_ROL = {
        admin: 'Administrador',
        supervisor: 'Supervisor',
        promotor: 'Promotor',
        tecnico: 'Técnico'
    };

    function quitarTildes(texto) {
        return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function canonRol(rol) {
        return ROL_A_CANON[quitarTildes(rol)] || quitarTildes(rol);
    }

    // Escapo el HTML para evitar XSS al pintar nombres/usuario en la tabla.
    function escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto === null || texto === undefined ? '' : String(texto);
        return div.innerHTML;
    }

    // -----------------------------------------------
    // CARGAR LISTA
    // -----------------------------------------------
    async function cargarUsuarios(busqueda = '') {
        try {
            const url = '/api/admin/usuarios' + (busqueda ? `?buscar=${encodeURIComponent(busqueda)}` : '');
            const resp = await fetch(url);
            const data = await resp.json();

            if (resp.ok && data.ok) {
                usuariosCache = data.usuarios || [];
                dibujarTabla(usuariosCache);
            } else {
                toast('error', (data && data.mensaje) || 'No se pudieron cargar los usuarios.');
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            toast('error', 'Error de conexión al cargar los usuarios.');
        }
    }

    function dibujarTabla(usuarios) {
        if (!usuarios.length) {
            cuerpoTabla.innerHTML = '';
            estadoVacio.style.display = 'block';
            return;
        }
        estadoVacio.style.display = 'none';

        cuerpoTabla.innerHTML = usuarios.map((u) => {
            const esYo = Number(usuarioActual.id) === Number(u.id);
            const activo = Number(u.activo) === 1 || u.activo === true || u.activo === '1';
            const etiquetaRol = ETIQUETA_ROL[canonRol(u.rol)] || u.rol;

            // Un gestor que no sea Administrador no puede tocar cuentas de
            // Administrador: le desactivo los botones (el servidor también lo valida).
            const bloqueado = !esSuperAdmin && canonRol(u.rol) === 'admin';
            const attrBloqueo = bloqueado
                ? 'disabled title="Solo un Administrador puede gestionar cuentas de Administrador."'
                : '';

            return `
                <tr>
                    <td>${escaparHTML(u.nombre)}${esYo ? ' <span class="badge badge-rol">Tú</span>' : ''}</td>
                    <td>${escaparHTML(u.usuario)}</td>
                    <td><span class="badge badge-rol">${escaparHTML(etiquetaRol)}</span></td>
                    <td>
                        <span class="badge ${activo ? 'badge-activo' : 'badge-inactivo'}">
                            ${activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <div class="acciones-fila">
                            <button type="button" class="btn btn-secundario btn-mini" data-accion="editar" data-id="${u.id}" ${attrBloqueo}>Editar</button>
                            <button type="button" class="btn btn-secundario btn-mini" data-accion="password" data-id="${u.id}" data-usuario="${escaparHTML(u.usuario)}" ${attrBloqueo}>Contraseña</button>
                            <button type="button" class="btn ${activo ? 'btn-peligro' : 'btn-primario'} btn-mini" data-accion="estado" data-id="${u.id}" data-activo="${activo ? '1' : '0'}" ${(esYo || bloqueado) ? 'disabled' : ''}>
                                ${activo ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // -----------------------------------------------
    // MODAL CREAR / EDITAR
    // -----------------------------------------------
    function abrirModalNuevo() {
        tituloModal.textContent = 'Nuevo usuario';
        formUsuario.reset();
        usuarioId.value = '';
        campoRol.disabled = false;
        campoPasswordContenedor.style.display = 'flex';
        campoPassword.required = true;
        modalUsuario.classList.add('activo');
        campoNombre.focus();
    }

    function abrirModalEditar(id) {
        const u = usuariosCache.find((x) => Number(x.id) === Number(id));
        if (!u) return;

        tituloModal.textContent = 'Editar usuario';
        usuarioId.value = u.id;
        campoNombre.value = u.nombre || '';
        campoUsuario.value = u.usuario || '';
        campoRol.value = canonRol(u.rol);
        campoPasswordContenedor.style.display = 'none';
        campoPassword.required = false;
        modalUsuario.classList.add('activo');
        campoNombre.focus();
    }

    function cerrarModalUsuario() {
        modalUsuario.classList.remove('activo');
    }

    btnNuevo.addEventListener('click', abrirModalNuevo);
    btnCancelarUsuario.addEventListener('click', cerrarModalUsuario);

    formUsuario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        btnGuardarUsuario.disabled = true;

        const id = usuarioId.value;
        const esEdicion = !!id;
        const payload = {
            nombre: campoNombre.value.trim(),
            usuario: campoUsuario.value.trim(),
            rol: campoRol.value
        };
        if (!esEdicion) payload.password = campoPassword.value;

        try {
            const resp = await fetch(esEdicion ? `/api/admin/usuarios/${id}` : '/api/admin/usuarios', {
                method: esEdicion ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Guardado correctamente.');
                cerrarModalUsuario();
                cargarUsuarios(inputBuscar.value.trim());
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo guardar.');
            }
        } catch (error) {
            console.error('Error guardando usuario:', error);
            toast('error', 'Error de conexión al guardar.');
        } finally {
            btnGuardarUsuario.disabled = false;
        }
    });

    // -----------------------------------------------
    // MODAL CAMBIAR CONTRASEÑA
    // -----------------------------------------------
    function abrirModalPassword(id, nombreUsuario) {
        passwordUsuarioId.value = id;
        passwordUsuarioTexto.textContent = `Usuario: ${nombreUsuario}`;
        formPassword.reset();
        modalPassword.classList.add('activo');
        campoNuevaPassword.focus();
    }

    btnCancelarPassword.addEventListener('click', () => modalPassword.classList.remove('activo'));

    formPassword.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const id = passwordUsuarioId.value;

        try {
            const resp = await fetch(`/api/admin/usuarios/${id}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: campoNuevaPassword.value })
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Contraseña actualizada.');
                modalPassword.classList.remove('activo');
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo cambiar la contraseña.');
            }
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            toast('error', 'Error de conexión al cambiar la contraseña.');
        }
    });

    // -----------------------------------------------
    // ACTIVAR / DESACTIVAR
    // -----------------------------------------------
    async function cambiarEstado(id, activo) {
        try {
            const resp = await fetch(`/api/admin/usuarios/${id}/activo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo })
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Estado actualizado.');
                cargarUsuarios(inputBuscar.value.trim());
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo cambiar el estado.');
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
            toast('error', 'Error de conexión al cambiar el estado.');
        }
    }

    // Delegación de eventos en la tabla.
    cuerpoTabla.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;

        const accion = boton.dataset.accion;
        const id = boton.dataset.id;

        if (accion === 'editar') abrirModalEditar(id);
        else if (accion === 'password') abrirModalPassword(id, boton.dataset.usuario || '');
        else if (accion === 'estado') cambiarEstado(id, boton.dataset.activo !== '1');
    });

    // -----------------------------------------------
    // BÚSQUEDA
    // -----------------------------------------------
    let temporizador;
    inputBuscar.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => cargarUsuarios(inputBuscar.value.trim()), 300);
    });

    cargarUsuarios();
});
