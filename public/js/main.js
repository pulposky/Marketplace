document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. REFERENCIAS A ELEMENTOS DEL DOM
    // ==========================================
    
    // Modales (Ventanas emergentes)
    const ventanaApartar = document.getElementById('modalApartarProducto');
    const ventanaLogin = document.getElementById('modalLogin');

    // Botones de cierre (X) para cada modal
    const botonCerrarApartar = document.getElementById('cerrarModalProducto');
    const botonCerrarLogin = document.getElementById('cerrarModal');

    // Campos del formulario dentro del modal de apartado
    const textoNombreProducto = document.getElementById('apartarNombreProducto');
    const textoPrecioProducto = document.getElementById('apartarPrecioProducto');
    const campoIdProducto = document.getElementById('apartarProductoId');
    const formularioApartado = document.getElementById('formConfirmarApartado');

    // Formulario de inicio de sesión
    const formularioLogin = document.getElementById('formLogin');

    // ==========================================
    // 2. FUNCIONES AUXILIARES
    // ==========================================

    function mostrarVentanaApartado(datosProducto) {
        if (textoNombreProducto) textoNombreProducto.textContent = datosProducto.nombre;
        if (textoPrecioProducto) textoPrecioProducto.textContent = datosProducto.precio;
        if (campoIdProducto) campoIdProducto.value = datosProducto.id;
        
        if (ventanaApartar) ventanaApartar.style.display = 'flex';
    }

    // ==========================================
    // 3. EVENTOS DE INTERACCIÓN Y FORMULARIOS
    // ==========================================

    /**
     * Evento al hacer clic en los botones de "Apartar" de las tarjetas de productos.
     * Verifica la sesión en el servidor antes de abrir el modal correspondiente.
     */
    document.querySelectorAll('.btn-accion-apartar').forEach(botonApartar => {
        botonApartar.addEventListener('click', async () => {
            // Extrae los datos guardados en los atributos data-* del HTML
            const infoProducto = {
                id: botonApartar.dataset.id,
                nombre: botonApartar.dataset.nombre,
                precio: botonApartar.dataset.precio
            };

            try {
                // Consulta al servidor si el usuario tiene una sesión activa
                const respuestaSesion = await fetch("/api/verificar-sesion");
                const estadoSesion = await respuestaSesion.json();

                if (estadoSesion.login) {
                    // Si tiene sesión activa, abre el modal para confirmar el apartado
                    mostrarVentanaApartado(infoProducto);
                } else {
                    // Si no ha iniciado sesión, despliega el modal de Login
                    if (ventanaLogin) ventanaLogin.style.display = 'flex';
                }
            } catch (error) {
                console.error("Error al verificar la sesión:", error);
            }
        });
    });

    /**
     * Manejo del envío del formulario de inicio de sesión.
     */
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault(); // Evita que la página se recargue por defecto en el envíó tradicional

            const usuarioIngresado = document.getElementById('usuario').value;
            const claveIngresada = document.getElementById('password').value;

            // Procesa las credenciales con la función externa de login.js
            const esExitoso = await procesarLogin(usuarioIngresado, claveIngresada);

            if (esExitoso) {
                // Recarga la página para que Express/EJS vuelva a renderizar la vista reconociendo la sesión
                window.location.reload(); 
            }
        });
    }

    /**
     * Manejo del envío del formulario para confirmar el apartado de un producto.
     */
    if (formularioApartado) {
        formularioApartado.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            // Objeto con la información requerida por el backend para apartar
            const datosApartado = {
                productoId: campoIdProducto.value,
                cantidad: document.getElementById('cantidadApartar').value
            };

            try {
                // Envía la solicitud POST para registrar el apartado
                const respuestaApartar = await fetch("/api/apartar-producto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosApartado)
                });

                if (respuestaApartar.ok) {
                    alert("¡Producto apartado con éxito!");
                    if (ventanaApartar) ventanaApartar.style.display = 'none';
                    formularioApartado.reset(); // Limpia los campos del formulario
                } else {
                    alert("Error al procesar el apartado.");
                }
            } catch (error) {
                console.error("Error al apartar producto:", error);
            }
        });
    }

    // ==========================================
    // 4. CONTROL DE CIERRE DE MODALES
    // ==========================================

    // Cierre mediante el botón de la equis (X)
    if (botonCerrarApartar) botonCerrarApartar.addEventListener('click', () => ventanaApartar.style.display = 'none');
    if (botonCerrarLogin) botonCerrarLogin.addEventListener('click', () => ventanaLogin.style.display = 'none');

    // Cierre al hacer clic fuera del contenido del modal (en el fondo oscuro)
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaApartar) ventanaApartar.style.display = 'none';
        if (evento.target === ventanaLogin) ventanaLogin.style.display = 'none';
    });
});

// ==========================================
// 5. NAVEGACIÓN Y ACCESOS QUE REQUIEREN SESIÓN
// ==========================================

// Diccionario de redirección según el atributo data-pagina
const rutas = {
    apartar: "/apartar",
    catalogo: "/catalogo",
    logout: "/logout"
};

/**
 * Agrega eventos a todos los elementos con la clase .requiere-login.
 * Si el usuario tiene sesión, lo redirige a la ruta asignada; si no, abre el modal de login.
 */
document.querySelectorAll(".requiere-login").forEach(boton => {
    boton.addEventListener("click", async () => {
        const respuesta = await fetch("/api/verificar-sesion");
        const datos = await respuesta.json();

        if (datos.login) {
            const ruta = rutas[boton.dataset.pagina];
            if (ruta) {
                window.location.href = ruta;
            }
        } else {
            // Nota: Asegúrate de referenciar la variable 'ventanaLogin' definida arriba
            const modalLogin = document.getElementById('modalLogin');
            if (modalLogin) modalLogin.style.display = "flex";
        }
    });
});

/**
 * Agrega eventos a elementos de navegación estándar (sin validación estricta de login).
 */
document.querySelectorAll(".navegacion").forEach(boton => {
    boton.addEventListener("click", () => {
        const ruta = boton.dataset.pagina;
        if (ruta) {
            window.location.href = ruta;
        }
    });
});