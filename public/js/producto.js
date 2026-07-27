function obtenerProductos() {
    fetch('/api/productos')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabla-productos');
            tbody.innerHTML = ''; // Limpia la tabla antes de llenar

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No hay productos en la BD.</td></tr>';
                return;
            }

            // Recorre los datos y crea las filas en el HTML
            data.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td>${p.id_producto}</td>
                        <td>${p.nombre}</td>
                        <td>${p.unidad}</td>
                        <td>${p.lugar}</td>
                        <td>$${p.precio}</td>
                        <td>${p.stock}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error('Error al traer datos:', err));
}