# 📸 FLUJO DE IMÁGENES - VERI2309

## 🎯 Resumen del Flujo de Imágenes

```
CAPTURA → COMPRESIÓN → ALMACENAMIENTO → VISUALIZACIÓN → EXPORTACIÓN → IMPORTACIÓN
```

---

## 1️⃣ CAPTURA DE IMAGEN

### 1.1 Usuario Hace Clic en "📷 Abrir Cámara"

**Ubicación en HTML:** `index.html` línea ~825
```html
<button type="button" id="startCameraBtn" class="btn btn-secondary">
    📷 Abrir Cámara
</button>
```

**En `app.js` línea ~1370:**
```javascript
startCameraBtn.addEventListener('click', async () => {
    // Solicitar acceso a la cámara del dispositivo
    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { 
            facingMode: 'environment'  // Cámara trasera (no selfie)
        }
    });
    
    // Mostrar video en tiempo real
    cameraVideo.srcObject = cameraStream;
    cameraContainer.classList.remove('hidden');
    
    // Cambiar botones visibles
    capturePhotoBtn.classList.remove('hidden');  // Mostrar "Capturar"
    retakePhotoBtn.classList.remove('hidden');   // Mostrar "Otra Foto"
    startCameraBtn.classList.add('hidden');      // Ocultar "Abrir Cámara"
});
```

**UI en pantalla:**
```
┌──────────────────────────────┐
│   VISTA EN VIVO DE CÁMARA     │
│                              │
│   (Video del dispositivo)     │
│                              │
│   [📸 Capturar]  [🔄 Otra]   │
└──────────────────────────────┘
```

**Variables:**
- `cameraStream` - Stream de video activo
- `cameraVideo` - Elemento HTML `<video>`

---

### 1.2 Usuario Hace Clic en "📸 Capturar"

**En `app.js` línea ~1400:**
```javascript
capturePhotoBtn.addEventListener('click', () => {
    // Crear canvas con dimensiones del video
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;    // Ancho real del video
    canvas.height = cameraVideo.videoHeight;  // Alto real del video
    
    // Dibujar frame actual del video en el canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0);
    
    // Convertir canvas a imagen JPEG base64
    capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
    // Resultado: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
    
    // Mostrar imagen capturada
    capturedImage.src = capturedImageData;
    capturedImage.classList.remove('hidden');
    
    // Ocultar video, mostrar imagen
    cameraVideo.classList.add('hidden');
    cameraContainer.classList.add('hidden');
    
    // Cambiar botones
    capturePhotoBtn.classList.add('hidden');
    retakePhotoBtn.classList.remove('hidden');
    deletePhotoBtn.classList.remove('hidden');
});
```

**Qué sucede:**
1. Lee frame actual de la cámara
2. Dibuja en canvas HTML5
3. Convierte a datos base64 (formato texto)
4. Guarda en variable `capturedImageData`

**Variable Global:**
```javascript
let capturedImageData = null;  // Contiene: "data:image/jpeg;base64,..."
```

**UI actualizada:**
```
┌──────────────────────────────┐
│   IMAGEN CAPTURADA           │
│                              │
│   [Foto de 1024x768]         │
│                              │
│   [🔄 Otra Foto]  [🗑️ Borrar]│
└──────────────────────────────┘
```

---

### 1.3 Opciones del Usuario

#### Opción A: Tomar Otra Foto
**En `app.js` línea ~1420:**
```javascript
retakePhotoBtn.addEventListener('click', () => {
    // Limpiar imagen anterior
    capturedImageData = null;
    capturedImage.classList.add('hidden');
    
    // Volver a abrir cámara
    cameraVideo.classList.remove('hidden');
    cameraContainer.classList.remove('hidden');
    
    // Resetear botones
    capturePhotoBtn.classList.remove('hidden');
    retakePhotoBtn.classList.add('hidden');
    deletePhotoBtn.classList.add('hidden');
    
    // Cámara sigue transmitiendo
});
```

#### Opción B: Borrar Foto
**En `app.js` línea ~1435:**
```javascript
deletePhotoBtn.addEventListener('click', () => {
    // Limpiar imagen
    capturedImageData = null;
    capturedImage.classList.add('hidden');
    
    // Cerrar cámara
    stopCamera();
    cameraContainer.classList.add('hidden');
    
    // Resetear botones
    capturePhotoBtn.classList.add('hidden');
    retakePhotoBtn.classList.add('hidden');
    deletePhotoBtn.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
});

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}
```

