const formulario = document.getElementById('formLogin');


formulario.addEventListener('submit', async (e)=>{

    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    // console.log(usuario);
    // console.log(password);

    const respuesta = await fetch('/login', {
        method: 'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            usuario,
            password
        })
    });

    console.log(respuesta.status);

    const datos = await respuesta.json();
    const mensaje = document.getElementById('mensaje');

    console.log(datos);

    if(datos.ok){
        mensaje.style.display = "none";
        mensaje.textContent = "";
        mensaje.className = "mensaje-error";

        window.location.href = '/';
    }else{
        mensaje.textContent = datos.mensaje;

        if(datos.tipo === "vacio"){
            mensaje.className = "mensaje-error mensaje-naranja";
        }else{
            mensaje.className = "mensaje-error mensaje-rojo";
        }
        
        document.getElementById('password').value = '';
    }
});