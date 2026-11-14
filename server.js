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

// Sin estas variables la app no arranca: nada de valores por defecto
// inseguros (secreto de sesión conocido, usuario root sin clave...).
// DB_PASSWORD debe existir; puede ir vacía solo fuera de producción (p. ej. root de Laragon).
// Los nombres viejos BD_* se aceptan como alias (ver config/database.js).
const { variableBD } = require('./config/database');
const OBLIGATORIAS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'SESSION_SECRET'];
const valorDe = (nombre) => (nombre.startsWith('DB_') ? variableBD(nombre.slice(3)) : process.env[nombre]);
const puedeIrVacia = (nombre) => nombre === 'DB_PASSWORD' && process.env.NODE_ENV !== 'production';
const faltantes = OBLIGATORIAS.filter((nombre) => {
    const valor = valorDe(nombre);
    return valor === undefined || (valor === '' && !puedeIrVacia(nombre));
});
if (faltantes.length > 0) {
    console.error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. Revisa .env (ver .env.example).`);
    process.exit(1);
}
// Secreto corto: en producción no arranca; en desarrollo solo avisa.
if (String(process.env.SESSION_SECRET).length < 32) {
    if (process.env.NODE_ENV === 'production') {
        console.error('SESSION_SECRET debe tener al menos 32 caracteres aleatorios.');
        process.exit(1);
    }
    console.warn('Aviso: SESSION_SECRET tiene menos de 32 caracteres. Cámbialo antes de pasar a producción.');
}

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

// -----------------------------------------------
// PERMISOS POR ROL
// -----------------------------------------------
// Carga en memoria la matriz de permisos guardada en MySQL
// (crea la tabla y siembra los valores por defecto si falta).
// Mientras carga se usan los valores por defecto, así la app
// arranca aunque la base de datos tarde o no esté disponible.
const permisosService = require('./services/permisosService');
permisosService.iniciar();

// -----------------------------------------------
// MÓDULOS DEL SUPERADMIN
// -----------------------------------------------
// Personal del panel (columna usuarios.activo),
// categorías y auditoría. Crea las tablas/columnas
// que falten para esos módulos.
const iniciarModulos = require('./services/iniciarModulos');
iniciarModulos.iniciar();

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
