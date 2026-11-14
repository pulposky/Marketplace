/* ============================================= */
/* APARTADOS.JS - PROPIEDAD DE UN APARTADO       */
/* ============================================= */
/* El dueño de un apartado se identifica por      */
/* id_cliente, nunca por el nombre (los nombres   */
/* no son únicos y el cliente puede cambiarlo).   */
/* ============================================= */

// id del cliente logueado, o null si la sesión no es de un cliente
// (el staff tiene id de la tabla usuarios, que no es un id_cliente).
const idClienteDeSesion = (usuario) => {
    if (!usuario || usuario.role !== 'cliente') return null;
    const id = Number(usuario.id);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// ¿El apartado pertenece al cliente de la sesión?
const esDuenoApartado = (apartado, usuario) => {
    const idCliente = idClienteDeSesion(usuario);
    return idCliente !== null && !!apartado && Number(apartado.id_cliente) === idCliente;
};

module.exports = { idClienteDeSesion, esDuenoApartado };
