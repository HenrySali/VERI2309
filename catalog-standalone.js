// ============================================
// CATÁLOGO DE EQUIPOS - VERSIÓN PÁGINA INDEPENDIENTE
// Carga datos del Excel desde IndexedDB + especificaciones técnicas
// ============================================

(function () {
    // === VARIABLES GLOBALES ===
    let equipmentSpecsDB = null;
    let excelData = [];
    let filteredEquipments = [];
    let allEquipments = [];
    let currentFilters = {
        search: '',
        marca: '',
        tipo: '',
        estado: ''
    };

    // === IndexedDB PARA EXCEL ===
    let imageDB = null;
    const DB_NAME = 'EquiposImageDB';
    const EXCEL_STORE = 'excelData';

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

    // === ELEMENTOS DEL DOM ===
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    const catalogFilterMarca = document.getElementById('catalogFilterMarca');
    const catalogFilterTipo = document.getElementById('catalogFilterTipo');
    const catalogFilterEstado = document.getElementById('catalogFilterEstado');
    const catalogResetFiltersBtn = document.getElementById('catalogResetFiltersBtn');
    const catalogApplyFiltersBtn = document.getElementById('catalogApplyFiltersBtn');
    
    const catalogGrid = document.getElementById('catalogGrid');
    const catalogNoResults = document.getElementById('catalogNoResults');

    // === CARGAR TODOS LOS DATOS ===
    async function loadAllData() {
        try {
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
                console.warn('⚠️ No hay datos del Excel cargados. Mostrando solo equipos predefinidos.');
                excelData = [];
            }

            // Combinar datos: Excel + especificaciones técnicas
            combineEquipmentData();
            
            // Poblar selectores
            populateFilterSelects();
            
            // Mostrar todos los equipos inicialmente
            filteredEquipments = [...allEquipments];
            renderEquipmentCards();
        } catch (err) {
            console.error('❌ Error cargando datos:', err);
            catalogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f00; padding: 40px;">Error cargando catálogo de equipos</div>';
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
                
                // Combinar datos del Excel con especificaciones
                const equipo = {
                    // Datos del Excel
                    id: equipoId,
                    serie: row['Serie'] || '',
                    ubicacion: row['Ubicacion'] || row['Tecnica'] || '',
                    verificado: row['Verificado'] === '✅',
                    observaciones: row['Observacion'] || '',
                    fecha_calibracion: row['Calibracion'] || '',
                    
                    // Datos del Excel (todos los campos)
                    ...row,
                    
                    // Especificaciones técnicas (si existen)
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
        
        console.log('✅ Combinados:', allEquipments.length, 'equipos totales');
    }

    // === POBLAR SELECTORES DE FILTROS ===
    function populateFilterSelects() {
        // Poblar Marca (desde todos los equipos disponibles)
        const marcas = new Set();
        allEquipments.forEach(eq => {
            if (eq.marca) marcas.add(eq.marca);
        });
        
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca;
            option.textContent = marca;
            catalogFilterMarca.appendChild(option);
        });

        // Poblar Tipo (desde todos los equipos disponibles)
        const tipos = new Set();
        allEquipments.forEach(eq => {
            if (eq.tipo) tipos.add(eq.tipo);
        });
        
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            catalogFilterTipo.appendChild(option);
        });
    }

    // === APLICAR FILTROS ===
    function applyFilters() {
        currentFilters = {
            search: catalogSearchInput.value.trim().toUpperCase(),
            marca: catalogFilterMarca.value,
            tipo: catalogFilterTipo.value,
            estado: catalogFilterEstado.value
        };

        filteredEquipments = allEquipments.filter(equipo => {
            // Filtro Búsqueda
            if (currentFilters.search) {
                const searchMatch = 
                    (equipo.id && equipo.id.toUpperCase().includes(currentFilters.search)) ||
                    (equipo.modelo && equipo.modelo.toUpperCase().includes(currentFilters.search)) ||
                    (equipo.marca && equipo.marca.toUpperCase().includes(currentFilters.search)) ||
                    (equipo.descripcion && equipo.descripcion.toUpperCase().includes(currentFilters.search)) ||
                    (equipo.serie && equipo.serie.toUpperCase().includes(currentFilters.search));
                
                if (!searchMatch) return false;
            }

            // Filtro Marca
            if (currentFilters.marca && equipo.marca !== currentFilters.marca) {
                return false;
            }

            // Filtro Tipo
            if (currentFilters.tipo && equipo.tipo !== currentFilters.tipo) {
                return false;
            }

            // Filtro Estado
            if (currentFilters.estado === 'verificado' && !equipo.verificado) {
                return false;
            }
            if (currentFilters.estado === 'no-verificado' && equipo.verificado) {
                return false;
            }

            return true;
        });

        renderEquipmentCards();
    }

    // === RENDERIZAR TARJETAS DE EQUIPOS ===
    function renderEquipmentCards() {
        catalogGrid.innerHTML = '';

        if (filteredEquipments.length === 0) {
            catalogNoResults.style.display = 'grid';
            return;
        }

        catalogNoResults.style.display = 'none';

        filteredEquipments.forEach(equipo => {
            const card = createEquipmentCard(equipo);
            catalogGrid.appendChild(card);
        });
    }

    // === CREAR TARJETA DE EQUIPO ===
    function createEquipmentCard(equipo) {
        const card = document.createElement('div');
        card.className = 'equipment-card';

        const html = `
            <div class="equipment-header">
                <div class="equipment-info">
                    <div class="equipment-id">ID: ${equipo.id}</div>
                    <h3 class="equipment-model">${equipo.modelo}</h3>
                    <div class="equipment-brand">${equipo.marca}</div>
                </div>
                <div class="equipment-badge${equipo.verificado ? '' : ' unverified'}">
                    ${equipo.verificado ? '✅ Verificado' : '⚠️ No verificado'}
                </div>
            </div>

            <div class="equipment-type">${equipo.tipo}</div>

            <div class="equipment-description">${equipo.descripcion}</div>

            ${equipo.ubicacion ? `<div style="color: #00d9ff; font-size: 0.9rem; background: rgba(0,217,255,0.1); padding: 8px; border-radius: 6px;"><strong>📍 Ubicación:</strong> ${equipo.ubicacion}</div>` : ''}

            <div class="equipment-stats">
                <div class="stat-box">
                    <div class="stat-label">Aplicaciones</div>
                    <div class="stat-value">${(equipo.aplicaciones && equipo.aplicaciones.length) || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Estado</div>
                    <div class="stat-value">${equipo.verificado ? '✅' : '⚠️'}</div>
                </div>
            </div>

            <div class="equipment-footer">
                Haz clic para ver detalles técnicos
            </div>
        `;

        card.innerHTML = html;
        card.addEventListener('click', () => showEquipmentDetails(equipo));

        return card;
    }

    // === MOSTRAR DETALLES DEL EQUIPO ===
    function showEquipmentDetails(equipo) {
        const detailsHTML = `
            <div class="modal-overlay" id="equipmentDetailsModal">
                <div class="modal">
                    <div class="modal-header">
                        <div>
                            <h2>${equipo.modelo}</h2>
                            <div style="color: #888; font-size: 0.9rem; margin-top: 4px;">${equipo.marca} | ${equipo.tipo}</div>
                        </div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>

                    <div style="background: rgba(0,217,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem;">
                            <div>
                                <div style="color: #aaa;">ID del Equipo</div>
                                <div style="color: #00ff88; font-weight: 600;">${equipo.id}</div>
                            </div>
                            <div>
                                <div style="color: #aaa;">Estado de Verificación</div>
                                <div style="color: ${equipo.verificado ? '#00ff88' : '#ffc800'}; font-weight: 600;">
                                    ${equipo.verificado ? '✅ Verificado' : '⚠️ No verificado'}
                                </div>
                            </div>
                            ${equipo.serie ? `
                            <div>
                                <div style="color: #aaa;">Serie</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.serie}</div>
                            </div>
                            ` : ''}
                            ${equipo.ubicacion ? `
                            <div>
                                <div style="color: #aaa;">Ubicación</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.ubicacion}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">📋 Descripción</h3>
                        <div style="color: #ccc; line-height: 1.6;">${equipo.descripcion}</div>
                    </div>

                    ${Object.keys(equipo.parametros_tecnicos || {}).length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">⚙️ Parámetros Técnicos</h3>
                        <div class="specs-grid">
                            ${Object.entries(equipo.parametros_tecnicos).map(([key, value]) => `
                                <div class="spec-box">
                                    <div class="spec-label">${key.replace(/_/g, ' ')}</div>
                                    <div class="spec-value">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${Object.keys(equipo.funcionamiento || {}).length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">🔧 Funcionamiento y Procedimientos</h3>
                        <div>
                            ${Object.entries(equipo.funcionamiento).map(([key, value]) => `
                                <div class="procedure-box">
                                    <div class="procedure-title">${key}</div>
                                    <div class="procedure-text">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${(equipo.aplicaciones && equipo.aplicaciones.length) ? `
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">📱 Aplicaciones</h3>
                        <div class="applications">
                            ${equipo.aplicaciones.map(app => `
                                <span class="app-tag">${app}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${equipo.observaciones ? `
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">📝 Observaciones</h3>
                        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; color: #ccc;">${equipo.observaciones}</div>
                    </div>
                    ` : ''}

                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.open('https://www.google.com/search?q=' + encodeURIComponent('${equipo.marca} ${equipo.modelo} especificaciones'), '_blank')" class="btn btn-primary" style="flex: 1;">
                            🔍 Buscar Especificaciones Online
                        </button>
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary" style="flex: 1;">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        // Crear modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = detailsHTML;
        document.body.appendChild(modalContainer);

        const modal = document.getElementById('equipmentDetailsModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // === EVENT LISTENERS ===
    catalogApplyFiltersBtn.addEventListener('click', applyFilters);

    catalogResetFiltersBtn.addEventListener('click', () => {
        catalogSearchInput.value = '';
        catalogFilterMarca.value = '';
        catalogFilterTipo.value = '';
        catalogFilterEstado.value = '';
        currentFilters = { search: '', marca: '', tipo: '', estado: '' };
        filteredEquipments = [...allEquipments];
        renderEquipmentCards();
    });

    // Buscar mientras se escribe
    catalogSearchInput.addEventListener('input', applyFilters);

    // === INICIALIZACIÓN ===
    window.addEventListener('load', () => {
        loadAllData();
    });

    // === ACTUALIZAR DATOS CUANDO LA PESTAÑA SE ENFOCA ===
    window.addEventListener('focus', () => {
        console.log('📂 Recargando catálogo al enfocar...');
        loadAllData();
    });

    console.log('✅ Catalog-standalone.js cargado');
})();
