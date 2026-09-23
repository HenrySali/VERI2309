# Documentación de Imágenes - VERI2309

## 📸 Sistema de Imágenes Implementado

Sí, las imágenes **están completamente mencionadas e implementadas** en el proyecto.

---

## Almacenamiento

### Base de Datos IndexedDB
- **Nombre BD:** `EquiposImageDB`
- **Versión:** 2
- **Store de imágenes:** `images`
- **Store de Excel:** `excelData`

**Archivo:** `app.js` (línea 2-26)

```javascript
let imageDB = null;
const DB_NAME = 'EquiposImageDB';
const DB_VERSION = 2;
const STORE_NAME = 'images';
const EXCEL_STORE = 'excelData';
```

---

## Funciones de Imagen

### 1. Inicialización de BD
**Función:** `initImageDB()` (línea 9)
- Abre conexión con IndexedDB
- Crea object stores si no existen
- Maneja versionado de BD

### 2. Guardar Imagen
**Función:** `saveImageToDB(id, dataUrl)` (línea 142)

**Características:**
- Comprime imagen antes de guardar (40% calidad JPEG)
- Almacena con ID único
- Maneja errores de transacción

**Ubicación en código:** `app.js` línea 142-170

```javascript
async function saveImageToDB(id, dataUrl) {
    if (!imageDB) {
        await initImageDB();
    }
    // Comprimir antes de guardar
    const compressed = await compressImage(dataUrl);
    
    // Guardar en IndexedDB con transacción
}
```

### 3. Obtener Imagen Individual
**Función:** `getImageFromDB(id)` (línea 173)
- Obtiene imagen específica por ID
- Retorna null si no existe
- Manejo de errores silencioso

### 4. Obtener Todas las Imágenes
**Función:** `getAllImagesFromDB()` (línea 183)
- Obtiene todas las imágenes almacenadas
- Retorna array vacío si no hay imágenes
- Útil para backup/exportación

### 5. Comprimir Imagen
**Función:** `compressImage(dataUrl)` (línea 107)
- Reduce tamaño: JPEG con calidad 0.4 (40%)
- Convierte a canvas
- Exporta como URL de datos

---

## Importación y Exportación

### Exportar Imágenes
**Elementos HTML:**
- ID: `exportImagesBtn` (línea 299)
- Botón: "⬇️ Exportar Imágenes"

**Funcionalidad:**
- Obtiene todas las imágenes de IndexedDB
- Crea ZIP con imágenes
- Descarga con nombre: `backup_imagenes_YYYY-MM-DD.zip`
- Muestra contador de imágenes exportadas

**Ubicación:** `app.js` línea 310-351

### Importar Imágenes
**Elementos HTML:**
- Input: `importImagesInput` (línea 300)
- Botón: "⬆️ Importar Imágenes" (línea 908)
- Acepta: `.zip`

**Funcionalidad:**
- Lee archivo ZIP
- Extrae imágenes
- Importa a IndexedDB
- Validación de formato

---

## Captura de Imágenes en Registro

### Modal de Registro (Línea ~815)
```html
<!-- Captura de imagen -->
<div class="input-group">
    <label>📷 Foto del Equipo</label>
    <div id="cameraContainer" class="hidden">
        <video id="cameraVideo" autoplay playsinline></video>
    </div>
    <img id="capturedImage" class="hidden">
    <div id="cameraButtons">
        <button id="startCameraBtn">📷 Abrir Cámara</button>
        <button id="capturePhotoBtn">📸 Capturar</button>
        <button id="retakePhotoBtn">🔄 Otra Foto</button>
        <button id="deletPhotoBtn">🗑️ Eliminar</button>
    </div>
</div>
```

### Funciones de Cámara
- **startCameraBtn:** Abre cámara para captura
- **capturePhotoBtn:** Captura foto actual
- **retakePhotoBtn:** Toma otra foto
- **deletPhotoBtn:** Elimina foto capturada

---

## Galería de Imágenes en Edición

### Panel de Edición (Después de escanear)
- **ID:** `editImagesGallery` (línea ~973)
- Muestra imágenes del equipo
- Permite agregar nuevas fotos
- Muestra mensaje "Sin imágenes registradas" si vacío

**Funciones:**
- `loadImagesForRow(row)` - Carga imágenes de un equipo
- `loadObservacionesForRow(row)` - Carga observaciones asociadas
- Visualización en miniatura con click para ver grande

### Visor de Imagen Completa
**Elementos:**
- Modal overlay: `imageViewerModal` (línea 846)
- Fondo oscuro (95% opacidad)
- Click cierra visor

---

## Integración con Equipos

### Relación Imagen-Equipo
```
Equipo (ID) → Imágenes (múltiples)
             ↓
        IndexedDB STORE_NAME: 'images'
        con ID: `${equipoId}_${timestamp}`
```

### Cuando se Escanea QR
1. Se obtiene ID del equipo
2. Se cargan todas sus imágenes
3. Se muestran en galería del panel de edición
4. Permitir agregar nuevas fotos

### Cuando se Registra Nuevo Equipo
1. Se captura foto opcional
2. Se genera ID único
3. Se guarda en IndexedDB
4. Se descarga automáticamente

---

## Flujo Completo de Imágenes

### 1. Captura
```
Usuario abre cámara → Captura foto → Foto en memoria
```

### 2. Almacenamiento
```
Foto → Compresión → IndexedDB (STORE_NAME: 'images')
```

### 3. Visualización
```
Galería → Clic en thumbnail → Visor completo
```

### 4. Gestión
```
Exportar (ZIP) ← → Importar (ZIP)
   ↓
Backup local
```

---

## Archivos Relacionados

- **app.js** - Lógica completa de imágenes (líneas 1-350+)
- **index.html** - UI de captura y galería (líneas 815, 846, 903-908)
- **estaciones-agua.js** - Imágenes para estaciones de agua (línea 154-199)

---

## Localización de Código

### En app.js:

| Función | Línea | Propósito |
|---------|-------|----------|
| initImageDB | 9 | Inicializar IndexedDB |
| compressImage | 107 | Comprimir imagen |
| saveImageToDB | 142 | Guardar en BD |
| getImageFromDB | 173 | Obtener una imagen |
| getAllImagesFromDB | 183 | Obtener todas |
| exportImagesBtn.addEventListener | 310 | Exportar ZIP |
| importImagesInput.addEventListener | 347 | Importar ZIP |

### En index.html:

| Elemento | Línea | Propósito |
|----------|-------|----------|
| Captura de imagen | 815 | Modal de registro |
| imageViewerModal | 846 | Visor completo |
| exportImagesBtn | 903 | Botón exportar |
| importImagesInput | 908 | Input importar |

---

## Estado Actual

✅ **Sistema de imágenes completamente implementado y funcional:**
- Almacenamiento en IndexedDB
- Captura desde cámara
- Compresión automática
- Exportación a ZIP
- Importación desde ZIP
- Galería con visor
- Integración con equipos

---

## Volumen de Almacenamiento

- **IndexedDB Límite típico:** 50MB por origen (navegador dependiente)
- **Compresión aplicada:** 40% de calidad JPEG
- **Tamaño aproximado por foto:** 20-50KB (comprimida)
- **Capacidad estimada:** 1,000-2,500 fotos por origen

---

## Mejoras Futuras (Opcionales)

- [ ] OCR en imágenes para extraer números de serie
- [ ] Sincronización con servidor
- [ ] Versionado de imágenes (historial de cambios)
- [ ] Anotaciones en imágenes
- [ ] Galería avanzada con filtros
- [ ] Compresión adaptativa según conexión