#### Opción C: Guardar Foto (Implícito)
- Usuario hace clic en "Guardar" (confirmRegBtn)
- Foto se procesa (ver paso 2)

---

## 2️⃣ COMPRESIÓN DE IMAGEN

### 2.1 Comprimir Antes de Guardar

**En `app.js` línea ~107:**
```javascript
async function compressImage(dataUrl) {
    // dataUrl = "data:image/jpeg;base64,/9j/4AAQSk..."
    
    // Crear elemento Image para cargar
    const img = new Image();
    img.src = dataUrl;
    
    return new Promise((resolve) => {
        img.onload = () => {
            // Crear canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Dibujar imagen en canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Exportar con calidad reducida (40%)
            const compressed = canvas.toDataURL('image/jpeg', 0.4);
            // Resultado más pequeño
            
            resolve(compressed);
        };
    });
}
```

**Ejemplo de Compresión:**

```
ANTES:
"data:image/jpeg;base64,/9j/4AAQSkZJRgABA...AAAA..." (500 KB)

DESPUÉS (40% calidad):
"data:image/jpeg;base64,/9j/4AAQSkZJRgABA...BBB..." (50 KB)

Reducción: 90% del tamaño original
```

**Por qué comprimir:**
- IndexedDB tiene límite de almacenamiento (~50MB por origen)
- Fotos sin comprimir: ~2-5MB cada una
- Fotos comprimidas: ~20-50KB cada una
- Capacidad: 1,000+ fotos en lugar de 10-20

---

## 3️⃣ ALMACENAMIENTO EN IndexedDB

### 3.1 Guardar Imagen en BD

**En `app.js` línea ~142:**
```javascript
async function saveImageToDB(id, dataUrl) {
    // id = "NEW_1695398400000_0"
    // dataUrl = "data:image/jpeg;base64,..."
    
    // Inicializar BD si no existe
    if (!imageDB) {
        await initImageDB();
    }
    
    // Comprimir imagen
    const compressed = await compressImage(dataUrl);
    
    // Guardar en IndexedDB
    return new Promise((resolve, reject) => {
        try {
            // Crear transacción de lectura-escritura
            const tx = imageDB.transaction(STORE_NAME, 'readwrite');
            
            // Acceder a object store 'images'
            const store = tx.objectStore(STORE_NAME);
            
            // Insertar o actualizar
            const request = store.put({
                id: id,                    // Clave única
                dataUrl: compressed        // Datos comprimidos
            });
            
            // Éxito
            request.onsuccess = () => resolve();
            
            // Error
            request.onerror = (e) => {
                console.error('Error guardando en IndexedDB:', e);
                reject(e.target.error);
            };
            
            tx.onerror = (e) => {
                console.error('Error transacción:', e);
                reject(tx.error);
            };
        } catch (err) {
            console.error('Error general:', err);
            reject(err);
        }
    });
}
```

**Estructura de BD:**

```
EquiposImageDB (Base de Datos)
│
├── STORE_NAME: 'images' (Object Store)
│   │
│   ├── Objeto 1:
│   │   {
│   │     id: "AGI-24239_1695398400000",
│   │     dataUrl: "data:image/jpeg;base64,..."  (comprimida)
│   │   }
│   │
│   ├── Objeto 2:
│   │   {
│   │     id: "AGI-24240_1695398410000",
│   │     dataUrl: "data:image/jpeg;base64,..."
│   │   }
│   │
│   └── Objeto N:
│       {
│         id: "NEW_1695398400000_0",
│         dataUrl: "data:image/jpeg;base64,..."
│       }
│
└── EXCEL_STORE: 'excelData' (Otro Store - ver CAMBIOS.md)
```

### 3.2 Cuándo se Guarda la Imagen

#### Escenario A: Al Registrar Nuevo Equipo

