// BarReservas Frontend con Supabase
console.log('BarReservas loaded with Supabase');

// 🔧 CONFIGURACIÓN - Supabase conectado
const SUPABASE_URL = 'https://gzrtcoglvfldstoyfhxv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnRjb2dsdmZsZHN0b3lmaHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDQ0NDQsImV4cCI6MjA2OTQ4MDQ0NH0.uJe3JbJe4iOcVT0b8E3nQFUe6MnT3yKqnKNq38NSfIo';

// Cliente Supabase simple
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };
    }

    async get(table, query = '') {
        const response = await fetch(`${this.url}/rest/v1/${table}${query}`, {
            headers: this.headers
        });
        return response.json();
    }

    async post(table, data) {
        const response = await fetch(`${this.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        return response.json();
    }

    async patch(table, id, data) {
        const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🎯 FUNCIONES PRINCIPALES
async function loadTables() {
    try {
        const tables = await supabase.get('tables', '?select=*&order=number');
        displayTables(tables);
    } catch (error) {
        console.error('Error loading tables:', error);
        showError('Error cargando mesas');
    }
}

async function createReservation(formData) {
    try {
        // 1. Crear grupo
        const group = await supabase.post('groups', {
            name: formData.nombre,
            organizer_contact: formData.contacto,
            organizer_contact_type: 'whatsapp'
        });

        if (!group[0]) throw new Error('Error creando grupo');

        // 2. Crear reserva
        const reservation = await supabase.post('reservations', {
            group_id: group[0].id,
            date: formData.fecha,
            time: formData.hora,
            people_count: parseInt(formData.personas),
            status: 'confirmed',
            qr_code_url: `${window.location.origin}/checkin/${group[0].id}`
        });

        if (!reservation[0]) throw new Error('Error creando reserva');

        // 3. Actualizar grupo con reservation_id
        await supabase.patch('groups', group[0].id, {
            reservation_id: reservation[0].id
        });

        showReservationSuccess(reservation[0], group[0]);
        
    } catch (error) {
        console.error('Error creating reservation:', error);
        showError('Error creando reserva: ' + error.message);
    }
}

// 🎨 FUNCIONES DE UI
function displayTables(tables) {
    const statusColors = {
        free: 'bg-green-500/20 text-green-400',
        occupied: 'bg-red-500/20 text-red-400',
        reserved: 'bg-yellow-500/20 text-yellow-400'
    };

    const statusText = {
        free: 'Libre',
        occupied: 'Ocupada',
        reserved: 'Reservada'
    };

    const tablesHtml = tables.map(table => `
        <div class="${statusColors[table.status]} p-4 rounded-lg text-center transition-all hover:scale-105">
            <div class="text-2xl mb-2">🪑</div>
            <div class="font-semibold">Mesa ${table.number}</div>
            <div class="text-sm opacity-80">${table.capacity} personas</div>
            <div class="text-sm capitalize">${table.type}</div>
            <div class="font-bold mt-2">${statusText[table.status]}</div>
        </div>
    `).join('');

    return `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${tablesHtml}
        </div>
        <button onclick="loadTables()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            🔄 Actualizar
        </button>
    `;
}

function showReservationSuccess(reservation, group) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="text-center">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-2xl font-bold mb-4 text-green-400">¡Reserva Creada!</h3>
            <div class="bg-white/10 p-6 rounded-lg mb-4">
                <p><strong>Grupo:</strong> ${group.name}</p>
                <p><strong>Contacto:</strong> ${group.organizer_contact}</p>
                <p><strong>Fecha:</strong> ${reservation.date}</p>
                <p><strong>Hora:</strong> ${reservation.time}</p>
                <p><strong>Personas:</strong> ${reservation.people_count}</p>
            </div>
            <div class="bg-green-500/20 p-4 rounded-lg mb-4">
                <p class="text-green-300 font-semibold">🔗 Link de Check-in:</p>
                <p class="text-sm break-all">${reservation.qr_code_url}</p>
            </div>
            <button onclick="showSection('reservation')" class="bg-purple-500 text-white px-6 py-3 rounded-lg">
                Nueva Reserva
            </button>
        </div>
    `;
}

function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="text-center">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-xl font-bold mb-4 text-red-400">Error</h3>
            <p class="text-red-300">${message}</p>
            <button onclick="showSection('tables')" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
                Volver
            </button>
        </div>
    `;
}

// 🔄 SISTEMA DE NAVEGACIÓN ACTUALIZADO
function showSection(section) {
    const content = document.getElementById('content');
    const sections = {
        reservation: {
            title: '📝 Crear Nueva Reserva',
            content: `
                <form id="reservationForm" class="space-y-4" onsubmit="handleReservation(event)">
                    <input type="text" name="nombre" placeholder="Nombre del grupo" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <input type="text" name="contacto" placeholder="WhatsApp (ej: +52 33 1234 5678)" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <input type="date" name="fecha" class="w-full p-3 rounded-lg bg-white/20 text-white" required>
                    <input type="time" name="hora" class="w-full p-3 rounded-lg bg-white/20 text-white" required>
                    <input type="number" name="personas" placeholder="Número de personas" min="1" max="20" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600">
                        ✨ Crear Reserva
                    </button>
                </form>
            `
        },
        checkin: {
            title: '📱 Check-in de Grupos',
            content: `
                <div class="text-center">
                    <div class="bg-white/20 p-8 rounded-lg mb-4">
                        <div class="text-6xl mb-4">📱</div>
                        <p class="mb-4">Escanea el código QR de la reserva</p>
                        <p class="text-sm opacity-70">Funcionalidad de cámara en desarrollo</p>
                    </div>
                    <div class="bg-blue-500/20 p-4 rounded-lg">
                        <p class="text-blue-300">💡 Tip: Por ahora puedes usar el link directo de la reserva</p>
                    </div>
                </div>
            `
        },
        tables: {
            title: '🪑 Estado de Mesas',
            content: displayTables([]) // Se cargará dinámicamente
        },
        admin: {
            title: '⚙️ Panel Administrativo',
            content: `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white/10 p-6 rounded-lg">
                        <h4 class="text-lg font-bold mb-3">📊 Estadísticas</h4>
                        <p>• Reservas de hoy: <span class="text-green-400 font-bold">0</span></p>
                        <p>• Mesas ocupadas: <span class="text-red-400 font-bold">0</span></p>
                        <p>• Check-ins: <span class="text-blue-400 font-bold">0</span></p>
                    </div>
                    <div class="bg-white/10 p-6 rounded-lg">
                        <h4 class="text-lg font-bold mb-3">🔧 Acciones</h4>
                        <button onclick="loadTables()" class="block w-full mb-2 bg-blue-500 text-white py-2 rounded">
                            Ver Todas las Mesas
                        </button>
                        <button class="block w-full bg-green-500 text-white py-2 rounded">
                            Exportar Datos
                        </button>
                    </div>
                </div>
            `
        }
    };
    
    const selected = sections[section];
    if (selected) {
        content.innerHTML = `
            <h3 class="text-xl font-bold mb-6">${selected.title}</h3>
            ${selected.content}
        `;
        
        // Cargar datos dinámicos
        if (section === 'tables') {
            loadTables();
        }
    }
}

// 📝 MANEJO DE FORMULARIOS
function handleReservation(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Validación básica
    if (!data.nombre || !data.contacto || !data.fecha || !data.hora || !data.personas) {
        showError('Todos los campos son obligatorios');
        return;
    }
    
    createReservation(data);
}

// 🚀 INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('BarReservas initialized with Supabase');
    console.log('✅ Supabase connected:', SUPABASE_URL);
});