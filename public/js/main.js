// =============================================
// PÁGINA PRINCIPAL - JAVASCRIPT
// =============================================
// Carrusel de avisos de la tienda y modal de login.
// Las tarjetas de producto del inicio llevan a la
// ficha, donde se elige la presentación y se aparta.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------
    // CARRUSEL DE AVISOS (dinámico desde /api/carrusel-imagenes)
    // -----------------------------------------------
    const carruselContenedor = document.getElementById('carruselContenedor');

    async function cargarCarrusel() {
        if (!carruselContenedor) return;
        try {
            const respuesta = await fetch('/api/carrusel-imagenes');
            const imagenes = await respuesta.json();
            if (!Array.isArray(imagenes) || imagenes.length === 0) return;

            imagenes.forEach((imagen, i) => {
                const diapositiva = document.createElement('div');
                diapositiva.className = 'carrusel-diapositiva' + (i === 0 ? ' activa' : '');
                const img = document.createElement('img');
                img.src = `/img/carrusel/${encodeURIComponent(imagen)}`;
                img.alt = '';
                diapositiva.appendChild(img);
                carruselContenedor.appendChild(diapositiva);
            });

            const diapositivas = carruselContenedor.querySelectorAll('.carrusel-diapositiva');
            const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (diapositivas.length < 2 || reducirMovimiento) return;
            let indiceActual = 0;
            setInterval(() => {
                diapositivas[indiceActual].classList.remove('activa');
                indiceActual = (indiceActual + 1) % diapositivas.length;
                diapositivas[indiceActual].classList.add('activa');
            }, 5000);
        } catch (error) {
            console.error('Error al cargar imágenes del carrusel:', error);
        }
    }

    cargarCarrusel();

    // -----------------------------------------------
    // MODAL DE LOGIN
    // -----------------------------------------------
    const ventanaLogin = document.getElementById('modalLogin');
    const botonAbrirLogin = document.getElementById('abrirModalLogin');
    const botonCerrarLogin = document.getElementById('cerrarModal');
    const formularioLogin = document.getElementById('formLogin');

    // Flujo multi-paso del cliente (documento, crear contraseña o verificar la existente)
    if (formularioLogin) configurarFormLogin(formularioLogin);

    if (botonAbrirLogin && ventanaLogin) {
        botonAbrirLogin.addEventListener('click', () => { ventanaLogin.style.display = 'flex'; });
    }
    if (botonCerrarLogin && ventanaLogin) {
        botonCerrarLogin.addEventListener('click', () => { ventanaLogin.style.display = 'none'; });
    }
    // Clic en el fondo oscuro cierra el modal
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});
