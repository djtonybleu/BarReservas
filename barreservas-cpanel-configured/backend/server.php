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
