/* ============================================= */
/* TIPONEGOCIO.JS - VOCABULARIO POR TIPO DE TIENDA */
/* ============================================= */
/* El admin elige el tipo de negocio en la        */
/* configuración de la tienda; las vistas públicas */
/* usan estas palabras en vez de textos fijos.     */
/* ============================================= */

const TIPOS = Object.freeze({
    supermercado: {
        nombre: 'Supermercado o tienda de barrio',
        seccion: 'Categoría', secciones: 'Categorías', mostrarStock: true,
        catalogo: 'Catálogo', buscar: 'Buscar arroz, leche, huevos…',
        destacados: 'Lo más pedido', ejemplosPresentacion: 'unidad, paca, cubeta…',
    },
    comida_rapida: {
        nombre: 'Comida rápida o restaurante',
        seccion: 'Sección', secciones: 'Secciones del menú', mostrarStock: false,
        catalogo: 'Menú', buscar: 'Buscar hamburguesas, combos, bebidas…',
        destacados: 'Lo más pedido', ejemplosPresentacion: 'personal, combo, familiar…',
    },
    ferreteria: {
        nombre: 'Ferretería',
        seccion: 'Categoría', secciones: 'Categorías', mostrarStock: true,
        catalogo: 'Catálogo', buscar: 'Buscar tornillos, pintura, cables…',
        destacados: 'Lo más pedido', ejemplosPresentacion: 'unidad, caja, metro…',
    },
    drogueria: {
        nombre: 'Droguería',
        seccion: 'Categoría', secciones: 'Categorías', mostrarStock: true,
        catalogo: 'Catálogo', buscar: 'Buscar medicamentos, cuidado personal…',
        destacados: 'Lo más pedido', ejemplosPresentacion: 'unidad, caja, blíster…',
    },
    general: {
        nombre: 'Otro tipo de negocio',
        seccion: 'Categoría', secciones: 'Categorías', mostrarStock: true,
        catalogo: 'Catálogo', buscar: 'Buscar productos',
        destacados: 'Lo más pedido', ejemplosPresentacion: 'unidad, caja, paquete…',
    },
});

const TIPO_POR_DEFECTO = 'supermercado';

const esTipoValido = (tipo) => Object.prototype.hasOwnProperty.call(TIPOS, tipo);

// Vocabulario del tipo; si el valor no es válido, el del tipo por defecto
const vocabulario = (tipo) => ({ tipo: esTipoValido(tipo) ? tipo : TIPO_POR_DEFECTO, ...TIPOS[esTipoValido(tipo) ? tipo : TIPO_POR_DEFECTO] });

module.exports = { TIPOS, TIPO_POR_DEFECTO, esTipoValido, vocabulario };
