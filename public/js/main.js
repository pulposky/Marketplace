const modal = document.getElementById("modalLogin");
const cerrar = document.getElementById("cerrarModal");

cerrar.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e)=>{
    if(e.target === modal){
        modal.style.display = "none";
    }
};

const rutas = {
    apartar: "/apartar",
    catalogo: "/catalogo",
    logout: "/logout"
};

document.querySelectorAll(".requiere-login").forEach(boton => {

    boton.addEventListener("click", async () => {

        const respuesta = await fetch("/api/verificar-sesion");
        const datos = await respuesta.json();

        if(datos.login){
            const ruta = rutas[boton.dataset.pagina];
            window.location.href = ruta;
        }else{
            modal.style.display = "flex";
        }
    });
});

document.querySelectorAll(".navegacion").forEach(boton => {
    boton.addEventListener("click", () => {
        const ruta = boton.dataset.pagina;
        if (ruta) {
            window.location.href = ruta;
        }
    });
});