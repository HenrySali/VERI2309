# 🔄 FLUJO COMPLETO DEL SISTEMA - VERI2309

## 🎯 Resumen Ejecutivo

El sistema VERI2309 es una **aplicación de gestión de equipos técnicos** que permite:
1. Cargar inventario de Excel
2. Escanear/verificar equipos con QR
3. Capturar fotos de equipos
4. Registrar observaciones
5. Actualizar calibraciones y ubicaciones
6. Exportar datos e imágenes

---

## 📊 FLUJO PRINCIPAL

```
┌─────────────────────────────────────────────────────────────┐
│                     INICIO DE SESIÓN                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 1. CARGAR ARCHIVO    │
        │    EXCEL             │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 2. SELECCIONAR UBICACIÓN     │
        │    FIJA (Opcional)           │
        └──────────┬────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 3. ESCANEAR/VERIFICAR        │
        │    EQUIPOS CON QR            │
        │    (Ciclo repetitivo)        │
        └──────────┬────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ 4. EXPORTAR DATOS E          │
        │    IMÁGENES                  │
        └──────────────────────────────┘
```

---

## 🔹 PASO 1: CARGAR ARCHIVO EXCEL

### 1.1 Usuario Abre Página
- Página carga desde: `henrysali.github.io/VERI2309/`
- HTML: `index.html`
- JavaScript: `app.js` + `estaciones-agua.js`
- Estilos: CSS inline en HTML

**Ubicación en HTML:** Línea ~859
```html
<div class="card">
    <h2>📂 Cargar Archivo Excel</h2>
    <label class="file-upload" for="fileInput">
        <input type="file" id="fileInput" accept=".xlsx,.xls">
```

### 1.2 Usuario Selecciona Archivo
- Hace clic en zona de carga
- Selecciona archivo `.xlsx` o `.xls`
- Archivo se carga en memoria

### 1.3 Procesar Archivo
**Botón:** "Procesar Archivo" (línea ~881)

**En `app.js` línea 497:**
```javascript
processBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    // Leer archivo con XLSX library
    const data = new Uint8Array(e.target.result);
    globalWorkbook = XLSX.read(data, { type: 'array', cellDates: true });
    
    // Procesar todas las hojas
    globalSheetNames = globalWorkbook.SheetNames;
    
    // Limpiar datos vacíos
    // Guardar en IndexedDB
    renderTable();
    populateLocations();
});
```

### 1.4 Resultado
- ✅ Datos cargados en `globalDataRaw[]`
- ✅ Headers extraídos en `globalHeaders[]`
- ✅ Se muestra tabla de datos
- ✅ Se activan botones de acciones
- ✅ Ubicaciones se cargan en selectores

**Estado tras Paso 1:**
```
globalDataRaw = [
  { ID: "AGI-24239", Serie: "SN123", Ubicacion: "Lab Catamarca", ... },
  { ID: "AGI-24240", Serie: "SN124", Ubicacion: "Lab Buenos Aires", ... },
  ...
]

globalHeaders = ["ID", "Serie", "Ubicacion", "Calibracion", "Observacion"]
```

---

## 🔹 PASO 2: SELECCIONAR UBICACIÓN FIJA (OPCIONAL)

### 2.1 Usuario Hace Clic en "📍 Ubicación Fija"

**Ubicación en HTML:** Línea ~928
```html
<div id="selectLocationBtn" class="action-btn">
    <div class="icon">📍</div>
    <div class="label">Ubicación Fija</div>
</div>
```

**En `app.js` línea 1119:**
```javascript
selectLocationBtn.addEventListener('click', () => {
    if (globalDataRaw.length === 0) {
        alert("⚠️ No hay datos cargados");
        return;
    }
    fixedLocationPanel.classList.remove('hidden');
});
```

### 2.2 Panel Se Abre

**Ubicación en HTML:** Línea ~938
```html
<div id="fixedLocationPanel" class="hidden" style="...">
    <label>📍 Ubicación Fija Activa</label>
    <button id="clearLocationBtn">✕ Limpiar</button>
    <select id="fixedLocationSelect">
        <!-- Opciones pobladas con ubicaciones del Excel -->
    </select>
    <div id="fixedLocationDisplay">
        ✅ UBICACIÓN ACTIVA
    </div>
</div>
```

### 2.3 Usuario Selecciona Ubicación

