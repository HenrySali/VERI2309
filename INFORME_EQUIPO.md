# 📋 Página de Informe de Equipo - Guía de Uso

## Descripción General

La página **Informe de Equipo** (`equipment-report.html`) está diseñada especialmente para **referentes de laboratorio** que necesitan generar informes detallados de equipos de laboratorio con información técnica, fotografías, calibración y especificaciones.

---

## Acceso a la Página

### Desde VERI2309 Principal
1. Ve a `index.html` (página principal)
2. Busca la sección **"📋 Informe de Equipo para Referente"**
3. Haz clic en el botón **"📄 Generar Informe de Equipo"**

### Desde el Catálogo
1. Ve a `catalog.html` (catálogo de equipos)
2. En los enlaces superiores, haz clic en **"📋 Informe de Equipo"**

### URL Directa
Accede directamente a: `/equipment-report.html`

---

## Cómo Usar

### 1. Cargar Datos (Requisito Previo)
Antes de usar la página de informe, debes:
1. Cargar un archivo Excel en `index.html`
2. Las fotografías deben estar capturadas en la app principal
3. Los datos se guardan automáticamente en **IndexedDB**

### 2. Seleccionar un Equipo
1. Abre la página `equipment-report.html`
2. En la sección **"🔍 Seleccionar Equipo"** hay un dropdown
3. Haz clic en el dropdown y selecciona el equipo deseado
4. Formato: `ID - Modelo (Marca)` (ejemplo: `CENTRIF-001 - 5424 (Eppendorf)`)

### 3. Cargar el Informe
1. Selecciona el equipo del dropdown
2. Haz clic en el botón **"📄 Cargar Informe"**
3. Se mostrará toda la información del equipo

### 4. Revisar la Información

La página muestra diferentes secciones:

#### 📌 Información General del Equipo
- **ID del Equipo:** Identificador único del equipo
- **Marca:** Fabricante del equipo
- **Modelo:** Modelo específico
- **Tipo:** Categoría del equipo (Centrífuga, Analizador, etc.)
- **Número de Serie:** Serial del equipo
- **Ubicación Técnica:** Dónde está ubicado en el laboratorio
- **Estado de Verificación:** Si fue verificado o no
- **Norma / Certificación:** Estándar que cumple (ISO, IEC, etc.)

#### 📝 Descripción
Descripción detallada del equipo y sus características principales.

#### 📸 Fotografías del Equipo
- Galería de todas las fotos capturadas del equipo
- Haz clic en cualquier foto para ampliarla
- Si no hay fotos: "📭 No hay fotografías registradas"

#### 🏆 Certificado de Calibración
- **Última Fecha de Calibración:** DD/MM/YYYY
- **Estado:** 
  - ✅ **Vigente** (calibrado hace menos de 180 días)
  - ⚠️ **Próximo a vencer** (calibrado hace 180-365 días)
  - ❌ **Vencido** (calibrado hace más de 365 días)
- **Notas:** Requisitos de calibración según normas

#### ⚙️ Parámetros Técnicos
Grid con especificaciones técnicas del equipo:
- Velocidad máxima
- Temperatura de operación
- Voltaje requerido
- Potencia
- Y más según el tipo de equipo

#### 🔧 Instrucciones de Funcionamiento
Procedimientos detallados:
- **Preparación:** Cómo preparar el equipo
- **Operación:** Cómo usar el equipo
- **Seguridad:** Precauciones importantes
- **Mantenimiento:** Cuidados y limpieza

#### 📱 Aplicaciones Recomendadas
Lista de aplicaciones principales para las que se usa el equipo:
- Microbiología
- Hematología
- Bioquímica
- Etc.

#### 📋 Observaciones Registradas
Notas adicionales sobre el equipo registradas en el Excel.

---

## Exportar el Informe

### 🖨️ Imprimir Informe
1. En la sección inferior del informe, haz clic en **"🖨️ Imprimir Informe"**
2. Se abrirá el diálogo de impresión del navegador
3. Selecciona tu impresora y configuración
4. Haz clic en "Imprimir"

**Nota:** Los selectores y navegación NO se imprimirán (solo el informe)

### 📥 Descargar PDF
1. En la sección inferior del informe, haz clic en **"📥 Descargar PDF"**
2. Se generará automáticamente un archivo PDF con nombre: `Informe_[ID_EQUIPO]_[FECHA].pdf`
3. Se descargará a tu carpeta de descargas

**Formato del PDF:**
- Orientación: Vertical (Portrait)
- Formato: A4
- Márgenes: 10mm
- Resolución: Alta (escala 2x)
- Calidad: 98% JPEG