**En `app.js` línea ~1449:**
```javascript
confirmRegBtn.addEventListener('click', () => {
    const serieVal = regSerieInput.value.trim().toUpperCase();
    const locVal = regLocationSelect.value;
    const obsVal = regObservaciones.value.trim();
    
    // ... validación ...
    
    // Crear nuevo registro
    const newRow = {
        [idKey]: `NEW_${Date.now()}`,
        [serieKey]: serieVal,
        [locKey]: locVal,
        [obsKey]: obsVal,
        'Verificado': '✅'
    };
    
    // 🔴 GUARDAR IMAGEN SI EXISTE
    if (capturedImageData) {
        const imgId = `${newRow[idKey]}_${Date.now()}`;
        
        // Guardar en IndexedDB
        saveImageToDB(imgId, capturedImageData)
            .then(() => {
                console.log('✅ Imagen guardada:', imgId);
            })
            .catch(err => {
                console.error('❌ Error guardando imagen:', err);
            });
    }
    
    // Agregar fila a datos
    globalDataRaw.push(newRow);
    
    // Guardar Excel en IndexedDB
    saveExcelToDB();
    
    // Feedback
    regFeedback.textContent = `✅ Serie "${serieVal}" registrada` + 
        (capturedImageData ? ' (imagen descargada)' : '');
    
    // Cerrar modal después de 1.5 segundos
    setTimeout(() => {
        registerModal.classList.add('hidden');
    }, 1500);
});
```

#### Escenario B: Al Agregar Foto a Equipo Existente

**En `app.js` línea ~1300 (addImageBtn):**
```javascript
addImageBtn.addEventListener('click', async () => {
    // Abre cámara en modo edición
    // Usuario captura foto
    
    // Al guardar (updateBtn):
    if (capturedImageData && currentMatchIndex !== -1) {
        const equipoId = globalDataRaw[currentMatchIndex]['ID'];
        const imgId = `${equipoId}_${Date.now()}`;
        
        // Guardar imagen
        await saveImageToDB(imgId, capturedImageData);
    }
});
```

---

## 4️⃣ VISUALIZACIÓN DE IMÁGENES

### 4.1 Cargar Imágenes de un Equipo

**En `app.js` línea ~850:**
```javascript
async function loadImagesForRow(row) {
    // row = { ID: "AGI-24239", Serie: "SN123", ... }
    
    const equipoId = row[globalHeaders[0]];  // ID del equipo
    
    // Obtener todas las imágenes
    const allImages = await getAllImagesFromDB();
    
    // Filtrar las del equipo actual
    const equipoImages = allImages.filter(img => 
        img.id.startsWith(equipoId)
    );
    
    // Limpiar galería
    editImagesGallery.innerHTML = '';
    
    if (equipoImages.length === 0) {
        // Mostrar mensaje
        noImageMsg.classList.remove('hidden');
    } else {
        noImageMsg.classList.add('hidden');
        
        // Mostrar cada imagen como thumbnail
        equipoImages.forEach((img, idx) => {
            const imgEl = document.createElement('img');
            imgEl.src = img.dataUrl;  // Base64 comprimida
            imgEl.style.cssText = `
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 8px;
                cursor: pointer;
                border: 2px solid #00d9ff;
            `;
            
            // Click en thumbnail → ver imagen grande
            imgEl.addEventListener('click', () => {
                showImageViewer(img.dataUrl);
            });
            
            editImagesGallery.appendChild(imgEl);
        });
    }
}
```

**Resultado en pantalla:**
```
📷 Fotos del Equipo:
┌─────────┬─────────┬─────────┬─────────┐
│[Foto 1] │[Foto 2] │[Foto 3] │[+Agreg] │
└─────────┴─────────┴─────────┴─────────┘
(80x80px cada thumbnail)
```

### 4.2 Ver Imagen a Pantalla Completa

**En `app.js` línea ~1320:**
```javascript
function showImageViewer(dataUrl) {
    // Mostrar modal
    imageViewerModal.classList.remove('hidden');
    
    // Mostrar imagen en tamaño grande
    fullSizeImage.src = dataUrl;
    
    // Modal ocupa toda la pantalla con fondo oscuro
}

// Click en X para cerrar
closeImageViewer.addEventListener('click', () => {
    imageViewerModal.classList.add('hidden');
});

// Click afuera para cerrar
imageViewerModal.addEventListener('click', (e) => {
    if (e.target === imageViewerModal) {
        imageViewerModal.classList.add('hidden');
    }
});
```

**HTML Modal:**
```html
<div id="imageViewerModal" class="modal-overlay hidden" 
     style="background: rgba(0,0,0,0.95); cursor: zoom-out;">
    <div id="closeImageViewer" 
         style="position: absolute; top: 20px; right: 20px; 
                 font-size: 2.5rem; color: #fff; cursor: pointer;">
        ×
    </div>
    <img id="fullSizeImage" src="" 
         style="max-width: 90vw; max-height: 90vh; 
                 object-fit: contain;">
</div>
```

