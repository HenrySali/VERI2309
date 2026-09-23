// ============================================
// INFORME DE EQUIPO - PARA REFERENTES DE LABORATORIO
// Carga datos del Excel + especificaciones + fotos desde IndexedDB
// ============================================

(function () {
    // === VARIABLES GLOBALES ===
    let equipmentSpecsDB = null;
    let excelData = [];
    let allEquipments = [];
    let imageDB = null;
    let equipmentPhotos = {}; // { equipmentId: [dataUrl1, dataUrl2, ...] }
    
    const DB_NAME = 'EquiposImageDB';
    const EXCEL_STORE = 'excelData';
    const IMAGES_STORE = 'images';

    // === DOM ELEMENTS ===
    const equipmentSelector = document.getElementById('equipmentSelector');
    const loadReportBtn = document.getElementById('loadReportBtn');
    const reportContainer = document.getElementById('reportContainer');
    const emptyState = document.getElementById('emptyState');

    // === INICIALIZAR IndexedDB ===
    function initImageDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 2);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                imageDB = request.result;
                resolve(imageDB);
            };
        });
    }

    // === CARGAR DATOS DEL EXCEL DESDE IndexedDB ===
    async function loadExcelFromDB() {
        try {
            if (!imageDB) await initImageDB();

            return new Promise((resolve) => {
                const tx = imageDB.transaction(EXCEL_STORE, 'readonly');
                const store = tx.objectStore(EXCEL_STORE);
                const request = store.get('currentExcel');
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
            });
        } catch (err) {
            console.error('Error cargando Excel de IndexedDB:', err);
            return null;
        }
    }

    // === CARGAR TODAS LAS FOTOS ===
    async function loadAllPhotos() {
        try {
            if (!imageDB) await initImageDB();

            return new Promise((resolve) => {
                const tx = imageDB.transaction(IMAGES_STORE, 'readonly');
                const store = tx.objectStore(IMAGES_STORE);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const photos = request.result || [];
                    console.log('📸 Fotos cargadas:', photos.length);
                    
                    // Agrupar fotos por ID de equipo
                    equipmentPhotos = {};
                    photos.forEach(photo => {
                        if (!equipmentPhotos[photo.id]) {
                            equipmentPhotos[photo.id] = [];
                        }
                        equipmentPhotos[photo.id].push(photo.dataUrl);
                    });
                    
                    resolve(equipmentPhotos);
                };
                request.onerror = () => resolve({});
            });
        } catch (err) {
            console.error('Error cargando fotos:', err);
            return {};
        }
    }

    // === CARGAR TODOS LOS DATOS ===
    async function loadAllData() {
        try {
            console.log('🔄 Cargando todos los datos...');
            
            // Cargar especificaciones técnicas
            const response = await fetch('equipment-specs.json');
            equipmentSpecsDB = await response.json();
            console.log('✅ Equipment specs cargadas:', equipmentSpecsDB.equipments.length, 'equipos predefinidos');
            
            // Cargar datos del Excel desde IndexedDB
            const savedExcel = await loadExcelFromDB();
            if (savedExcel && savedExcel.data) {
                excelData = savedExcel.data;
                console.log('✅ Datos del Excel cargados:', excelData.length, 'equipos');
            } else {
                console.warn('⚠️ No hay datos del Excel cargados.');
                excelData = [];
            }

            // Cargar fotos
            await loadAllPhotos();

            // Combinar datos
            combineEquipmentData();
            
            // Poblar selector
            populateEquipmentSelector();
            
            // Si no hay equipos, mostrar estado vacío
            if (allEquipments.length === 0) {
                emptyState.style.display = 'block';
                reportContainer.classList.remove('active');
            } else {
                emptyState.style.display = 'none';
            }
            
        } catch (err) {
            console.error('❌ Error cargando datos:', err);
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<div class="empty-icon">❌</div><div>Error cargando datos del equipo</div>';
        }
    }

    // === COMBINAR DATOS: EXCEL + ESPECIFICACIONES ===
    function combineEquipmentData() {
        allEquipments = [];
        
        // Primero: Equipos del Excel con especificaciones técnicas
        if (excelData.length > 0) {
            const idKey = Object.keys(excelData[0])[0]; // Primera columna es ID
            
            excelData.forEach(row => {
                const equipoId = row[idKey] || '';
                
                // Buscar especificaciones técnicas por ID o Serie
                let specs = null;
                
                if (equipmentSpecsDB && equipmentSpecsDB.equipments) {
                    specs = equipmentSpecsDB.equipments.find(eq =>
                        eq.id.toUpperCase() === equipoId.toUpperCase() ||
                        (row['Serie'] && eq.id.toUpperCase().includes(row['Serie'].toUpperCase()))
                    );
                }
                
                // Combinar datos
                const equipo = {
                    id: equipoId,
                    serie: row['Serie'] || '',
                    ubicacion: row['Ubicacion'] || row['Tecnica'] || '',
                    verificado: row['Verificado'] === '✅',
                    observaciones: row['Observacion'] || '',
                    fecha_calibracion: row['Calibracion'] || '',
                    ...row,
                    ...(specs || {
                        marca: 'Desconocida',
                        modelo: 'No especificado',
                        tipo: 'Equipo de laboratorio',
                        descripcion: 'Equipo sin especificaciones técnicas cargadas',
                        parametros_tecnicos: {},
                        funcionamiento: {},
                        aplicaciones: [],
                        norma: 'N/A'
                    })
                };
                
                allEquipments.push(equipo);
            });
        }
        
        // Segundo: Equipos predefinidos que NO estén en el Excel
        if (equipmentSpecsDB && equipmentSpecsDB.equipments) {
            equipmentSpecsDB.equipments.forEach(spec => {
                const exists = allEquipments.find(eq => eq.id === spec.id);
                if (!exists) {
                    allEquipments.push({
                        ...spec,
                        serie: '',
                        ubicacion: '',
                        verificado: false,
                        observaciones: '',
                        fecha_calibracion: ''
                    });
                }
            });
        }
        
        console.log('✅ Combinados:', allEquipments.length, 'equipos totales para reportes');
    }

    // === POBLAR SELECTOR DE EQUIPOS ===
    function populateEquipmentSelector() {
        equipmentSelector.innerHTML = '<option value="">-- Seleccionar equipo --</option>';
        
        // Ordenar por ID
        const sorted = [...allEquipments].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        
        sorted.forEach(equipo => {
            const option = document.createElement('option');
            option.value = equipo.id;
            option.textContent = `${equipo.id} - ${equipo.modelo} (${equipo.marca})`;
            equipmentSelector.appendChild(option);
        });
        
        console.log('✅ Selector poblado con', allEquipments.length, 'equipos');
    }

    // === CARGAR Y MOSTRAR INFORME ===
    function loadReport() {
        const selectedId = equipmentSelector.value;
        
        if (!selectedId) {
            alert('Por favor, selecciona un equipo');
            return;
        }

        const equipo = allEquipments.find(e => e.id === selectedId);
        if (!equipo) {
            alert('Equipo no encontrado');
            return;
        }

        displayReport(equipo);
    }

    // === MOSTRAR INFORME EN PANTALLA ===
    function displayReport(equipo) {
        console.log('📋 Mostrando informe para:', equipo.id);
        
        // Actualizar información general
        document.getElementById('reportTitle').textContent = `${equipo.modelo}`;
        document.getElementById('reportSubtitle').textContent = `${equipo.marca} | ${equipo.tipo}`;
        
        document.getElementById('reportId').textContent = equipo.id;
        document.getElementById('reportMarca').textContent = equipo.marca || '-';
        document.getElementById('reportModelo').textContent = equipo.modelo || '-';
        document.getElementById('reportTipo').textContent = equipo.tipo || '-';
        document.getElementById('reportSerie').textContent = equipo.serie || '-';
        document.getElementById('reportUbicacion').textContent = equipo.ubicacion || '-';
        document.getElementById('reportVerificado').textContent = equipo.verificado ? '✅ Verificado' : '⚠️ No verificado';
        document.getElementById('reportNorma').textContent = equipo.norma || 'N/A';
        
        // Descripción
        document.getElementById('reportDescripcion').textContent = equipo.descripcion || 'Sin descripción';
        
        // Observaciones
        if (equipo.observaciones) {
            document.getElementById('reportObservations').textContent = equipo.observaciones;
            document.getElementById('observationsSection').style.display = 'block';
        } else {
            document.getElementById('observationsSection').style.display = 'none';
        }
        
        // Calibración
        if (equipo.fecha_calibracion) {
            document.getElementById('reportFechaCalib').textContent = equipo.fecha_calibracion;
            const days = getDaysSinceCalibration(equipo.fecha_calibracion);
            if (days < 180) {
                document.getElementById('reportEstadoCalib').textContent = '✅ Vigente';
                document.getElementById('reportEstadoCalib').style.color = '#00ff88';
            } else if (days < 365) {
                document.getElementById('reportEstadoCalib').textContent = '⚠️ Próximo a vencer';
                document.getElementById('reportEstadoCalib').style.color = '#ffc800';
            } else {
                document.getElementById('reportEstadoCalib').textContent = '❌ Vencido';
                document.getElementById('reportEstadoCalib').style.color = '#ff4444';
            }
        } else {
            document.getElementById('reportFechaCalib').textContent = 'No registrada';
            document.getElementById('reportEstadoCalib').textContent = 'Pendiente';
        }
        
        // Notas de calibración
        const calibNotes = equipo.norma ? `El equipo debe cumplir con la norma ${equipo.norma} y ser calibrado regularmente según requisitos normativos.` : 'El equipo debe ser calibrado regularmente según normativas vigentes.';
        document.getElementById('reportCertificateNotes').innerHTML = `<strong>Notas:</strong> ${calibNotes}`;
        
        // Fotos
        displayPhotosGallery(equipo.id);
        
        // Parámetros Técnicos
        if (equipo.parametros_tecnicos && Object.keys(equipo.parametros_tecnicos).length > 0) {
            const specsHtml = Object.entries(equipo.parametros_tecnicos)
                .map(([key, value]) => `
                    <div class="spec-box">
                        <div class="spec-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
                        <div class="spec-value">${value}</div>
                    </div>
                `)
                .join('');
            
            document.getElementById('reportSpecs').innerHTML = specsHtml;
            document.getElementById('specsSection').style.display = 'block';
        } else {
            document.getElementById('specsSection').style.display = 'none';
        }
        
        // Funcionamiento
        if (equipo.funcionamiento && Object.keys(equipo.funcionamiento).length > 0) {
            const funcHtml = Object.entries(equipo.funcionamiento)
                .map(([key, value]) => `
                    <div class="procedure-box">
                        <div class="procedure-title">${key.replace(/_/g, ' ').toUpperCase()}</div>
                        <div class="procedure-text">${value}</div>
                    </div>
                `)
                .join('');
            
            document.getElementById('reportFunctionality').innerHTML = funcHtml;
            document.getElementById('functionalitySection').style.display = 'block';
        } else {
            document.getElementById('functionalitySection').style.display = 'none';
        }
        
        // Aplicaciones
        if (equipo.aplicaciones && equipo.aplicaciones.length > 0) {
            const appHtml = equipo.aplicaciones
                .map(app => `<span class="app-tag">${app}</span>`)
                .join('');
            
            document.getElementById('reportApplications').innerHTML = appHtml;
            document.getElementById('applicationsSection').style.display = 'block';
        } else {
            document.getElementById('applicationsSection').style.display = 'none';
        }
        
        // Mostrar reporte, ocultar estado vacío
        reportContainer.classList.add('active');
        emptyState.style.display = 'none';
    }

    // === MOSTRAR GALERÍA DE FOTOS ===
    function displayPhotosGallery(equipmentId) {
        const photoGallery = document.getElementById('photoGallery');
        photoGallery.innerHTML = '';
        
        const photos = equipmentPhotos[equipmentId] || [];
        
        if (photos.length === 0) {
            photoGallery.innerHTML = '<div class="no-photos">📭 No hay fotografías registradas para este equipo</div>';
            return;
        }
        
        photos.forEach((dataUrl, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${dataUrl}" alt="Foto del equipo ${index + 1}">
                <div class="photo-label">Foto ${index + 1}</div>
            `;
            
            // Agregar evento para ampliar foto
            photoItem.querySelector('img').addEventListener('click', () => {
                showPhotoModal(dataUrl);
            });
            
            photoGallery.appendChild(photoItem);
        });
        
        console.log('📸 Galería de fotos actualizada:', photos.length, 'fotos');
    }

    // === MOSTRAR FOTO AMPLIADA ===
    function showPhotoModal(dataUrl) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;
        `;
        
        modal.appendChild(img);
        modal.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
    }

    // === CALCULAR DÍAS DESDE CALIBRACIÓN ===
    function getDaysSinceCalibration(dateStr) {
        try {
            const parts = dateStr.split('/');
            if (parts.length !== 3) return 999;
            
            const date = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
            const today = new Date();
            const diff = today - date;
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        } catch (err) {
            return 999;
        }
    }

    // === DESCARGAR PDF (usando html2pdf o fallback a print) ===
    window.downloadPDF = function() {
        const selectedId = equipmentSelector.value;
        const equipo = allEquipments.find(e => e.id === selectedId);
        
        if (!equipo) {
            alert('Por favor, selecciona un equipo primero');
            return;
        }
        
        // Intentar usar html2pdf si está disponible, sino usar print
        if (typeof html2pdf !== 'undefined') {
            // html2pdf ya está cargado
            const element = document.getElementById('reportContainer');
            const opt = {
                margin: 10,
                filename: `Informe_${equipo.id}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };
            
            html2pdf().set(opt).from(element).save();
        } else {
            // Cargar html2pdf dinámicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            
            script.onload = () => {
                const element = document.getElementById('reportContainer');
                const opt = {
                    margin: 10,
                    filename: `Informe_${equipo.id}_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
                };
                
                html2pdf().set(opt).from(element).save();
            };
            
            script.onerror = () => {
                console.warn('⚠️ html2pdf no disponible, usando print del navegador');
                window.print();
            };
            
            document.head.appendChild(script);
        }
    };

    // === EVENT LISTENERS ===
    loadReportBtn.addEventListener('click', loadReport);
    
    // Permitir cargar presionando Enter
    equipmentSelector.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadReport();
        }
    });

    // === INICIALIZACIÓN ===
    window.addEventListener('load', () => {
        console.log('🚀 Inicializando Equipment Report...');
        loadAllData();
    });

    // === ACTUALIZAR DATOS CUANDO LA PESTAÑA SE ENFOCA ===
    window.addEventListener('focus', () => {
        console.log('📋 Recargando informe al enfocar...');
        loadAllData();
    });

    console.log('✅ equipment-report.js cargado');
})();