**En `app.js` línea 1138:**
```javascript
fixedLocationSelect.addEventListener('change', (e) => {
    const selectedValue = e.target.value.trim();
    
    if (selectedValue) {
        fixedLocationEnabled = true;
        fixedLocationValue = selectedValue;  // Ej: "Laboratorio Catamarca"
        fixedLocationValue_Display.textContent = selectedValue;
        fixedLocationDisplay.style.display = 'block';
        
        // Guardar en localStorage
        localStorage.setItem('fixedLocation', JSON.stringify({
            enabled: true,
            value: selectedValue
        }));
        
        // Cerrar panel después de 2 segundos
        setTimeout(() => {
            fixedLocationPanel.classList.add('hidden');
        }, 2000);
    }
});
```

### 2.4 Resultado
- ✅ `fixedLocationEnabled = true`
- ✅ `fixedLocationValue = "Laboratorio Catamarca"`
- ✅ Guardado en `localStorage`
- ✅ Panel se cierra automáticamente

**A partir de ahora, TODOS los equipos que se escaneen/registren irán a esta ubicación**

---

## 🔹 PASO 3: ESCANEAR/VERIFICAR EQUIPOS

Este es el **CICLO PRINCIPAL** del sistema. Se repite para cada equipo.

### 3.1 Opción A: Escanear QR

**Ubicación en HTML:** Línea ~918
```html
<div id="startScanBtn" class="action-btn">
    <div class="icon">📷</div>
    <div class="label">Escanear QR</div>
</div>
```

**En `app.js` línea 1592:**
```javascript
startScanBtn.addEventListener('click', () => {
    if (globalDataRaw.length === 0) {
        alert("⚠️ No hay datos cargados");
        return;
    }
    
    // Cerrar panel de ubicación si está abierto
    fixedLocationPanel.classList.add('hidden');
    
    // Mostrar área de cámara
    readerDiv.classList.remove('hidden');
    startScanBtn.classList.add('hidden');
    stopScanBtn.classList.remove('hidden');
    
    // Iniciar escáner QR con html5-qrcode library
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },  // Cámara trasera
        { fps: 15, qrbox: { width: 250, height: 250 } },
        onScanSuccess
    ).catch(err => {
        alert("Error cámara: " + err);
    });
});
```

**UI en pantalla:**
```
┌─────────────────────────────┐
│   ÁREA DE CÁMARA QR         │
│  (250x250 cuadro enfoque)   │
│                             │
│   [Apunta el QR]            │
│                             │
└─────────────────────────────┘
  [Detener Cámara]
```

### 3.2 QR Se Escanea Exitosamente

**En `app.js` línea 1628:**
```javascript
function onScanSuccess(decodedText) {
    let finalValue = decodedText;
    
    // Decodificar URL si es de SharePoint
    if (decodedText.includes('%2F') || decodedText.includes('%2f')) {
        const parts = decodedText.split(/%2F|%2f/);
        finalValue = decodeURIComponent(parts[parts.length - 1]);
        // Ejemplo: "CENTRIF-30766"
    }
    
    stopScanning();
    findOrRegister(finalValue);  // Procesar serie
}
```

### 3.3 Buscar Equipo en Base de Datos

**En `app.js` línea 1640:**
```javascript
async function findOrRegister(scannedValue) {
    const normalize = s => String(s || '').trim().toUpperCase();
    const target = normalize(scannedValue);  // "CENTRIF-30766"
    
    const idKey = globalHeaders[0];  // "ID"
    const serieKey = getColumnKey('serie');  // "Serie"
    
    // BUSCAR por ID primero
    let index = globalDataRaw.findIndex(row => 
        normalize(row[idKey]) === target
    );
    
    // Si no encuentra, buscar por Serie
    if (index === -1 && serieKey) {
        index = globalDataRaw.findIndex(row => 
            normalize(row[serieKey]) === target
        );
    }
    
    if (index !== -1) {
        // ✅ ENCONTRADO
        handleEquipoEncontrado(index);
    } else {
        // ❌ NO ENCONTRADO
        handleEquipoNoEncontrado(scannedValue);
    }
}
```

### 3.4a ENCONTRADO: Cargar Panel de Edición

