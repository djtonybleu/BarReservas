# BarReservas - Sistema de Reservas y Check-in

Un sistema completo de reservas y check-in para grupos en bares, desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Características

### Funcionalidades Principales

- **Formulario de Reserva**: Los organizadores pueden crear reservas con información detallada
- **Generación de QR**: Cada reserva genera un código QR único para los miembros
- **Check-in Host**: Los hosts pueden escanear códigos QR y gestionar el ingreso
- **Registro de Miembros**: Los miembros se registran escaneando el QR del grupo
- **Mapa de Mesas**: Visualización del estado de todas las mesas del bar
- **Diseño Responsivo**: Optimizado para dispositivos móviles y escritorio

### Tecnologías Utilizadas

- **React 18** con TypeScript
- **React Router** para navegación
- **Tailwind CSS** para estilos
- **Axios** para llamadas a la API
- **qrcode.react** para generación de códigos QR
- **html5-qrcode** para escaneo de códigos QR
- **Lucide React** para iconos

## 📦 Instalación

1. Clona el repositorio o descarga los archivos
2. Instala las dependencias:

```bash
npm install
```

3. Configura la URL de tu backend:
   - Edita `src/contexts/APIContext.tsx`
   - Cambia `API_BASE_URL` por la URL de tu backend
   - O configura la variable de entorno `REACT_APP_API_URL`

4. Ejecuta el proyecto:

```bash
npm run dev
```

## 🔧 Configuración del Backend

El frontend espera que tu backend tenga los siguientes endpoints:

### Reservas
- `POST /reserva` - Crear una nueva reserva
- `GET /grupo/:id` - Obtener información de un grupo

### Miembros
- `POST /grupo/:id/miembro` - Registrar un miembro en el grupo
- `PATCH /grupo/:id/miembro/:memberId` - Actualizar estado de un miembro

### Mesas
- `GET /mesas` - Obtener estado de todas las mesas

### Estructura de Datos Esperada

#### Reserva (POST /reserva)
```json
{
  "nombre": "string",
  "contacto": "string",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "personas": "number",
  "tipoMesa": "estandar|vip|terraza",
  "observaciones": "string?"
}
```

#### Respuesta de Reserva
```json
{
  "id": "string",
  "nombre": "string",
  "contacto": "string",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "personas": "number",
  "tipoMesa": "string",
  "observaciones": "string?",
  "qr": "string"
}
```

#### Grupo (GET /grupo/:id)
```json
{
  "id": "string",
  "nombre": "string",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "personas": "number",
  "tipoMesa": "string",
  "observaciones": "string?",
  "miembros": [
    {
      "id": "string",
      "genero": "string",
      "instagram": "string?",
      "estado": "registrado|ingresado"
    }
  ]
}
```

#### Miembro (POST /grupo/:id/miembro)
```json
{
  "genero": "masculino|femenino|otro|prefiero-no-decir",
  "instagram": "string?"
}
```

#### Mesas (GET /mesas)
```json
[
  {
    "id": "string",
    "numero": "number",
    "capacidad": "number",
    "tipo": "estandar|vip|terraza",
    "estado": "libre|ocupada|reservada",
    "grupoId": "string?",
    "grupoNombre": "string?"
  }
]
```