---

## Características Principales

### ✅ Integración de Datos
- **Excel:** Carga datos del archivo Excel almacenado en IndexedDB
- **Especificaciones:** Combina con base de datos técnica (`equipment-specs.json`)
- **Fotografías:** Muestra todas las fotos capturadas del equipo
- **Historial:** Información de calibración del Excel

### ✅ Navegación
- Puedes volver a VERI2309 principal
- Puedes ir al Catálogo de equipos
- Puedes cambiar de equipo sin recargar la página

### ✅ Diseño Responsivo
- Se adapta a pantallas pequeñas (móviles)
- Galería de fotos se reorganiza automáticamente
- Botones accesibles en todos los tamaños

### ✅ Cálculo Automático de Calibración
- Calcula días desde última calibración
- Determina estado automáticamente
- Usa formato de fecha DD/MM/YYYY

---

## Solución de Problemas

### "No hay equipos disponibles"
**Problema:** El dropdown está vacío o muestra "Seleccionar equipo"
**Solución:**
1. Ve a `index.html`
2. Carga un archivo Excel con datos de equipos
3. Vuelve a `equipment-report.html` y recarga la página

### "No hay fotografías registradas"
**Problema:** La galería está vacía
**Solución:**
1. Desde `index.html`, captura fotos de los equipos usando la cámara
2. Las fotos se guardan en IndexedDB automáticamente
3. Vuelve a `equipment-report.html` y recarga

### PDF no se descarga
**Problema:** El botón "Descargar PDF" no funciona
**Solución:**
1. Intenta usar "Imprimir Informe" en su lugar
2. En el diálogo de impresión, selecciona "Guardar como PDF"
3. O comprueba tu bloqueador de pop-ups

### La información del equipo no se muestra
**Problema:** Seleccionaste un equipo pero no aparece el informe
**Solución:**
1. Haz clic nuevamente en "Cargar Informe"
2. Comprueba que el Excel tenga todos los datos necesarios
3. Recarga la página (F5) e intenta de nuevo

---

## Bases de Datos Utilizadas

### IndexedDB - EquiposImageDB (v2)

#### Store: `excelData`
Contiene el archivo Excel cargado:
```json
{
  "currentExcel": {
    "data": [
      {
        "ID": "CENTRIF-001",
        "Serie": "ABC123456",
        "Ubicacion": "Laboratorio Central",
        "Verificado": "✅",
        "Calibracion": "15/03/2024",
        "Observacion": "Funcionando correctamente"
      }
    ]
  }
}
```

#### Store: `images`
Contiene todas las fotografías:
```json
{
  "id": "CENTRIF-001",
  "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## Estructura de Datos de Especificaciones

El archivo `equipment-specs.json` contiene:

```json
{
  "equipments": [
    {
      "id": "CENTRIF-001",
      "marca": "Eppendorf",
      "modelo": "5424",
      "tipo": "Centrífuga",
      "descripcion": "...",
      "parametros_tecnicos": {
        "velocidad_maxima_rpm": 14800,
        "temperatura_operacion": "-10 a 40°C",
        ...
      },
      "funcionamiento": {
        "preparacion": "...",
        "operacion": "...",
        "seguridad": "...",
        "mantenimiento": "..."
      },
      "aplicaciones": ["Microbiología", "Bioquímica", ...],
      "norma": "IEC 61010-2-024"
    }
  ]
}
```

---

## Consejos de Uso

1. **Antes de generar un informe:**
   - Asegúrate de tener fotografías del equipo capturadas
   - Verifica que la fecha de calibración esté en formato DD/MM/YYYY

2. **Para compartir informes:**
   - Usa PDF (mejor calidad y formato consistente)
   - Asegúrate de tener todas las fotos capturadas

3. **Para auditoría:**
   - Imprime el PDF y firma
   - Guarda copia digital para respaldo
   - Incluye sello de laboratorio si es necesario

4. **Información adicional:**
   - Puedes buscar especificaciones online desde el catálogo
   - Los parámetros técnicos se actualizan en `equipment-specs.json`
   - Las observaciones vienen del archivo Excel

---

## Archivos Relacionados

- `equipment-report.html` - Página HTML del informe
- `equipment-report.js` - Lógica y funcionalidades
- `equipment-specs.json` - Base de datos técnica de equipos
- `index.html` - Página principal (carga de datos)
- `app.js` - Aplicación principal

---

## Soporte

Para reportar problemas o sugerencias:
1. Verifica que IndexedDB tenga datos
2. Abre la consola del navegador (F12) para ver errores
3. Comprueba que los nombres de equipos coincidan entre Excel y especificaciones