**En `app.js` línea 1665:**
```javascript
// ENCONTRADO - Mostrar panel de edición
currentMatchIndex = index;
const row = globalDataRaw[index];

// Marcar como verificado
row['Verificado'] = '✅';

// UI Muestra:
scanResult.textContent = `✅ Encontrado en fila ${index + 2} - VERIFICADO`;
editPanel.classList.remove('hidden');

// Cargar datos del equipo
equipoNombre.textContent = row['Equipo'] || 'N/A';
editSerieInput.value = row['Serie'] || '';
dateInput.value = row['Calibracion'] || '';

// Si hay ubicación fija, usarla
if (fixedLocationEnabled && fixedLocationValue) {
    editLocationSelect.value = fixedLocationValue;
} else {
    editLocationSelect.value = row['Ubicacion'] || '';
}

// Cargar imágenes del equipo
await loadImagesForRow(row);

// Cargar observaciones
loadObservacionesForRow(row);
```

**UI que se muestra:**
```
┌─────────────────────────────────────────┐
│  ✅ ENCONTRADO EN FILA 5 - VERIFICADO   │
│                                         │
│  EQUIPO: CENTRÍFUGA 3000-RPM            │
│                                         │
│  🔢 Número de Serie: CENTRIF-30766      │
│  📷 Fotos del Equipo:                   │
│     [Thumbnail] [Thumbnail] [Agregar]   │
│  📍 Ubicación Técnica: Laboratorio Cat. │
│  📅 Fecha de Calibración: 2026-09-23    │
│  📝 Observaciones:                      │
│     [Revisar engranaje]                 │
│     [Agregar Nueva]                     │
│                                         │
│  [Actualizar]                           │
└─────────────────────────────────────────┘
```

### 3.4b NO ENCONTRADO: Abrir Registro

**En `app.js` línea 1689:**
```javascript
// NO ENCONTRADO - Registrar nuevo equipo
scanResult.textContent = `⚠️ "CENTRIF-30766" no encontrado. Registrando...`;

// Abrir modal de registro
registerModal.classList.remove('hidden');

// Pre-llenar serie
regSerieInput.value = scannedValue;

// Si hay ubicación fija, pre-llenar
regLocationSelect.value = fixedLocationEnabled ? fixedLocationValue : '';

// Usuario debe completar:
// - Ubicación (si no está fija)
// - Observaciones
// - Foto (opcional)
```

**UI del Modal de Registro:**
```
┌──────────────────────────────────┐
│  📝 Registrar Nueva Serie        │
│                                  │
│  Número de Serie                 │
│  [CENTRIF-30766]                 │
│                                  │
│  Ubicación Técnica               │
│  [Laboratorio Catamarca]  ▼      │
│                                  │
│  Observaciones                   │
│  [Primera vez en inventario]     │
│                                  │
│  📷 Foto del Equipo              │
│  [📷 Abrir Cámara]               │
│                                  │
│  [Guardar]  [Cancelar]           │
└──────────────────────────────────┘
```

### 3.5 Usuario Captura Foto (Opcional)

**En `app.js` línea 1370 (startCameraBtn):**
```javascript
startCameraBtn.addEventListener('click', async () => {
    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
    });
    
    cameraVideo.srcObject = cameraStream;
    cameraContainer.classList.remove('hidden');
    
    // Mostrar botones
    capturePhotoBtn.classList.remove('hidden');
    startCameraBtn.classList.add('hidden');
});
```

**Al capturar:**
```javascript
capturePhotoBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0);
    
    capturedImageData = canvas.toDataURL('image/jpeg');
    // Guardado en memoria, se guardará en IndexedDB cuando registre
});
```

### 3.6 Usuario Completa Formulario y Guarda

**En `app.js` línea 1449 (confirmRegBtn):**
```javascript
confirmRegBtn.addEventListener('click', () => {
    const serieVal = regSerieInput.value.trim().toUpperCase();
    let locVal = regLocationSelect.value;
    const obsVal = regObservaciones.value.trim();
    
    // Si hay ubicación fija, usarla
    if (fixedLocationEnabled && fixedLocationValue) {
        locVal = fixedLocationValue;
    }
    
    if (!serieVal || !locVal) {
        alert("Completa todos los campos");
        return;
    }
    
    // Crear nueva fila
    const newRow = {
        [idKey]: `NEW_${Date.now()}`,
        [serieKey]: serieVal,
        [locKey]: locVal,
        [obsKey]: obsVal,
        'Verificado': '✅'
    };
    
    // Guardar imagen si existe
    if (capturedImageData) {
        const imgId = `${newRow[idKey]}_${Date.now()}`;
        saveImageToDB(imgId, capturedImageData);
    }
    
    // Agregar a datos
    globalDataRaw.push(newRow);
    
    // Guardar en IndexedDB
    saveExcelToDB();
    
    // Cerrar modal
    registerModal.classList.add('hidden');
    
    // Mostrar feedback
    regFeedback.textContent = `✅ Serie "${serieVal}" registrada`;
});
```

