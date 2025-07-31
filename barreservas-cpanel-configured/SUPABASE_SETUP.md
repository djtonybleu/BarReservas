# 🗃️ BarReservas - Configuración Supabase

## 🚀 Setup Rápido

### 1. Crear Proyecto Supabase
1. Ve a https://supabase.com
2. Crea una cuenta gratuita
3. Click "New Project"
4. Nombre: `BarReservas`
5. Contraseña de DB: (guarda esta contraseña)

### 2. Obtener Credenciales
En tu dashboard de Supabase:
- **Project URL**: `https://tu-proyecto.supabase.co`
- **Anon Key**: `eyJ...` (clave pública)

### 3. Configurar app.js
Edita `public_html/app.js` líneas 4-5:
```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

### 4. Crear Tablas
En Supabase → SQL Editor, ejecuta:

```sql
-- Tabla de mesas
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('standard', 'vip', 'terrace')),
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de grupos
CREATE TABLE groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    organizer_contact TEXT NOT NULL,
    organizer_contact_type TEXT DEFAULT 'whatsapp',
    reservation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de miembros
CREATE TABLE members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id),
    gender TEXT,
    instagram TEXT,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar mesas de ejemplo
INSERT INTO tables (number, capacity, type, status) VALUES
(1, 4, 'standard', 'free'),
(2, 6, 'standard', 'occupied'),
(3, 8, 'vip', 'reserved'),
(4, 4, 'standard', 'free'),
(5, 10, 'terrace', 'free'),
(6, 6, 'vip', 'free');
```

### 5. Configurar RLS (Row Level Security)
```sql
-- Habilitar RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (para demo)
CREATE POLICY "Allow all operations" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON members FOR ALL USING (true);
```

## ✅ Verificación

### Test de Conexión
1. Sube los archivos a cPanel
2. Visita tu dominio
3. Si ves el error de configuración, edita `app.js`
4. Recarga la página

### Test de Funcionalidad
1. Click "Nueva Reserva"
2. Llena el formulario
3. Debería crear la reserva en Supabase
4. Click "Ver Mesas" para ver las mesas

## 🔧 Troubleshooting

### Error: "Failed to fetch"
- Verifica que SUPABASE_URL y SUPABASE_ANON_KEY estén correctos
- Revisa que las tablas existan en Supabase

### Error: "relation does not exist"
- Ejecuta las queries SQL para crear las tablas
- Verifica que los nombres de tabla coincidan

### Error de CORS
- Supabase maneja CORS automáticamente
- Verifica que la URL sea correcta

## 📊 Dashboard Supabase

En tu proyecto Supabase puedes:
- **Table Editor**: Ver/editar datos
- **SQL Editor**: Ejecutar queries
- **API Docs**: Ver endpoints generados
- **Logs**: Ver actividad en tiempo real

## 🎉 ¡Listo!

Tu sistema BarReservas ahora está conectado a Supabase y funcionando completamente.

**URLs importantes:**
- **App**: https://tu-dominio.com
- **Supabase**: https://tu-proyecto.supabase.co
- **Dashboard**: https://app.supabase.com/project/tu-proyecto