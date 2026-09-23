// ============================================
// CATÁLOGO DE EQUIPOS - FUNCIONALIDAD
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
    const openCatalogBtn = document.getElementById('openCatalogBtn');
    const closeCatalogBtn = document.getElementById('closeCatalogBtn');
    const catalogSection = document.getElementById('catalogSection');
    
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

            // Filtro Estado (si existe en datos globales)
            if (currentFilters.estado) {
                const isVerified = checkEquipoVerificado(equipo.id);
                
                if (currentFilters.estado === 'verificado' && !isVerified) {
                    return false;
                }
                if (currentFilters.estado === 'no-verificado' && isVerified) {
                    return false;
                }
            }

            return true;
        });

        renderEquipmentCards();
    }

    // === VERIFICAR SI EQUIPO ESTÁ VERIFICADO ===
    function checkEquipoVerificado(equipoId) {
        // Buscar en globalDataRaw si existe
        if (typeof globalDataRaw !== 'undefined' && globalDataRaw.length > 0) {
            const found = globalDataRaw.find(row => 
                String(row['ID'] || '').toUpperCase() === equipoId.toUpperCase() ||
                String(row['Serie'] || '').toUpperCase() === equipoId.toUpperCase()
            );
            
            if (found && found['Verificado'] === '✅') {
                return true;
            }
        }
        return false;
    }

    // === RENDERIZAR TARJETAS DE EQUIPOS ===
    function renderEquipmentCards() {
        catalogGrid.innerHTML = '';

        if (filteredEquipments.length === 0) {
            catalogNoResults.classList.remove('hidden');
            return;
        }

        catalogNoResults.classList.add('hidden');

        filteredEquipments.forEach(equipo => {
            const card = createEquipmentCard(equipo);
            catalogGrid.appendChild(card);
        });
    }

    // === CREAR TARJETA DE EQUIPO ===
    function createEquipmentCard(equipo) {
        const isVerified = checkEquipoVerificado(equipo.id);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid rgba(0,217,255,0.2);
        `;
        card.onmouseover = () => {
            card.style.borderColor = '#00d9ff';
            card.style.boxShadow = '0 5px 20px rgba(0,217,255,0.2)';
        };
        card.onmouseout = () => {
            card.style.borderColor = 'rgba(0,217,255,0.2)';
            card.style.boxShadow = 'none';
        };

        // Estado Verificación
        const statusBadge = isVerified 
            ? '<span style="background: rgba(0,255,136,0.2); color: #00ff88; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">✅ VERIFICADO</span>'
            : '<span style="background: rgba(255,200,0,0.2); color: #ffc800; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">⚠️ NO VERIFICADO</span>';

        const html = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <div style="flex: 1;">
                    <div style="color: #aaa; font-size: 0.8rem; margin-bottom: 4px;">ID: ${equipo.id}</div>
                    <h3 style="color: #00d9ff; font-size: 1.2rem; margin: 0 0 4px 0;">${equipo.modelo}</h3>
                    <div style="color: #888; font-size: 0.9rem;">${equipo.marca}</div>
                </div>
                ${statusBadge}
            </div>

            <div style="background: rgba(0,217,255,0.1); padding: 8px; border-radius: 6px;">
                <div style="color: #00d9ff; font-size: 0.85rem; font-weight: 600;">${equipo.tipo}</div>
                <div style="color: #aaa; font-size: 0.8rem; margin-top: 2px;">${equipo.descripcion}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
                <div style="background: rgba(0,255,136,0.1); padding: 8px; border-radius: 4px;">
                    <div style="color: #00ff88; font-weight: 600;">Aplicaciones</div>
                    <div style="color: #aaa; font-size: 0.75rem; margin-top: 2px;">
                        ${equipo.aplicaciones.slice(0, 2).join(', ')}
                    </div>
                </div>
                <div style="background: rgba(79,172,254,0.1); padding: 8px; border-radius: 4px;">
                    <div style="color: #4facfe; font-weight: 600;">Norma</div>
                    <div style="color: #aaa; font-size: 0.75rem; margin-top: 2px;">${equipo.norma}</div>
                </div>
            </div>

            <div style="color: #888; font-size: 0.8rem; text-align: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                Haz clic para ver detalles técnicos
            </div>
        `;

        card.innerHTML = html;
        card.addEventListener('click', () => showEquipmentDetails(equipo));

        return card;
    }

    // === MOSTRAR DETALLES DEL EQUIPO ===
    function showEquipmentDetails(equipo) {
        const isVerified = checkEquipoVerificado(equipo.id);

        const detailsHTML = `
            <div class="modal-overlay" id="equipmentDetailsModal">
                <div class="modal" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <h2 style="margin: 0 0 4px 0; color: #00d9ff;">${equipo.modelo}</h2>
                            <div style="color: #888; font-size: 0.9rem;">${equipo.marca} | ${equipo.tipo}</div>
                        </div>
                        <button id="closeDetailsBtn" style="background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; padding: 0;">✕</button>
                    </div>

                    <div style="background: rgba(0,217,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem;">
                            <div>
                                <div style="color: #aaa;">ID del Equipo</div>
                                <div style="color: #00ff88; font-weight: 600;">${equipo.id}</div>
                            </div>
                            <div>
                                <div style="color: #aaa;">Estado</div>
                                <div style="color: ${isVerified ? '#00ff88' : '#ffc800'}; font-weight: 600;">
                                    ${isVerified ? '✅ Verificado' : '⚠️ No verificado'}
                                </div>
                            </div>
                            <div>
                                <div style="color: #aaa;">Año de Lanzamiento</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.ano_lanzamiento}</div>
                            </div>
                            <div>
                                <div style="color: #aaa;">Norma</div>
                                <div style="color: #00d9ff; font-weight: 600;">${equipo.norma}</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ff88; margin-top: 0;">📋 Descripción</h3>
                        <div style="color: #ccc; line-height: 1.6;">${equipo.descripcion}</div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ff88;">⚙️ Parámetros Técnicos</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            ${Object.entries(equipo.parametros_tecnicos).map(([key, value]) => `
                                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border-left: 3px solid #00d9ff;">
                                    <div style="color: #aaa; font-size: 0.8rem; text-transform: uppercase;">${key.replace(/_/g, ' ')}</div>
                                    <div style="color: #00d9ff; font-weight: 600; margin-top: 4px;">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ff88;">🔧 Funcionamiento y Procedimientos</h3>
                        <div style="display: grid; gap: 12px;">
                            ${Object.entries(equipo.funcionamiento).map(([key, value]) => `
                                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px;">
                                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 6px; text-transform: capitalize;">${key}</div>
                                    <div style="color: #ccc; line-height: 1.6; font-size: 0.9rem;">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #00ff88;">📱 Aplicaciones</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${equipo.aplicaciones.map(app => `
                                <span style="background: rgba(0,255,136,0.2); color: #00ff88; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;">
                                    ${app}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <div id="equipmentImagesSection" style="margin-bottom: 20px; display: none;">
                        <h3 style="color: #00ff88;">📸 Imágenes Registradas</h3>
                        <div id="equipmentImagesGallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;"></div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button id="searchManufacturerBtn" class="btn btn-primary" style="flex: 1;">🔍 Buscar Especificaciones Online</button>
                        <button id="closeDetailsModalBtn" class="btn btn-secondary" style="flex: 1;">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        // Crear modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = detailsHTML;
        document.body.appendChild(modalContainer);

        const modal = document.getElementById('equipmentDetailsModal');
        const closeBtn = document.getElementById('closeDetailsBtn');
        const closeModalBtn = document.getElementById('closeDetailsModalBtn');
        const searchManufacturerBtn = document.getElementById('searchManufacturerBtn');

        closeBtn.addEventListener('click', () => modal.remove());
        closeModalBtn.addEventListener('click', () => modal.remove());

        // Cargar imágenes del equipo si existen
        loadEquipmentImages(equipo.id);

        // Buscar especificaciones online
        searchManufacturerBtn.addEventListener('click', () => {
            searchManufacturerSpecs(equipo);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // === CARGAR IMÁGENES DEL EQUIPO ===
    async function loadEquipmentImages(equipoId) {
        try {
            if (typeof globalDataRaw === 'undefined' || !globalDataRaw) return;

            const equipo = globalDataRaw.find(row => 
                String(row['ID'] || '').toUpperCase() === equipoId.toUpperCase()
            );

            if (!equipo) return;

            if (typeof getAllImagesFromDB === 'undefined') return;

            const allImages = await getAllImagesFromDB();
            const equipoImages = allImages.filter(img => img.id.includes(equipoId));

            if (equipoImages.length === 0) return;

            const section = document.getElementById('equipmentImagesSection');
            const gallery = document.getElementById('equipmentImagesGallery');

            section.style.display = 'block';
            gallery.innerHTML = '';

            equipoImages.forEach((img, idx) => {
                const imgEl = document.createElement('img');
                imgEl.src = img.dataUrl;
                imgEl.style.cssText = `
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 8px;
                    cursor: pointer;
                    border: 2px solid rgba(0,217,255,0.3);
                    transition: all 0.3s;
                `;
                imgEl.onmouseover = () => imgEl.style.borderColor = '#00d9ff';
                imgEl.onmouseout = () => imgEl.style.borderColor = 'rgba(0,217,255,0.3)';
                
                imgEl.addEventListener('click', () => {
                    // Mostrar imagen en visor
                    const viewer = document.createElement('div');
                    viewer.className = 'modal-overlay';
                    viewer.style.background = 'rgba(0,0,0,0.95)';
                    viewer.innerHTML = `
                        <div style="position: relative; width: 90%; max-width: 800px; height: 80vh;">
                            <img src="${img.dataUrl}" style="width: 100%; height: 100%; object-fit: contain;">
                            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer;">✕</button>
                        </div>
                    `;
                    document.body.appendChild(viewer);
                    viewer.addEventListener('click', (e) => {
                        if (e.target === viewer) viewer.remove();
                    });
                });

                gallery.appendChild(imgEl);
            });
        } catch (err) {
            console.error('Error cargando imágenes:', err);
        }
    }

    // === BUSCAR ESPECIFICACIONES DEL FABRICANTE ===
    function searchManufacturerSpecs(equipo) {
        const query = `${equipo.marca} ${equipo.modelo} especificaciones técnicas`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank');
    }

    // === EVENT LISTENERS ===
    openCatalogBtn.addEventListener('click', () => {
        catalogSection.classList.remove('hidden');
        catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        if (allEquipments.length === 0) {
            loadEquipmentSpecs();
        }
    });

    closeCatalogBtn.addEventListener('click', () => {
        catalogSection.classList.add('hidden');
    });

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
    console.log('✅ Catalog.js cargado');
})();
