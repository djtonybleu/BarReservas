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
