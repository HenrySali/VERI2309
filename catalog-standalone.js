// ============================================
// CATÁLOGO DE EQUIPOS - VERSIÓN PÁGINA INDEPENDIENTE
// ============================================

(function () {
    // === VARIABLES GLOBALES ===
    let equipmentSpecsDB = null;
    let filteredEquipments = [];
    let allEquipments = [];
    let currentFilters = {
        search: '',
        marca: '',
        tipo: '',
        estado: ''
    };

    // === ELEMENTOS DEL DOM ===
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    const catalogFilterMarca = document.getElementById('catalogFilterMarca');
    const catalogFilterTipo = document.getElementById('catalogFilterTipo');
    const catalogFilterEstado = document.getElementById('catalogFilterEstado');
    const catalogResetFiltersBtn = document.getElementById('catalogResetFiltersBtn');
    const catalogApplyFiltersBtn = document.getElementById('catalogApplyFiltersBtn');
    
    const catalogGrid = document.getElementById('catalogGrid');
    const catalogNoResults = document.getElementById('catalogNoResults');

    // === CARGAR ESPECIFICACIONES ===
    async function loadEquipmentSpecs() {
        try {
            const response = await fetch('equipment-specs.json');
            equipmentSpecsDB = await response.json();
            allEquipments = equipmentSpecsDB.equipments || [];
            
            console.log('✅ Equipment specs cargadas:', allEquipments.length, 'equipos');
            
            // Poblar selectores
            populateFilterSelects();
            
            // Mostrar todos los equipos inicialmente
            filteredEquipments = [...allEquipments];
            renderEquipmentCards();
        } catch (err) {
            console.error('❌ Error cargando equipment specs:', err);
            catalogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f00; padding: 40px;">Error cargando catálogo de equipos</div>';
        }
    }

    // === POBLAR SELECTORES DE FILTROS ===
    function populateFilterSelects() {
        // Poblar Marca
        if (equipmentSpecsDB.marcas) {
            equipmentSpecsDB.marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca;
                option.textContent = marca;
                catalogFilterMarca.appendChild(option);
            });
        }

        // Poblar Tipo
        if (equipmentSpecsDB.tipos) {
            equipmentSpecsDB.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                catalogFilterTipo.appendChild(option);
            });
        }
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
                    equipo.id.toUpperCase().includes(currentFilters.search) ||
                    equipo.modelo.toUpperCase().includes(currentFilters.search) ||
                    equipo.marca.toUpperCase().includes(currentFilters.search) ||
                    equipo.descripcion.toUpperCase().includes(currentFilters.search);
                
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
                <div class="equipment-badge">
                    ${equipo.ano_lanzamiento}
                </div>
            </div>

            <div class="equipment-type">${equipo.tipo}</div>

            <div class="equipment-description">${equipo.descripcion}</div>

            <div class="equipment-stats">
                <div class="stat-box">
                    <div class="stat-label">Aplicaciones</div>
                    <div class="stat-value">${equipo.aplicaciones.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Norma</div>
                    <div class="stat-value">${equipo.norma}</div>
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
                                <div style="color: #aaa;">Año de Lanzamiento</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.ano_lanzamiento}</div>
                            </div>
                            <div style="grid-column: 1/-1;">
                                <div style="color: #aaa;">Norma / Certificación</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.norma}</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">📋 Descripción</h3>
                        <div style="color: #ccc; line-height: 1.6;">${equipo.descripcion}</div>
                    </div>

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

                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">📱 Aplicaciones</h3>
                        <div class="applications">
                            ${equipo.aplicaciones.map(app => `
                                <span class="app-tag">${app}</span>
                            `).join('')}
                        </div>
                    </div>

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
        loadEquipmentSpecs();
    });

    console.log('✅ Catalog-standalone.js cargado');
})();