**Resultado en pantalla:**
```
┌────────────────────────────────────┐
│          ✕ (arriba derecha)        │
│                                    │
│                                    │
│       [IMAGEN A PANTALLA COMPLETA] │
│                                    │
│                                    │
└────────────────────────────────────┘
(Fondo negro 95% opacidad)
```

---

## 5️⃣ EXPORTACIÓN DE IMÁGENES

### 5.1 Usuario Hace Clic en "⬇️ Exportar Imágenes"

**Ubicación en HTML:** `index.html` línea ~903
```html
<button id="exportImagesBtn" class="btn btn-secondary">
    ⬇️ Exportar Imágenes
</button>
```

**En `app.js` línea ~310:**
```javascript
exportImagesBtn.addEventListener('click', async () => {
    try {
        // Mostrar estado
        exportImagesBtn.disabled = true;
        exportImagesBtn.textContent = '⏳ Exportando...';
        
        // 1. Obtener todas las imágenes de IndexedDB
        const images = await getAllImagesFromDB();
        
        // 2. Validar que hay imágenes
        if (images.length === 0) {
            alert("No hay imágenes para exportar");
            exportImagesBtn.disabled = false;
            exportImagesBtn.textContent = '⬇️ Exportar Imágenes';
            return;
        }
        
        // 3. Crear archivo ZIP
        const zip = new JSZip();
        
        images.forEach((img, idx) => {
            // Convertir base64 a blob
            const blobData = atob(img.dataUrl.split(',')[1]);
            const array = new Uint8Array(blobData.length);
            
            for (let i = 0; i < blobData.length; i++) {
                array[i] = blobData.charCodeAt(i);
            }
            
            const blob = new Blob([array], { type: 'image/jpeg' });
            
            // Agregar al ZIP
            zip.file(`imagen_${idx + 1}.jpg`, blob);
        });
        
        // 4. Generar ZIP
        zip.generateAsync({ type: 'blob' }).then(blob => {
            // 5. Crear link de descarga
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Nombre del archivo con fecha
            const fecha = new Date().toISOString().slice(0, 10);
            link.download = `backup_imagenes_${fecha}.zip`;
            
            // 6. Descargar
            link.click();
            
            // Feedback
            showBackupStatus(`✅ ${images.length} imágenes exportadas`);
        });
        
        // Restaurar botón
        exportImagesBtn.disabled = false;
        exportImagesBtn.textContent = '⬇️ Exportar Imágenes';
        
    } catch (err) {
        console.error('Error exportando:', err);
        alert('Error al exportar imágenes');
    }
});
```

**Flujo de Exportación:**

```
getAllImagesFromDB()
    ↓
Obtiene: [
    { id: "AGI-24239_1695398400000", dataUrl: "data:image/jpeg;base64,..." },
    { id: "AGI-24240_1695398410000", dataUrl: "data:image/jpeg;base64,..." },
    { id: "AGI-24241_1695398420000", dataUrl: "data:image/jpeg;base64,..." }
]
    ↓
Crear ZIP
    ├─ imagen_1.jpg (base64 decodificada)
    ├─ imagen_2.jpg
    └─ imagen_3.jpg
    ↓
Generar blob ZIP
    ↓
Crear link descarga
    ↓
Descargar: backup_imagenes_2026-09-23.zip
```

**Resultado:**
```
Archivo descargado: backup_imagenes_2026-09-23.zip
│
├── imagen_1.jpg (comprimida)
├── imagen_2.jpg (comprimida)
└── imagen_3.jpg (comprimida)
```

---

## 6️⃣ IMPORTACIÓN DE IMÁGENES

### 6.1 Usuario Hace Clic en "⬆️ Importar Imágenes"

**Ubicación en HTML:** `index.html` línea ~908
```html
<label class="btn btn-secondary" style="cursor:pointer;">
    ⬆️ Importar Imágenes
    <input type="file" id="importImagesInput" accept=".zip" style="display:none;">
</label>
```

