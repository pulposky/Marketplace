// =============================================
// VALIDACIÓN DE IMÁGENES SUBIDAS
// =============================================
// El tipo declarado en el dataURL lo controla el cliente,
// así que reviso los bytes mágicos del archivo real.
// Devuelve 'jpg' | 'png' | 'webp' o null si no es ninguno.
// =============================================

const PNG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

const tipoRealImagen = (buffer) => {
    if (!Buffer.isBuffer(buffer)) return null;
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpg';
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) return 'png';
    if (buffer.length >= 12 && buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'webp';
    return null;
};

module.exports = { tipoRealImagen };
