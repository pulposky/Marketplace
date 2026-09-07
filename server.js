/* ============================================= */
/* SERVER.JS - SERVIDOR PRINCIPAL                */
/* ============================================= */
/* Es el punto de entrada: primero carga las      */
/* variables del .env, luego levanta la app       */
/* Express (definida en app.js) y por último      */
/* arranca los trabajos en segundo plano y el    */
/* puerto de escucha.                            */
/* ============================================= */

// Limpia la consola al iniciar para tener un log de desarrollo más limpio
console.clear();

const dotenv = require('dotenv');

// Cargo las variables de entorno del archivo .env (DB_HOST, PORT, etc.)
dotenv.config();

// Instancia principal de Express configurada con rutas y middlewares
const app = require('./app');

// -----------------------------------------------
// EXPIRACIÓN AUTOMÁTICA DE APARTADOS (1 HORA)
// -----------------------------------------------
// Cada 60 segundos revisa si hay apartados pendientes
// con más de 1 hora de antigüedad. Si los encuentra,
// los cancela y devuelve el stock al producto.
const expirarApartados = require('./services/expirarApartados');
expirarApartados.iniciar();

// Configuración del puerto (prioriza .env, por defecto usa 3000)
const PORT = Number(process.env.PORT) || 3000;

// Arranco la escucha del servidor HTTP
const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});

// Manejo de errores no capturados globales (evita que la app muera en silencio)
process.on('uncaughtException', (err) => {
    console.error('Error no capturado (uncaughtException):', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promesa rechazada sin manejar (unhandledRejection):', reason);
});

// Cierre limpio del proceso (Graceful Shutdown) ante señales de detención (Ctrl+C, SIGTERM)
const apagar = (señal) => {
    console.log(`\nRecibido ${señal}, cerrando servidor de forma limpia...`);
    
    server.close(() => {
        console.log('Servidor Express cerrado.');
        process.exit(0);
    });
    
    // Mecanismo de seguridad: si las conexiones tardan más de 10s en cerrarse, fuerza la salida
    setTimeout(() => {
        console.error('Forzando la salida del proceso por exceso de tiempo.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