## 🎨 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal con navegación
│   ├── ReservationForm.tsx  # Formulario de reserva
│   ├── QRDisplay.tsx   # Mostrar código QR generado
│   ├── QRScanner.tsx   # Escáner de códigos QR
│   ├── GroupPanel.tsx  # Panel de gestión de grupos
│   ├── MemberForm.tsx  # Formulario de registro de miembros
│   └── TableMap.tsx    # Mapa visual de mesas
├── contexts/           # Contextos de React
│   └── APIContext.tsx  # Contexto para llamadas a la API
├── pages/              # Páginas principales
│   ├── Home.tsx        # Página de inicio
│   ├── Reservation.tsx # Página de reservas
│   ├── CheckIn.tsx     # Página de check-in
│   ├── Member.tsx      # Página de registro de miembros
│   └── Tables.tsx      # Página de mesas
├── App.tsx             # Componente principal
└── main.tsx           # Punto de entrada
```

## 🔄 Flujo de Trabajo

1. **Creación de Reserva**:
   - El organizador completa el formulario de reserva
   - Se genera un código QR único
   - El organizador comparte el QR con los miembros

2. **Registro de Miembros**:
   - Los miembros escanean el QR (o acceden al link)
   - Completan un formulario simple (género, Instagram opcional)
   - Se registran al grupo automáticamente

3. **Check-in**:
   - El host del bar escanea el código QR del grupo
   - Ve la lista de todos los miembros registrados
   - Marca el ingreso de cada persona individualmente

4. **Gestión de Mesas**:
   - Visualización en tiempo real del estado de las mesas
   - Diferentes tipos de mesa (estándar, VIP, terraza)
   - Estados: libre, ocupada, reservada

## 📱 Características de Diseño

- **Responsivo**: Funciona perfectamente en móviles y escritorio
- **Glassmorphism**: Efectos de cristal y transparencia
- **Gradientes**: Colores atractivos con transiciones suaves
- **Micro-interacciones**: Animaciones sutiles para mejor UX
- **Iconografía**: Iconos consistentes de Lucide React
- **Navegación**: Barra superior para desktop, tabs inferiores para móvil

## 🎯 Casos de Uso

### Para Organizadores
- Crear reservas rápidamente
- Compartir código QR con el grupo
- Gestionar información de la reserva

### Para Miembros
- Registrarse fácilmente escaneando QR
- Proporcionar información básica
- Confirmación automática de registro

### Para Hosts/Staff
- Escanear códigos QR de grupos
- Gestionar check-in individual
- Ver estadísticas de ingreso
- Monitorear estado de mesas

## 🚀 Deployment

Para construir el proyecto para producción:

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/` y pueden ser desplegados en cualquier servidor web estático.

## 📄 Licencia

Este proyecto es de código abierto. Puedes modificarlo y adaptarlo según tus necesidades.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encuentras algún bug o tienes ideas para mejorar el sistema, no dudes en crear un issue o pull request.

## 📞 Soporte

Para soporte técnico o consultas sobre implementación, revisa la documentación del código o contacta al equipo de desarrollo.

## Documentación Técnica

### Flujo de Usuario
1. **Reserva:**
   - El organizador completa el formulario de reserva.
   - Se genera un QR único y se asigna una mesa automáticamente.
   - El QR se comparte con los miembros del grupo.
2. **Check-in:**
   - El host escanea el QR y visualiza el grupo.
   - Marca el ingreso de cada miembro.
   - Cada miembro puede escanear el QR y completar su perfil.
3. **Consumo y Métricas:**
   - El consumo se registra por grupo/mesa.
   - El panel admin muestra métricas en tiempo real.
4. **Campañas:**
   - El sistema puede enviar notificaciones por Instagram o email a clientes segmentados.

### Endpoints Esperados (Backend)

#### Reservas y Grupos
- `POST /reserva` — Crear nueva reserva
- `GET /grupo/:id` — Obtener datos de grupo/reserva
- `POST /grupo/:id/asignar-mesa` — Asignar mesa automáticamente
- `POST /grupo/:id/miembro` — Registrar miembro en grupo
- `PATCH /grupo/:id/miembro/:memberId` — Actualizar estado de miembro (check-in)

#### Mesas
- `GET /mesas` — Listar todas las mesas y su estado

#### Métricas
- `GET /metrics` — Obtener métricas agregadas para panel admin

#### Campañas y Notificaciones
- `POST /instagram/send` — Enviar mensaje por Instagram (requiere integración)
- `POST /email/send` — Enviar email a cliente (requiere integración)

### Notas
- Todos los endpoints esperan y devuelven JSON.
- El sistema está preparado para integración con BI y campañas automatizadas.