### 3.7 Usuario Actualiza Equipo (Si fue encontrado)

**En `app.js` línea 1710 (updateBtn):**
```javascript
updateBtn.addEventListener('click', async () => {
    if (currentMatchIndex === -1) return;
    
    const newDate = dateInput.value;
    let newLoc = editLocationSelect.value;
    const newSerie = editSerieInput.value.trim().toUpperCase();
    
    // Si hay ubicación fija, usarla
    if (fixedLocationEnabled && fixedLocationValue) {
        newLoc = fixedLocationValue;
    }
    
    // Actualizar el registro
    globalDataRaw[currentMatchIndex][locKey] = newLoc;
    globalDataRaw[currentMatchIndex][serieKey] = newSerie;
    globalDataRaw[currentMatchIndex][targetKey] = newDate;
    globalDataRaw[currentMatchIndex]['Observacion'] = mainObs.value;
    
    // Guardar en IndexedDB
    saveExcelToDB();
    
    // Ocultar panel
    editPanel.classList.add('hidden');
});
```

### 3.8 Ciclo Repetición

**Usuario puede:**
- ✅ Escanear otro QR → vuelve a paso 3.1
- ✅ Verificar por serie → paso 3.2 (manual)
- ✅ Registrar serie → paso 3.4b (manual)

---

## 🔹 PASO 4: EXPORTAR DATOS E IMÁGENES

### 4.1 Exportar Excel Actualizado

**Ubicación en HTML:** Línea ~883
```html
<button id="exportBtn" class="btn btn-success">💾 Exportar Excel</button>
```

**En `app.js` línea 608:**
```javascript
exportBtn.addEventListener('click', async () => {
    if (!globalDataRaw || globalDataRaw.length === 0) {
        alert("No hay datos para exportar");
        return;
    }
    
    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(globalDataRaw);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, globalCurrentSheetName);
    
    // Descargar con fecha
    const fileName = exportFileName.value || `Equipos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
});
```

**Resultado:**
- Descarga: `Equipos_2026-09-23.xlsx`
- Incluye: Todos los cambios realizados
- Datos: Con verificaciones, ubicaciones nuevas, fechas actuales

### 4.2 Exportar Imágenes

**Ubicación en HTML:** Línea ~903
```html
<button id="exportImagesBtn" class="btn btn-secondary">⬇️ Exportar Imágenes</button>
```

**En `app.js` línea 310:**
```javascript
exportImagesBtn.addEventListener('click', async () => {
    const images = await getAllImagesFromDB();
    
    if (images.length === 0) {
        alert("No hay imágenes para exportar");
        return;
    }
    
    // Crear ZIP
    const zip = new JSZip();
    
    images.forEach((img, idx) => {
        // Convertir base64 a blob
        const blob = base64ToBlob(img.dataUrl);
        zip.file(`imagen_${idx + 1}.jpg`, blob);
    });
    
    // Descargar ZIP
    zip.generateAsync({ type: 'blob' }).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_imagenes_${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();
    });
});
```

**Resultado:**
- Descarga: `backup_imagenes_2026-09-23.zip`
- Contiene: Todas las fotos capturadas
- Compresión: JPEG 40% de calidad

### 4.3 Importar Imágenes (Restaurar Backup)

**Ubicación en HTML:** Línea ~908
```html
<label class="btn btn-secondary" style="cursor:pointer;">
    ⬆️ Importar Imágenes
    <input type="file" id="importImagesInput" accept=".zip">
