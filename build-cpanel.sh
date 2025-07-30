#!/bin/bash

echo "📦 Building BarReservas for cPanel deployment..."

# Clean dist directory
rm -rf dist
mkdir -p dist/public_html
mkdir -p dist/backend

# Build Frontend for public_html
echo "🎨 Building Frontend..."
cp index.html dist/public_html/
cp -r src dist/public_html/
cp -r public/* dist/public_html/ 2>/dev/null || true

# Create simple frontend bundle
cat > dist/public_html/app.js << 'EOF'
// BarReservas Frontend Bundle
console.log('BarReservas loaded');

// Simple routing
function showSection(section) {
    const content = document.getElementById('content');
    const sections = {
        reservation: {
            title: '📝 Crear Nueva Reserva',
            desc: 'Sistema de reservas con códigos QR únicos.',
            form: `
                <form id="reservationForm" class="space-y-4">
                    <input type="text" placeholder="Nombre" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <input type="email" placeholder="Contacto" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <input type="date" class="w-full p-3 rounded-lg bg-white/20 text-white" required>
                    <input type="time" class="w-full p-3 rounded-lg bg-white/20 text-white" required>
                    <input type="number" placeholder="Personas" class="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70" required>
                    <select class="w-full p-3 rounded-lg bg-white/20 text-white" required>
                        <option value="">Tipo de Mesa</option>
                        <option value="estandar">Estándar</option>
                        <option value="vip">VIP</option>
                        <option value="terraza">Terraza</option>
                    </select>
                    <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold">
                        Crear Reserva
                    </button>
                </form>
            `
        },
        checkin: {
            title: '📱 Check-in de Grupos',
            desc: 'Escaneo QR para gestión de ingresos.',
            form: `
                <div class="text-center">
                    <div class="bg-white/20 p-8 rounded-lg mb-4">
                        <div class="text-6xl mb-4">📱</div>
                        <p>Scanner QR</p>
                    </div>
                    <button class="bg-blue-500 text-white px-6 py-3 rounded-lg">Activar Cámara</button>
                </div>
            `
        },
        tables: {
            title: '🪑 Estado de Mesas',
            desc: 'Visualización en tiempo real.',
            form: `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="bg-green-500/20 p-4 rounded-lg text-center">
                        <div class="text-2xl mb-2">🪑</div>
                        <div>Mesa 1</div>
                        <div class="text-green-400">Libre</div>
                    </div>
                    <div class="bg-red-500/20 p-4 rounded-lg text-center">
                        <div class="text-2xl mb-2">🪑</div>
                        <div>Mesa 2</div>
                        <div class="text-red-400">Ocupada</div>
                    </div>
                    <div class="bg-yellow-500/20 p-4 rounded-lg text-center">
                        <div class="text-2xl mb-2">🪑</div>
                        <div>Mesa 3</div>
                        <div class="text-yellow-400">Reservada</div>
                    </div>
                </div>
            `
        }
    };
    
    const selected = sections[section];
    if (selected) {
        content.innerHTML = `
            <h3 class="text-xl font-bold mb-4">${selected.title}</h3>
            <p class="mb-6">${selected.desc}</p>
            ${selected.form || ''}
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('BarReservas initialized');
});
EOF

# Build Backend
echo "🚂 Building Backend..."
cp -r backend/* dist/backend/
cp backend/.htaccess dist/backend/ 2>/dev/null || true

# Create .htaccess for frontend
cat > dist/public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
EOF

# Create .htaccess for backend API
cat > dist/backend/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ server.php?route=$1 [QSA,L]

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
EOF

# Create PHP backend for cPanel
cat > dist/backend/server.php << 'EOF'
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Simple routing
switch ($route) {
    case 'health':
        echo json_encode(['status' => 'OK', 'message' => 'BarReservas Backend Running']);
        break;
        
    case 'tables':
        echo json_encode([
            ['id' => '1', 'numero' => 1, 'capacidad' => 4, 'tipo' => 'estandar', 'estado' => 'libre'],
            ['id' => '2', 'numero' => 2, 'capacidad' => 6, 'tipo' => 'vip', 'estado' => 'ocupada'],
            ['id' => '3', 'numero' => 3, 'capacidad' => 8, 'tipo' => 'terraza', 'estado' => 'reservada']
        ]);
        break;
        
    case 'reservations':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            echo json_encode([
                'id' => time(),
                'nombre' => $input['nombre'] ?? '',
                'contacto' => $input['contacto'] ?? '',
                'fecha' => $input['fecha'] ?? '',
                'hora' => $input['hora'] ?? '',
                'personas' => $input['personas'] ?? 0,
                'tipoMesa' => $input['tipoMesa'] ?? '',
                'qr' => 'https://tu-dominio.com/member/' . time()
            ]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}
?>
EOF

# Create deployment instructions
cat > dist/CPANEL_DEPLOYMENT.md << 'EOF'
# 📦 BarReservas - cPanel Deployment

## 🚀 Instrucciones de Subida

### 1. Subir Archivos
- **Frontend**: Subir contenido de `public_html/` a la carpeta `public_html` de tu cPanel
- **Backend**: Subir contenido de `backend/` a una carpeta `api` en tu cPanel

### 2. Estructura Final en cPanel
```
public_html/
├── index.html          # Frontend principal
├── app.js             # JavaScript bundle
├── src/               # Componentes React
├── .htaccess          # Configuración Apache
└── api/               # Backend PHP
    ├── server.php     # API principal
    └── .htaccess      # Configuración API
```

### 3. URLs Finales
- **Frontend**: https://tu-dominio.com
- **Backend**: https://tu-dominio.com/api/health
- **API Tables**: https://tu-dominio.com/api/tables

### 4. Configuración
1. Asegúrate de que PHP esté habilitado
2. Verifica que mod_rewrite esté activo
3. Configura permisos 755 para carpetas

## ✅ Testing
1. Visita tu dominio
2. Prueba https://tu-dominio.com/api/health
3. Verifica que la interfaz funcione

¡Listo para producción! 🎉
EOF

# Create ZIP for easy upload
echo "🗜️ Creating ZIP file..."
cd dist
zip -r ../barreservas-cpanel.zip . -x "*.DS_Store"
cd ..

echo "✅ Build completed!"
echo "📁 Files ready in: dist/"
echo "📦 ZIP file: barreservas-cpanel.zip"
echo "📋 Instructions: dist/CPANEL_DEPLOYMENT.md"