**En `app.js` línea ~347:**
```javascript
importImagesInput.addEventListener('change', async (e) => {
    try {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Mostrar estado
        importImagesInput.disabled = true;
        showBackupStatus('⏳ Importando imágenes...');
        
        // 1. Leer archivo ZIP
        const zip = new JSZip();
        await zip.loadAsync(file);
        
        // 2. Extraer archivos del ZIP
        const fileEntries = Object.keys(zip.files);
        
        let count = 0;
        
        // 3. Procesar cada archivo
        for (const fileName of fileEntries) {
            const zipFile = zip.files[fileName];
            
            // No procesar carpetas
            if (zipFile.dir) continue;
            
            // Extraer blob
            const blob = await zipFile.async('blob');
            
            // Convertir blob a base64
            const reader = new FileReader();
            
            reader.onload = async () => {
                // reader.result = "data:image/jpeg;base64,..."
                
                const id = `imported_${Date.now()}_${count}`;
                
                // Guardar en IndexedDB
                await saveImageToDB(id, reader.result);
                
                count++;
            };
            
            reader.readAsDataURL(blob);
        }
        
        // Feedback
        showBackupStatus(`✅ ${fileEntries.length} imágenes importadas`);
        
        // Limpiar input
        importImagesInput.value = '';
        importImagesInput.disabled = false;
        
    } catch (err) {
        console.error('Error importando:', err);
        showBackupStatus('❌ Error al importar', 'error');
    }
});
```

**Flujo de Importación:**

```
Seleccionar: backup_imagenes_2026-09-23.zip
    ↓
Leer ZIP en memoria
    ↓
Extraer archivos:
├── imagen_1.jpg
├── imagen_2.jpg
└── imagen_3.jpg
    ↓
Para cada archivo:
    ├─ Leer como blob
    ├─ Convertir a base64
    ├─ Guardar en IndexedDB
    └─ count++
    ↓
Resultado: Imágenes recuperadas en IndexedDB
    ↓
Disponibles para visualizar en galería
```

---

## 🔄 DIAGRAMA COMPLETO DEL FLUJO DE IMÁGENES

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAPTURA DE IMAGEN                              │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        [📷 Abrir Cámara]      [Escanear QR]
                │                       │
                ▼                       ▼
        ┌─────────────────┐    Video stream
        │ Video en vivo   │    en tiempo real
        │ (cameraVideo)   │
        └────────┬────────┘
                 │
        [📸 Capturar]
                 │
                 ▼
        ┌─────────────────────────────────┐
        │  1. Canvas dibuja frame         │
        │  2. Convertir a JPEG base64     │
        │  3. Guardar en capturedImageData│
        └────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    [🔄 Otra]      [🗑️ Borrar]
        │                 │
        │                 ▼
        │        capturedImageData = null
        │        Cerrar cámara
        │
        └─────────┬─────────┐
                  │         │
          (Vuelve a capturar)
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │      COMPRESIÓN DE IMAGEN             │
    └──────────────────────────────────────┘
                  │
          compressImage()
                  │
        JPEG 40% de calidad
        Reducción: 90% tamaño
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │   ALMACENAMIENTO EN IndexedDB         │
    └──────────────────────────────────────┘
                  │
        saveImageToDB(id, dataUrl)
                  │
        ┌─────────┴─────────┐
        │                   │
    Nuevo Equipo      Equipo Existente
        │                   │
        │              updateBtn
        │                   │
        ▼                   ▼
    Registrar          Agregar foto
        │                   │
        └─────────┬─────────┘
                  │
        Guardar en IndexedDB
        EquiposImageDB/images
        { id, dataUrl: compressed }
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │     VISUALIZACIÓN DE IMÁGENES         │
    └──────────────────────────────────────┘
                  │
        loadImagesForRow(row)
                  │
        getAllImagesFromDB()
                  │
        Filtrar por equipoId
                  │
        ┌─────────┴──────────┐
        │                    │
    Sin imágenes        Con imágenes
        │                    │
        ▼                    ▼
    "No hay           Mostrar thumbnails
     imágenes"        80x80px con border
                      azul
                             │
                             ▼
                      [Click thumbnail]
                             │
                             ▼
                      showImageViewer()
                             │
                      Modal pantalla completa
                      Fondo negro 95%
                      (Click X para cerrar)
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │     EXPORTACIÓN DE IMÁGENES           │
    └──────────────────────────────────────┘
                  │
        [⬇️ Exportar Imágenes]
                  │
        getAllImagesFromDB()
                  │
        Crear ZIP con JSZip
        ├─ imagen_1.jpg
        ├─ imagen_2.jpg
        └─ imagen_N.jpg
                  │
        Generar blob
                  │
        Descargar:
        backup_imagenes_YYYY-MM-DD.zip
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │     IMPORTACIÓN DE IMÁGENES           │
    └──────────────────────────────────────┘
                  │
        [⬆️ Importar Imágenes]
        Seleccionar .zip
                  │
        Leer ZIP en memoria
                  │
        Extraer archivos
                  │
        Para cada archivo:
        ├─ Leer blob
        ├─ Convertir base64
        └─ saveImageToDB()
                  │
        Restaurar en IndexedDB
                  │
                  ▼
        Imágenes disponibles
        en galería