</label>
```

**En `app.js` línea 347:**
```javascript
importImagesInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    // Leer ZIP
    const zip = new JSZip();
    await zip.loadAsync(file);
    
    // Extraer imágenes
    let count = 0;
    zip.forEach(async (relativePath, file) => {
        const blob = await file.async('blob');
        const reader = new FileReader();
        
        reader.onload = async () => {
            const id = `imported_${Date.now()}_${count}`;
            await saveImageToDB(id, reader.result);
            count++;
        };
        
        reader.readAsDataURL(blob);
    });
});
```

---

## 📈 DIAGRAMA COMPLETO DEL FLUJO

```
INICIO
  │
  ├─► [1. CARGAR EXCEL]
  │   └─► globalDataRaw[], globalHeaders[] cargados
  │   └─► populateLocations() llena selectores
  │
  ├─► [2. UBICACIÓN FIJA (Opcional)]
  │   └─► fixedLocationEnabled = true
  │   └─► fixedLocationValue = "Ubicación seleccionada"
  │   └─► Se guarda en localStorage
  │
  └─► [3. CICLO ESCANEO - SE REPITE]
      │
      ├─── OPCIÓN A: Escanear QR
      │    │
      │    ├─► Cámara abierta
      │    ├─► QR decodificado
      │    ├─► Buscar en globalDataRaw[]
      │    │
      │    ├─── SI ENCONTRADO:
      │    │    │
      │    │    ├─► Mostrar panel edición
      │    │    ├─► Cargar datos actuales
      │    │    ├─► Cargar imágenes
      │    │    ├─► Si ubicación fija → asignar auto
      │    │    │
      │    │    └─► Usuario puede:
      │    │        ├─► Cambiar serie
      │    │        ├─► Cambiar fecha
      │    │        ├─► Agregar foto
      │    │        ├─► Agregar observación
      │    │        └─► [Actualizar]
      │    │            └─► Datos guardados en IndexedDB
      │    │
      │    └─── SI NO ENCONTRADO:
      │         │
      │         ├─► Abrir modal registro
      │         ├─► Pre-llenar serie
      │         ├─► Si ubicación fija → asignar auto
      │         │
      │         └─► Usuario debe:
      │             ├─► Seleccionar ubicación (si no está fija)
      │             ├─► Escribir observaciones
      │             ├─► Capturar foto (opcional)
      │             │   ├─► Cámara se abre
      │             │   ├─► Captura foto
      │             │   └─► Imagen en memoria
      │             └─► [Guardar]
      │                 ├─► Nueva fila agregada
      │                 ├─► Imagen guardada en IndexedDB
      │                 └─► Datos guardados en IndexedDB
      │
      ├─── OPCIÓN B: Verificar por Serie (Manual)
      │    │
      │    ├─► Modal con input de serie
      │    ├─► Usuario ingresa serie
      │    ├─► Buscar en globalDataRaw[]
      │    │
      │    └─► Si encuentra → mostrar panel edición (igual que A)
      │
      ├─── OPCIÓN C: Registrar Serie (Manual)
      │    │
      │    ├─► Modal de registro
      │    ├─► Usuario ingresa datos
      │    ├─► Si ubicación fija → asignar auto
      │    │
      │    └─► [Guardar] → Nueva fila agregada
      │
      └─► VOLVER A ESCANEAR (Ciclo repetitivo)
           ├─► Escanear siguiente equipo
           └─► Si no hay más → paso 4
  
  ├─► [4. EXPORTAR DATOS E IMÁGENES]
  │   │
  │   ├─► [💾 Exportar Excel]
  │   │   └─► globalDataRaw[] → .xlsx
  │   │
  │   ├─► [⬇️ Exportar Imágenes]
  │   │   └─► IndexedDB images → .zip
  │   │
  │   └─► [⬆️ Importar Imágenes]
  │       └─► .zip → IndexedDB images
  │
  └─► FIN
```

---

## 🗄️ ALMACENAMIENTO DE DATOS

### En Memoria (Variables Global)
```javascript
globalDataRaw[]        // Array de objetos con datos de equipos
globalHeaders[]        // Nombres de columnas
globalAllSheetsData    // Datos de múltiples hojas
globalAllSheetsHeaders // Headers de múltiples hojas
```

### En IndexedDB (Persistencia)
```
Base de Datos: EquiposImageDB
├── Store: "images"
│   └── Contiene: { id, dataUrl (comprimida) }
│
└── Store: "excelData"
    └── Contiene: {
        id: 'currentExcel',
        allSheetsData: {...},
        allSheetsHeaders: {...},
        data: [...],
        headers: [...]
        }
