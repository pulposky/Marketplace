// =============================================
// SERVIDOR PRINCIPAL - MARKETPLACE SENA
// =============================================
// Es el punto de entrada: primero carga las
// variables del .env, luego levanta la app Express
// (definida en app.js) y por último arranca los
// trabajos en segundo plano y el puerto de escucha.
// =============================================
console.clear();

const dotenv = require('dotenv');

// Cargo las variables del .env (DB_HOST, PORT, etc.)
dotenv.config();

const app = require('./app');

// -----------------------------------------------
// EXPIRACIÓN AUTOMÁTICA DE APARTADOS (1 HORA)
// -----------------------------------------------
// Cada 60 segundos revisa si hay apartados pendientes
// con más de 1 hora de antigüedad. Si los encuentra,
// los cancela y devuelve el stock al producto.
const expirarApartados = require('./services/expirarApartados');
expirarApartados.iniciar();

const PORT = Number(process.env.PORT) || 3000;

// Arranco el servidor, si no hay puerto en .env uso el 3000
const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});

// Manejo de errores no capturados (evita que se caiga sin avisar)
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promesa rechazada sin manejar:', reason);
});

// Cierre limpio al detener el servidor (Ctrl+C, SIGTERM)
const apagar = (senal) => {
    console.log(`\nRecibido ${senal}, cerrando servidor...`);
    server.close(() => {
        process.exit(0);
    });
    // Falla de seguridad: si no cierra en 10s, fuerza la salida
    setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