```

---

## 📊 EJEMPLO PRÁCTICO

### Escenario: Verificar Equipo con Foto

**Paso 1: Escanear QR**
```
QR leído: CENTRIF-30766
Buscar en base de datos
Encontrado: AGI-24239
```

**Paso 2: Cargar Panel Edición**
```javascript
await loadImagesForRow(row);
// row.ID = "AGI-24239"
```

**Paso 3: Mostrar Imágenes Existentes**
```
Buscar en IndexedDB:
├── id: "AGI-24239_1695398400000"
│   └── dataUrl: "data:image/jpeg;base64,..." (50KB comprimida)
├── id: "AGI-24239_1695398410000"
│   └── dataUrl: "data:image/jpeg;base64,..." (45KB comprimida)
└── id: "AGI-24239_1695398420000"
    └── dataUrl: "data:image/jpeg;base64,..." (48KB comprimida)

Total: ~143KB en IndexedDB
Tamaño original: ~1.5MB (sin comprimir)
```

**Paso 4: Mostrar en Galería**
```html
📷 Fotos del Equipo:
┌─────────┬─────────┬─────────┬─────────┐
│[Foto 1] │[Foto 2] │[Foto 3] │[+Agreg] │
└─────────┴─────────┴─────────┴─────────┘
```

**Paso 5: Usuario Hace Clic en Foto**
```
[Modal pantalla completa]
├─ Fondo negro
├─ Imagen grande
└─ Click X para cerrar
```

**Paso 6: Agregar Nueva Foto**
```
[+Agregar] → Abre cámara
Usuario captura
capturedImageData guardada
[Actualizar] → saveImageToDB()
```

**Paso 7: Exportar**
```
[⬇️ Exportar Imágenes]
↓
backup_imagenes_2026-09-23.zip
├── imagen_1.jpg
├── imagen_2.jpg
└── imagen_3.jpg
```

---

## 🗄️ ALMACENAMIENTO RESUMIDO

```
MEMORIA (Variables JavaScript):
└── capturedImageData = "data:image/jpeg;base64,..." (durante captura)

IndexedDB (Persistencia):
└── EquiposImageDB
    └── Store: 'images'
        └── Objeto:
            {
              id: "AGI-24239_1695398400000",
              dataUrl: "data:image/jpeg;base64,..." (comprimida 40%)
            }

LocalStorage (Configuración):
└── fixedLocation = { enabled, value }

Archivos Descargados:
└── backup_imagenes_2026-09-23.zip
    ├── imagen_1.jpg
    ├── imagen_2.jpg
    └── imagen_N.jpg
```

---

## ⚡ RENDIMIENTO

| Operación | Tiempo Aproximado |
|-----------|-------------------|
| Capturar foto | <100ms |
| Comprimir imagen | 50-200ms |
| Guardar en IndexedDB | 100-500ms |
| Cargar galería (3 fotos) | 200-400ms |
| Ver imagen completa | <50ms |
| Exportar 100 imágenes | 2-5 segundos |
| Importar ZIP (100 imágenes) | 5-10 segundos |

---

## 🔒 SEGURIDAD

- **Imágenes en navegador local** - No se envían a servidor
- **IndexedDB** - Base de datos local del navegador
- **Compresión** - Reduce tamaño, mantiene calidad visual
- **Backup ZIP** - Descargado localmente
- **Sin sincronización automática** - Usuario controla exportación

---

## 📱 LIMITACIONES

- **Límite IndexedDB:** ~50MB por origen (navegador dependiente)
- **Capacidad estimada:** 1,000+ fotos comprimidas
- **Calidad JPEG:** 40% (visualmente bueno, muy comprimido)
- **Navegadores soportados:** Chrome, Firefox, Safari, Edge (todos con IndexedDB)