```

### En LocalStorage (Configuración)
```javascript
localStorage.fixedLocation = {
    enabled: true,
    value: "Laboratorio Catamarca"
}
```

### En Archivos (Exportación)
```
📥 Descargas:
├── Equipos_2026-09-23.xlsx
└── backup_imagenes_2026-09-23.zip
```

---

## 🔐 SEGURIDAD Y PERSISTENCIA

### Antes de Cerrar Sesión
- Todos los cambios están en IndexedDB (navegador local)
- No se pierden aunque cierre navegador
- Se cargan automáticamente al abrir

### Backup Manual
- Exportar Excel + Imágenes
- Guardar localmente en computadora
- Sincronizar con otros dispositivos

### Sincronización
- GitHub API (si se integra)
- SharePoint (si se integra)
- Google Drive (si se integra)

---

## ⚙️ TECNOLOGÍAS UTILIZADAS

| Componente | Tecnología | Propósito |
|-----------|-----------|----------|
| Lectura Excel | XLSX.js | Cargar datos de .xlsx |
| Lectura QR | html5-qrcode | Escanear códigos QR |
| Almacenamiento | IndexedDB | Persistencia datos/imágenes |
| Compresión | Canvas API | Comprimir fotos (40% JPEG) |
| ZIP | JSZip | Exportar/importar imágenes |
| Hosting | GitHub Pages | Servidor estático |
| Versión Control | Git + GitHub | Control de código |

---

## 📱 INTERFAZ DE USUARIO

### Vista Principal (Línea ~859)
- 📂 Cargar Archivo Excel
- 💾 Exportar Excel
- 📷 Exportar/Importar Imágenes
- 🔧 Panel de Acciones

### Panel de Acciones (Línea ~918)
1. 📷 Escanear QR
2. 🔍 Verificar por Serie
3. 📝 Registrar Serie
4. 📍 Ubicación Fija

### Modal de Edición (Después de escanear)
- Datos del equipo
- Galería de fotos
- Campos editables
- Botón actualizar

### Tabla de Datos (Línea ~1026)
- Todos los equipos
- Sorteo por columnas
- Búsqueda por serie
- Indicador de verificación

---

## 🎯 CASOS DE USO

### Caso 1: Verificación de Inventario
```
1. Técnico carga Excel con equipos
2. Selecciona ubicación: "Laboratorio Catamarca"
3. Escanea cada equipo
4. Sistema asigna ubicación automáticamente
5. Técnico captura fotos
6. Sistema marca como verificado ✅
7. Exporta datos e imágenes
```

### Caso 2: Actualización de Calibración
```
1. Carga Excel anterior
2. Escanea equipo
3. Sistema muestra datos actuales
4. Técnico actualiza fecha de calibración
5. Guarda cambios
6. Exporta Excel con datos nuevos
```

### Caso 3: Nuevo Equipo
```
1. Técnico escanea QR de nuevo equipo
2. Sistema no encuentra
3. Abre modal de registro
4. Técnico completa datos
5. Captura foto del equipo
6. Guarda como nuevo registro
```

---

## ✅ RESUMEN DEL FLUJO

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Cargar Excel | Datos en memoria + IndexedDB |
| 2 | Ubicación Fija (opt) | Ubicación guardada en localStorage |
| 3 | Escanear/Verificar | Equipo encontrado o registrado |
| 4 | Capturar Foto | Imagen comprimida en IndexedDB |
| 5 | Actualizar Datos | Cambios guardados en IndexedDB |
| 6 | Repetir 3-5 | Ciclo para cada equipo |
| 7 | Exportar | Descargar Excel + ZIP de imágenes |

---

## 🔄 PERSISTENCIA DE DATOS

```
SESIÓN 1                    SESIÓN 2 (Otro dispositivo)
│                           │
├─ Cargar Excel            │ ← Cargar backup Excel
├─ Escanear equipos        │ ← Importar imágenes (ZIP)
├─ Capturar fotos          │ ← Escanear más equipos
├─ Guardar en IndexedDB    │ ← Actualizar datos
│                           │
└─ Exportar:               │ └─ Exportar:
  ├─ Equipos.xlsx          │   ├─ Equipos_v2.xlsx
  └─ imágenes.zip          │   └─ imágenes_v2.zip
```

