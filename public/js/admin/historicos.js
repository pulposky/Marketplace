// =============================================
// JAVASCRIPT - HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Carga los datos de las API y renderiza
// los gráficos con Chart.js.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // Paleta de colores del proyecto
    const colores = [
        '#0f5132', '#15803d', '#22c55e', '#4ade80', '#86efac',
        '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc',
        '#b45309', '#f59e0b', '#fbbf24'
    ];

    const coloresPastel = [
        '#d1fae5', '#bbf7d0', '#86efac',
        '#dbeafe', '#bfdbfe', '#93c5fd',
        '#fef3c7', '#fde68a', '#fcd34d',
        '#fce7f3', '#fbcfe8', '#f9a8d4'
    ];

    // Opciones comunes para gráficos de barras
    const opcionesBarras = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { font: { size: 11 }, color: '#6b7280' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#6b7280', maxRotation: 45 }
            }
        }
    };

    // ==========================================
    // GRÁFICO: Productos más vendidos
    // ==========================================
    fetch('/api/admin/historicos/productos')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoProductos').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.producto),
                    datasets: [{
                        label: 'Unidades vendidas',
                        data: data.map(d => d.total_vendido),
                        backgroundColor: colores.slice(0, data.length),
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...opcionesBarras,
                    indexAxis: 'y'
                }
            });
        })
        .catch(() => {});

    // ==========================================
    // GRÁFICO: Clientes que más compran
    // ==========================================
    fetch('/api/admin/historicos/clientes')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoClientes').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.cliente),
                    datasets: [{
                        label: 'Pedidos confirmados',
                        data: data.map(d => d.total_pedidos),
                        backgroundColor: coloresPastel.slice(0, data.length),
                        borderColor: colores.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: opcionesBarras
            });
        })
        .catch(() => {});

    // ==========================================
    // GRÁFICO: Ventas por día (línea)
    // ==========================================
    fetch('/api/admin/historicos/ventas-dia')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoVentasDia').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => {
                        const fecha = new Date(d.dia);
                        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                    }),
                    datasets: [{
                        label: 'Ventas',
                        data: data.map(d => d.total_ventas),
                        borderColor: '#0f5132',
                        backgroundColor: 'rgba(15, 81, 50, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#0f5132'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6' },
                            ticks: { font: { size: 11 }, color: '#6b7280', stepSize: 1 }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 45 }
                        }
                    }
                }
            });
        })
        .catch(() => {});

    // ==========================================
    // GRÁFICO: Visitas por día (línea)
    // ==========================================
    fetch('/api/admin/historicos/visitas-dia')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoVisitasDia').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => {
                        const fecha = new Date(d.dia);
                        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                    }),
                    datasets: [{
                        label: 'Visitas',
                        data: data.map(d => d.total_visitas),
                        borderColor: '#b45309',
                        backgroundColor: 'rgba(180, 83, 9, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#b45309'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6' },
                            ticks: { font: { size: 11 }, color: '#6b7280', stepSize: 1 }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 45 }
                        }
                    }
                }
            });
        })
        .catch(() => {});

    // ==========================================
    // GRÁFICO: Estado de pedidos (dona)
    // ==========================================
    fetch('/api/admin/historicos/estados')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoEstados').getContext('2d');
            const coloresDona = {
                'pendiente': '#f59e0b',
                'confirmado': '#22c55e',
                'cancelado': '#ef4444'
            };
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
                    datasets: [{
                        data: data.map(d => d.total),
                        backgroundColor: data.map(d => coloresDona[d.estado] || '#9ca3af'),
                        borderWidth: 3,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { size: 13, weight: '600' },
                                usePointStyle: true,
                                pointStyleWidth: 12
                            }
                        }
                    }
                }
            });
        })
        .catch(() => {});

    // ==========================================
    // GRÁFICO: Rutas más visitadas
    // ==========================================
    fetch('/api/admin/historicos/rutas')
        .then(r => r.json())
        .then(data => {
            if (!data.length) return;
            const ctx = document.getElementById('graficoRutas').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.ruta),
                    datasets: [{
                        label: 'Visitas',
                        data: data.map(d => d.total_visitas),
                        backgroundColor: coloresPastel.slice(0, data.length),
                        borderColor: colores.slice(0, data.length),
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: opcionesBarras
            });
        })
        .catch(() => {});

});
