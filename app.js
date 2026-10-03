/**
 * MindFlow - Interactive Mind Mapping Web Application
 * Vanilla HTML5, CSS3, JavaScript (ES6+)
 */

// Global State
const state = {
    tree: null,
    mapLibrary: [],
    currentMapId: null,
    selectedNodeId: null,
    transform: { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2, scale: 1.0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    draggedNodeId: null,
    dropTargetId: null,
    undoStack: [],
    redoStack: [],
    searchQuery: '',
    searchMatches: [],
    currentMatchIndex: 0,
    layoutStyle: 'mindmap', // Options: 'mindmap', 'balanced', 'right', 'left', 'org', 'bubble'
    lineStyle: 'curve' // Options: 'curve', 'straight', 'dashed', 'organic'
};

// Preset Templates
const TEMPLATES = {
    project: {
        id: 'root',
        text: '🚀 Product Launch Strategy',
        color: '#4f46e5',
        collapsed: false,
        children: [
            {
                id: 'p1',
                text: '🎯 Market Research',
                color: '#06b6d4',
                children: [
                    { id: 'p1_1', text: 'Competitor Analysis', status: 'done' },
                    { id: 'p1_2', text: 'User Surveys & Feedback', status: 'in-progress' },
                    { id: 'p1_3', text: 'Target Persona Mapping', status: 'todo' }
                ]
            },
            {
                id: 'p2',
                text: '💻 Engineering & Dev',
                color: '#10b981',
                children: [
                    { id: 'p2_1', text: 'Frontend UI/UX Polish', status: 'in-progress' },
                    { id: 'p2_2', text: 'API Integration & Auth', status: 'done' },
                    { id: 'p2_3', text: 'Load Testing & QA', status: 'todo' }
                ]
            },
            {
                id: 'p3',
                text: '📣 Marketing & PR',
                color: '#f59e0b',
                children: [
                    { id: 'p3_1', text: 'Social Media Campaign' },
                    { id: 'p3_2', text: 'Email Newsletter Blast' },
                    { id: 'p3_3', text: 'Press Release Draft' }
                ]
            },
            {
                id: 'p4',
                text: '📊 Sales & Operations',
                color: '#ec4899',
                children: [
                    { id: 'p4_1', text: 'Pricing Tiers Setup' },
                    { id: 'p4_2', text: 'Customer Support Desk' }
                ]
            }
        ]
    },
    brainstorm: {
        id: 'root',
        text: '💡 New App Concept',
        color: '#f59e0b',
        children: [
            {
                id: 'b1',
                text: '🔥 Core Features',
                color: '#ef4444',
                children: [
                    { id: 'b1_1', text: 'Real-time Sync' },
                    { id: 'b1_2', text: 'AI Text Assistant' },
                    { id: 'b1_3', text: 'Dark Mode UI' }
                ]
            },
            {
                id: 'b2',
                text: '💰 Monetization',
                color: '#10b981',
                children: [
                    { id: 'b2_1', text: 'Freemium Tier' },
                    { id: 'b2_2', text: 'Enterprise License' }
                ]
            },
            {
                id: 'b3',
                text: '🎨 Design Philosophy',
                color: '#8b5cf6',
                children: [
                    { id: 'b3_1', text: 'Minimalist Layout' },
                    { id: 'b3_2', text: 'Keyboard-First Operations' }
                ]
            }
        ]
    },
    architecture: {
        id: 'root',
        text: '🌐 Modern Web App Architecture',
        color: '#06b6d4',
        children: [
            {
                id: 'a1',
                text: '🖥️ Client Frontend',
                color: '#4f46e5',
                children: [
                    { id: 'a1_1', text: 'HTML5 / CSS3 / Vanilla JS' },
                    { id: 'a1_2', text: 'SVG Dynamic Rendering' },
                    { id: 'a1_3', text: 'Local Engine State' }
                ]
            },
            {
                id: 'a2',
                text: '⚙️ Backend Services',
                color: '#10b981',
                children: [
                    { id: 'a2_1', text: 'REST API Endpoints' },
                    { id: 'a2_2', text: 'WebSockets Server' },
                    { id: 'a2_3', text: 'JWT Token Security' }
                ]
            },
            {
                id: 'a3',
                text: '🗄️ Database & Storage',
                color: '#ec4899',
                children: [
                    { id: 'a3_1', text: 'PostgreSQL Relational DB' },
                    { id: 'a3_2', text: 'Redis In-Memory Cache' },
                    { id: 'a3_3', text: 'S3 Object Bucket' }
                ]
            }
        ]
    },
    goals: {
        id: 'root',
        text: '🎯 Personal Growth Roadmap',
        color: '#8b5cf6',
        children: [
            {
                id: 'g1',
                text: '📚 Skill Acquisition',
                color: '#06b6d4',
                children: [
                    { id: 'g1_1', text: 'Master System Design' },
                    { id: 'g1_2', text: 'Learn Modern Web APIs' }
                ]
            },
            {
                id: 'g2',
                text: '💪 Health & Wellbeing',
                color: '#10b981',
                children: [
                    { id: 'g2_1', text: 'Daily 30-min Exercise' },
                    { id: 'g2_2', text: '8 Hours Sleep Hygiene' }
                ]
            },
            {
                id: 'g3',
                text: '💼 Career Progression',
                color: '#f59e0b',
                children: [
                    { id: 'g3_1', text: 'Build Open Source Portfolio' },
                    { id: 'g3_2', text: 'Network with Tech Community' }
                ]
            }
        ]
    }
};

// Helper: Generate Unique ID
function generateId() {
    return 'node_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function generateMapId() {
    return 'map_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Helper: Deep Clone Object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Push State to Undo Stack
function saveSnapshot() {
    state.undoStack.push(deepClone(state.tree));
    if (state.undoStack.length > 30) state.undoStack.shift();
    state.redoStack = []; // Clear redo stack on new action
}

// Undo Action
function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(deepClone(state.tree));
    state.tree = state.undoStack.pop();
    renderMap();
    saveToLocalStorage();
    showToast('Undo performed');
}

// Redo Action
function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(deepClone(state.tree));
    state.tree = state.redoStack.pop();
    renderMap();
    saveToLocalStorage();
    showToast('Redo performed');
}

// Save to LocalStorage
function saveToLocalStorage() {
    try {
        if (!state.currentMapId || !state.tree) return;

        let currentMap = state.mapLibrary.find(map => map.id === state.currentMapId);
        if (!currentMap) {
            currentMap = { id: state.currentMapId };
            state.mapLibrary.push(currentMap);
        }

        currentMap.title = document.getElementById('map-title-input').value.trim() || 'Untitled Mind Map';
        currentMap.tree = deepClone(state.tree);
        currentMap.layoutStyle = state.layoutStyle;
        currentMap.lineStyle = state.lineStyle;
        currentMap.updatedAt = Date.now();
        state.mapLibrary.sort((a, b) => b.updatedAt - a.updatedAt);

        localStorage.setItem('mindflow_maps', JSON.stringify(state.mapLibrary));
        localStorage.setItem('mindflow_current_map', state.currentMapId);
        localStorage.setItem('mindflow_tree', JSON.stringify(state.tree));
        localStorage.setItem('mindflow_title', currentMap.title);
        localStorage.setItem('mindflow_layout', state.layoutStyle);
        localStorage.setItem('mindflow_line_style', state.lineStyle);
        document.getElementById('save-status').innerHTML = '<i class="fa-solid fa-cloud-check"></i> Saved';
    } catch (e) {
        console.warn('LocalStorage save failed', e);
    }
}

// Load from LocalStorage
function loadFromLocalStorage() {
    try {
        const savedMaps = localStorage.getItem('mindflow_maps');
        if (savedMaps) {
            const maps = JSON.parse(savedMaps);
            if (Array.isArray(maps)) {
                state.mapLibrary = maps.filter(map => map && map.id && map.tree);
            }
        }

        if (state.mapLibrary.length > 0) {
            const savedMapId = localStorage.getItem('mindflow_current_map');
            const currentMap = state.mapLibrary.find(map => map.id === savedMapId) || state.mapLibrary[0];
            state.currentMapId = currentMap.id;
            state.tree = deepClone(currentMap.tree);
            document.getElementById('map-title-input').value = currentMap.title || 'Untitled Mind Map';
            state.layoutStyle = currentMap.layoutStyle || 'mindmap';
            state.lineStyle = currentMap.lineStyle || 'curve';
            localStorage.setItem('mindflow_current_map', state.currentMapId);
            return true;
        }

        const savedTree = localStorage.getItem('mindflow_tree');
        const savedTitle = localStorage.getItem('mindflow_title');
        const savedLayout = localStorage.getItem('mindflow_layout');
        const savedLineStyle = localStorage.getItem('mindflow_line_style');
        if (savedTitle) {
            document.getElementById('map-title-input').value = savedTitle;
        }
        if (savedLayout) {
            state.layoutStyle = savedLayout;
        }
        if (savedLineStyle) {
            state.lineStyle = savedLineStyle;
        }
        if (savedTree) {
            state.tree = JSON.parse(savedTree);
            state.currentMapId = generateMapId();
            state.mapLibrary = [{
                id: state.currentMapId,
                title: savedTitle || 'Untitled Mind Map',
                tree: deepClone(state.tree),
                layoutStyle: state.layoutStyle,
                lineStyle: state.lineStyle,
                updatedAt: Date.now()
            }];
            saveToLocalStorage();
            return true;
        }
    } catch (e) {
        console.warn('LocalStorage load failed', e);
    }
    return false;
}

function setMapStyleSelections() {
    document.querySelectorAll('#style-menu button[data-layout]').forEach(btn => {
        const isActive = btn.getAttribute('data-layout') === state.layoutStyle;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    document.querySelectorAll('#line-style-menu button[data-line-style]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-line-style') === state.lineStyle);
    });
}

function createMapThumbnail(map) {
    const tree = deepClone(map.tree);
    const previousLayout = state.layoutStyle;
    state.layoutStyle = map.layoutStyle || 'mindmap';
    calculateLayout(tree);
    state.layoutStyle = previousLayout;

    const nodes = flattenTree(tree).filter(node => Number.isFinite(node.x) && Number.isFinite(node.y));
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const width = 360;
    const height = 148;
    const padding = 24;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'recent-thumbnail-svg');
    svg.setAttribute('aria-hidden', 'true');

    const minX = Math.min(...nodes.map(node => node.x));
    const maxX = Math.max(...nodes.map(node => node.x));
    const minY = Math.min(...nodes.map(node => node.y));
    const maxY = Math.max(...nodes.map(node => node.y));
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
    const offsetX = (width - spanX * scale) / 2;
    const offsetY = (height - spanY * scale) / 2;
    const position = node => ({
        x: offsetX + (node.x - minX) * scale,
        y: offsetY + (node.y - minY) * scale
    });

    function addConnections(parent) {
        (parent.children || []).forEach(child => {
            const parentPosition = position(parent);
            const childPosition = position(child);
            if (nodeById.has(parent.id) && nodeById.has(child.id)) {
                const path = document.createElementNS(svg.namespaceURI, 'path');
                const middleX = (parentPosition.x + childPosition.x) / 2;
                path.setAttribute('d', `M ${parentPosition.x} ${parentPosition.y} C ${middleX} ${parentPosition.y}, ${middleX} ${childPosition.y}, ${childPosition.x} ${childPosition.y}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', parent.color || '#64748b');
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('stroke-opacity', '0.55');
                svg.appendChild(path);
            }
            if (!parent.collapsed) addConnections(child);
        });
    }

    addConnections(tree);
    nodes.forEach(node => {
        const point = position(node);
        const nodeWidth = node.depth === 0 ? 18 : node.depth === 1 ? 13 : 9;
        const nodeHeight = node.depth === 0 ? 9 : 6;
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.setAttribute('x', point.x - nodeWidth / 2);
        rect.setAttribute('y', point.y - nodeHeight / 2);
        rect.setAttribute('width', nodeWidth);
        rect.setAttribute('height', nodeHeight);
        rect.setAttribute('rx', nodeHeight / 2);
        rect.setAttribute('fill', node.color || (node.depth === 0 ? '#6366f1' : '#64748b'));
        rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.65)');
        rect.setAttribute('stroke-width', '0.8');
        svg.appendChild(rect);
    });

    return svg;
}

function countMapNodes(node) {
    return 1 + (node.children || []).reduce((count, child) => count + countMapNodes(child), 0);
}

function renderRecentMaps() {
    const list = document.getElementById('recent-map-list');
    const count = document.getElementById('recent-map-count');
    const maps = [...state.mapLibrary].sort((a, b) => b.updatedAt - a.updatedAt);
    count.textContent = `${maps.length} ${maps.length === 1 ? 'map' : 'maps'}`;
    list.innerHTML = '';

    if (maps.length === 0) {
        list.innerHTML = '<div class="recent-empty"><i class="fa-regular fa-folder-open"></i><strong>No recent maps</strong><span>Your new maps will appear here.</span></div>';
        return;
    }

    const layoutDetails = {
        mindmap: { label: 'Classic Mind Map', icon: 'fa-sitemap' },
        balanced: { label: 'Balanced Mind Map', icon: 'fa-diagram-project' },
        bubble: { label: 'Bubble Map', icon: 'fa-circle-nodes' },
        right: { label: 'Right Logic Chart', icon: 'fa-arrow-right' },
        left: { label: 'Left Logic Chart', icon: 'fa-arrow-left' },
        org: { label: 'Org Chart', icon: 'fa-network-wired' }
    };

    maps.forEach(map => {
        const card = document.createElement('article');
        card.className = 'recent-map-card';
        card.dataset.mapId = map.id;

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'recent-map-open-button';

        const thumbnail = document.createElement('span');
        thumbnail.className = 'recent-map-thumbnail';
        thumbnail.appendChild(createMapThumbnail(map));

        const content = document.createElement('span');
        content.className = 'recent-map-card-content';
        const title = document.createElement('span');
        title.className = 'recent-map-title';
        title.textContent = map.title || 'Untitled Mind Map';
        const preview = document.createElement('span');
        preview.className = 'recent-map-preview';
        preview.textContent = map.tree.text || 'No central topic';
        content.append(title, preview);

        const footer = document.createElement('span');
        footer.className = 'recent-map-card-footer';
        const meta = document.createElement('span');
        meta.className = 'recent-map-meta';
        const layout = layoutDetails[map.layoutStyle] || layoutDetails.mindmap;
        const layoutLabel = document.createElement('span');
        layoutLabel.className = 'recent-map-layout';
        layoutLabel.innerHTML = `<i class="fa-solid ${layout.icon}"></i><span>${layout.label}</span>`;
        const nodeCount = document.createElement('span');
        nodeCount.textContent = `${countMapNodes(map.tree)} nodes`;
        const modified = document.createElement('time');
        const updatedAt = Number(map.updatedAt) || Date.now();
        modified.dateTime = new Date(updatedAt).toISOString();
        modified.textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(updatedAt);
        meta.append(layoutLabel, nodeCount, modified);

        const openIcon = document.createElement('i');
        openIcon.className = 'fa-solid fa-chevron-right recent-map-open';
        footer.append(meta, openIcon);

        openButton.setAttribute('aria-label', `Open ${map.title || 'Untitled Mind Map'}`);
        openButton.append(thumbnail, content, footer);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'recent-map-delete';
        deleteButton.dataset.deleteMapId = map.id;
        deleteButton.setAttribute('aria-label', `Delete ${map.title || 'Untitled Mind Map'}`);
        deleteButton.title = 'Delete map';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fa-solid fa-trash-can';
        deleteButton.appendChild(deleteIcon);

        card.append(openButton, deleteButton);
        list.appendChild(card);
    });
}

function deleteRecentMap(mapId) {
    const map = state.mapLibrary.find(item => item.id === mapId);
    if (!map) return;

    const title = map.title || 'Untitled Mind Map';
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const deletedCurrentMap = state.currentMapId === mapId;
    state.mapLibrary = state.mapLibrary.filter(item => item.id !== mapId);
    if (deletedCurrentMap) state.currentMapId = null;

    try {
        if (state.mapLibrary.length === 0) {
            ['mindflow_maps', 'mindflow_current_map', 'mindflow_tree', 'mindflow_title', 'mindflow_layout', 'mindflow_line_style'].forEach(key => {
                localStorage.removeItem(key);
            });
        } else {
            localStorage.setItem('mindflow_maps', JSON.stringify(state.mapLibrary));
            if (deletedCurrentMap) localStorage.removeItem('mindflow_current_map');
        }
    } catch (e) {
        console.warn('Recent map delete could not be saved', e);
        showToast('Map removed until this page is reloaded');
        renderRecentMaps();
        return;
    }

    renderRecentMaps();
    showToast('Map deleted');
}

function openMapDocument(mapId) {
    if (state.currentMapId) saveToLocalStorage();
    const map = state.mapLibrary.find(item => item.id === mapId);
    if (!map) return;

    state.currentMapId = map.id;
    state.tree = deepClone(map.tree);
    state.layoutStyle = map.layoutStyle || 'mindmap';
    state.lineStyle = map.lineStyle || 'curve';
    state.selectedNodeId = state.tree.id;
    state.undoStack = [];
    state.redoStack = [];
    state.searchQuery = '';
    state.searchMatches = [];
    state.currentMatchIndex = 0;
    document.getElementById('map-title-input').value = map.title || 'Untitled Mind Map';
    document.getElementById('search-input').value = '';
    document.getElementById('search-count').textContent = '';
    document.body.classList.remove('home-screen-active');
    setMapStyleSelections();
    renderMap();
    fitView();
    saveToLocalStorage();
}

function createMapDocument(tree, title) {
    state.currentMapId = generateMapId();
    state.tree = deepClone(tree);
    state.layoutStyle = 'mindmap';
    state.lineStyle = 'curve';
    state.selectedNodeId = state.tree.id;
    state.undoStack = [];
    state.redoStack = [];
    state.searchQuery = '';
    state.searchMatches = [];
    state.currentMatchIndex = 0;
    document.getElementById('map-title-input').value = title || 'Untitled Mind Map';
    document.getElementById('search-input').value = '';
    document.getElementById('search-count').textContent = '';
    state.mapLibrary.push({
        id: state.currentMapId,
        title: title || 'Untitled Mind Map',
        tree: deepClone(state.tree),
        layoutStyle: state.layoutStyle,
        lineStyle: state.lineStyle,
        updatedAt: Date.now()
    });
    document.body.classList.remove('home-screen-active');
    document.getElementById('templates-modal').classList.remove('active');
    setMapStyleSelections();
    renderMap();
    fitView();
    saveToLocalStorage();
}

function showHomeScreen() {
    if (state.currentMapId) saveToLocalStorage();
    document.body.classList.add('home-screen-active');
    renderRecentMaps();
}

// Initialize Application
function initApp() {
    if (!loadFromLocalStorage()) {
        state.tree = deepClone(TEMPLATES.project);
    }

    state.selectedNodeId = state.tree.id;

    setMapStyleSelections();
    setupEventListeners();
    window.addEventListener('beforeunload', event => {
        if (state.mapLibrary.length === 0) return;
        event.preventDefault();
        event.returnValue = '';
    });
    window.addEventListener('pagehide', downloadBackup);
    updateViewportTransform();
    renderMap();
    document.body.classList.add('home-screen-active');
    renderRecentMaps();
}

// Layout Calculation Engine (Multi-Style Layout Engine)
function calculateLayout(root) {
    const LEVEL_GAP = 220; // Horizontal distance between levels
    const SIBLING_GAP = 55; // Vertical spacing between nodes
    const layout = state.layoutStyle || 'balanced';

    // Assign layout metadata to root
    root.x = 0;
    root.y = 0;
    root.depth = 0;
    root.side = 'root';

    if (!root.children || root.children.length === 0 || root.collapsed) {
        return;
    }

    // 1. Organizational Chart (Top-Down Vertical Layout)
    if (layout === 'org') {
        const SIBLING_GAP_H = 160;
        const LEVEL_GAP_V = 130;

        function positionSubtreeVertical(node, depth, currentX) {
            node.depth = depth;
            node.side = 'org';
            node.y = depth * LEVEL_GAP_V;

            if (!node.children || node.children.length === 0 || node.collapsed) {
                node.x = currentX + SIBLING_GAP_H / 2;
                return SIBLING_GAP_H;
            }

            let startX = currentX;
            let childrenTotalWidth = 0;

            node.children.forEach(child => {
                const w = positionSubtreeVertical(child, depth + 1, currentX + childrenTotalWidth);
                childrenTotalWidth += w;
            });

            node.x = startX + childrenTotalWidth / 2;
            return childrenTotalWidth;
        }

        function getWidth(n) {
            if (!n.children || n.children.length === 0 || n.collapsed) return SIBLING_GAP_H;
            let tw = 0;
            n.children.forEach(c => tw += getWidth(c));
            return Math.max(SIBLING_GAP_H, tw);
        }

        let totalWidth = 0;
        root.children.forEach(child => totalWidth += getWidth(child));

        let currentX = -totalWidth / 2;
        root.children.forEach(child => {
            const w = positionSubtreeVertical(child, 1, currentX);
            currentX += w;
        });

        return;
    }

    // 2. Classic Mind Map Layout (central root, organic main branches)
    if (layout === 'mindmap') {
        const N = Math.max(1, root.children.length);
        const R1 = 240;
        const R2 = 420;
        const R3 = 620;

        root.children.forEach((child, i) => {
            const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
            child.depth = 1;
            child.side = Math.cos(angle) >= 0 ? 'right' : 'left';
            child.angle = angle;
            child.x = Math.cos(angle) * R1;
            child.y = Math.sin(angle) * R1;

            if (child.children && !child.collapsed) {
                const K = child.children.length;
                const arcSpan = Math.min(Math.PI * 0.9, (2 * Math.PI) / Math.max(1, N));
                const startAngle = angle - arcSpan / 2;
                const angleStep = K > 1 ? arcSpan / (K - 1) : 0;

                child.children.forEach((sub, j) => {
                    const subAngle = K === 1 ? angle : startAngle + j * angleStep;
                    sub.depth = 2;
                    sub.side = Math.cos(subAngle) >= 0 ? 'right' : 'left';
                    sub.angle = subAngle;
                    sub.x = child.x + Math.cos(subAngle) * R2 * 0.82;
                    sub.y = child.y + Math.sin(subAngle) * R2 * 0.82;

                    if (sub.children && !sub.collapsed) {
                        const K3 = sub.children.length;
                        const arc3 = Math.PI * 0.5;
                        const start3 = subAngle - arc3 / 2;
                        const step3 = K3 > 1 ? arc3 / (K3 - 1) : 0;
                        sub.children.forEach((g3, k3) => {
                            const a3 = K3 === 1 ? subAngle : start3 + k3 * step3;
                            g3.depth = 3;
                            g3.side = Math.cos(a3) >= 0 ? 'right' : 'left';
                            g3.x = sub.x + Math.cos(a3) * R3 * 0.48;
                            g3.y = sub.y + Math.sin(a3) * R3 * 0.48;
                        });
                    }
                });
            }
        });

        return;
    }

    // 3. 360-Degree Radial Bubble Layout
    if (layout === 'bubble') {
        const N = root.children.length;
        const R1 = 250; // Radius for level 1
        const R2 = 440; // Radius for level 2

        root.children.forEach((child, i) => {
            const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
            child.depth = 1;
            child.side = Math.cos(angle) >= 0 ? 'right' : 'left';
            child.angle = angle;
            child.x = Math.cos(angle) * R1;
            child.y = Math.sin(angle) * R1;

            if (child.children && !child.collapsed) {
                const K = child.children.length;
                const arcSpan = Math.min(Math.PI * 0.8, (2 * Math.PI) / N);
                const startAngle = angle - arcSpan / 2;
                const angleStep = K > 1 ? arcSpan / (K - 1) : 0;

                child.children.forEach((sub, j) => {
                    const subAngle = K === 1 ? angle : startAngle + j * angleStep;
                    sub.depth = 2;
                    sub.side = Math.cos(subAngle) >= 0 ? 'right' : 'left';
                    sub.angle = subAngle;
                    sub.x = Math.cos(subAngle) * R2;
                    sub.y = Math.sin(subAngle) * R2;

                    // Level 3+
                    if (sub.children && !sub.collapsed) {
                        const K3 = sub.children.length;
                        const R3 = 620;
                        const arc3 = Math.PI * 0.4;
                        const start3 = subAngle - arc3 / 2;
                        const step3 = K3 > 1 ? arc3 / (K3 - 1) : 0;
                        sub.children.forEach((g3, k3) => {
                            const a3 = K3 === 1 ? subAngle : start3 + k3 * step3;
                            g3.depth = 3;
                            g3.side = Math.cos(a3) >= 0 ? 'right' : 'left';
                            g3.x = Math.cos(a3) * R3;
                            g3.y = Math.sin(a3) * R3;
                        });
                    }
                });
            }
        });

        return;
    }

    // 4. Horizontal Layouts (balanced, right, left)
    const rightChildren = [];
    const leftChildren = [];

    if (layout === 'right') {
        rightChildren.push(...root.children);
    } else if (layout === 'left') {
        leftChildren.push(...root.children);
    } else {
        // Balanced (default 2-side split)
        root.children.forEach((child, index) => {
            if (index % 2 === 0) rightChildren.push(child);
            else leftChildren.push(child);
        });
    }

    function getSubtreeHeight(node) {
        if (!node.children || node.children.length === 0 || node.collapsed) {
            return SIBLING_GAP;
        }
        let total = 0;
        node.children.forEach(child => {
            total += getSubtreeHeight(child);
        });
        return Math.max(SIBLING_GAP, total);
    }

    function positionSubtree(node, side, depth, currentY) {
        node.depth = depth;
        node.side = side;
        const dir = side === 'right' ? 1 : -1;
        node.x = dir * depth * LEVEL_GAP;

        if (!node.children || node.children.length === 0 || node.collapsed) {
            node.y = currentY + SIBLING_GAP / 2;
            return SIBLING_GAP;
        }

        let startY = currentY;
        let childrenTotalHeight = 0;

        node.children.forEach(child => {
            const h = positionSubtree(child, side, depth + 1, currentY + childrenTotalHeight);
            childrenTotalHeight += h;
        });

        node.y = startY + childrenTotalHeight / 2;
        return childrenTotalHeight;
    }

    if (rightChildren.length > 0) {
        let rightTotalHeight = 0;
        rightChildren.forEach(child => rightTotalHeight += getSubtreeHeight(child));
        let currentRightY = -rightTotalHeight / 2;
        rightChildren.forEach(child => {
            const h = positionSubtree(child, 'right', 1, currentRightY);
            currentRightY += h;
        });
    }

    if (leftChildren.length > 0) {
        let leftTotalHeight = 0;
        leftChildren.forEach(child => leftTotalHeight += getSubtreeHeight(child));
        let currentLeftY = -leftTotalHeight / 2;
        leftChildren.forEach(child => {
            const h = positionSubtree(child, 'left', 1, currentLeftY);
            currentLeftY += h;
        });
    }
}

// Flatten Tree into Node Array
function flattenTree(node, result = []) {
    result.push(node);
    if (node.children && !node.collapsed) {
        node.children.forEach(child => flattenTree(child, result));
    }
    return result;
}

// Find Node by ID
function findNode(node, id) {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

// Find Parent Node by Child ID
function findParentNode(current, childId) {
    if (!current.children) return null;
    for (const child of current.children) {
        if (child.id === childId) return current;
        const found = findParentNode(child, childId);
        if (found) return found;
    }
    return null;
}

// Render Map Canvas (Nodes + SVG Connections)
function renderMap() {
    calculateLayout(state.tree);

    const nodesContainer = document.getElementById('nodes-container');
    const svgGroup = document.getElementById('svg-group');

    nodesContainer.innerHTML = '';
    svgGroup.innerHTML = '';

    const allNodes = flattenTree(state.tree);

    // Render Connection SVG Paths first
    renderConnections(state.tree, svgGroup);

    // Render HTML Nodes
    allNodes.forEach(node => {
        const el = createNodeDOM(node);
        nodesContainer.appendChild(el);
    });

    updateInspectorPanel();
}

// Render Connections (SVG Bezier Curves for Horizontal & Vertical Layouts)
function renderConnections(parent, svgGroup) {
    if (!parent.children || parent.children.length === 0 || parent.collapsed) return;

    parent.children.forEach(child => {
        const SVG_OFFSET = 50000;

        let startX = parent.x + SVG_OFFSET;
        let startY = parent.y + SVG_OFFSET;
        let endX = child.x + SVG_OFFSET;
        let endY = child.y + SVG_OFFSET;

        let d = '';

        if (state.layoutStyle === 'org') {
            const dy = Math.abs(endY - startY);
            const controlOffset = Math.max(dy * 0.5, 30);
            const cp1x = startX;
            const cp1y = startY + controlOffset;
            const cp2x = endX;
            const cp2y = endY - controlOffset;
            d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
        } else {
            const isRight = child.side === 'right' || (parent.side === 'root' && child.x >= 0);
            const dx = Math.abs(endX - startX);
            const controlOffset = Math.max(dx * 0.5, 40);
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            if (state.lineStyle === 'straight') {
                d = `M ${startX} ${startY} L ${endX} ${endY}`;
            } else if (state.lineStyle === 'dashed') {
                const cp1x = isRight ? startX + controlOffset : startX - controlOffset;
                const cp1y = startY;
                const cp2x = isRight ? endX - controlOffset : endX + controlOffset;
                const cp2y = endY;
                d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
            } else if (state.lineStyle === 'organic') {
                const qx = isRight ? midX + Math.max(dx * 0.2, 35) : midX - Math.max(dx * 0.2, 35);
                d = `M ${startX} ${startY} Q ${qx} ${midY}, ${endX} ${endY}`;
            } else {
                const cp1x = isRight ? startX + controlOffset : startX - controlOffset;
                const cp1y = startY;
                const cp2x = isRight ? endX - controlOffset : endX + controlOffset;
                const cp2y = endY;
                d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'mindmap-connection-path');
        if (state.lineStyle === 'dashed') {
            path.setAttribute('stroke-dasharray', '8 8');
        }

        if (child.color || parent.color) {
            path.style.stroke = child.color || parent.color;
        }

        if (state.selectedNodeId === child.id || state.selectedNodeId === parent.id) {
            path.classList.add('active');
        }

        svgGroup.appendChild(path);

        renderConnections(child, svgGroup);
    });
}

// Create Node DOM Element
function createNodeDOM(node) {
    const div = document.createElement('div');
    div.className = 'mindmap-node';
    if (state.layoutStyle === 'mindmap') {
        div.classList.add('classic-style');
    }
    if (state.layoutStyle === 'bubble') {
        div.classList.add('bubble-style');
    }
    div.classList.add(`shape-${node.shape === 'circle' ? 'circle' : 'pill'}`);
    div.id = node.id;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    div.setAttribute('draggable', 'true');

    if (node.depth === 0) div.classList.add('root-node');
    if (node.depth === 1) div.classList.add('level-1');
    if (node.id === state.selectedNodeId) div.classList.add('selected');
    if (state.searchMatches.includes(node.id)) div.classList.add('search-matched');

    if (node.color && node.depth > 0) {
        div.style.borderColor = node.color;
    }

    // Emoji Icon
    if (node.emoji) {
        const emojiEl = document.createElement('span');
        emojiEl.className = 'node-emoji';
        emojiEl.textContent = node.emoji;
        div.appendChild(emojiEl);
    }

    // Text Span
    const textEl = document.createElement('span');
    textEl.className = 'node-text';
    textEl.textContent = node.text || 'New Topic';
    div.appendChild(textEl);

    // Status Icon
    if (node.status) {
        const statusEl = document.createElement('span');
        statusEl.className = 'node-status';
        if (node.status === 'done') statusEl.textContent = '🟢';
        else if (node.status === 'in-progress') statusEl.textContent = '🟡';
        else if (node.status === 'todo') statusEl.textContent = '🔴';
        div.appendChild(statusEl);
    }

    // Notes Indicator
    if (node.notes) {
        const notesEl = document.createElement('i');
        notesEl.className = 'fa-solid fa-note-sticky node-notes-icon';
        notesEl.title = node.notes;
        div.appendChild(notesEl);
    }

    // Collapse / Expand Badge Toggle
    if (node.children && node.children.length > 0) {
        const toggle = document.createElement('div');
        toggle.className = 'node-collapse-toggle';
        toggle.classList.add(node.side === 'left' ? 'left-side' : 'right-side');
        toggle.textContent = node.collapsed ? `+${node.children.length}` : '−';
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCollapseNode(node.id);
        });
        div.appendChild(toggle);
    }

    // Node Quick Action Hover Handles (Add Sub-topic & Add Sibling)
    const hoverActionsDiv = document.createElement('div');
    hoverActionsDiv.className = 'node-hover-actions';

    // 1. Add Sub-topic Handle
    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'node-action-handle action-add-child top-handle';
    addChildBtn.title = 'Add Sub-topic (+Child)';
    addChildBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span class="handle-tooltip">Sub-topic</span>';

    ['pointerdown', 'mousedown', 'click'].forEach(evtType => {
        addChildBtn.addEventListener(evtType, (e) => {
            e.stopPropagation();
            if (evtType === 'click') {
                e.preventDefault();
                addChildNode(node.id);
            }
        });
    });
    hoverActionsDiv.appendChild(addChildBtn);

    // 2. Add Sibling Handle
    const addSiblingBtn = document.createElement('button');
    addSiblingBtn.className = 'node-action-handle action-add-sibling bottom-handle';
    addSiblingBtn.title = 'Add Sibling (+Sibling)';
    addSiblingBtn.innerHTML = '<i class="fa-solid fa-diagram-next"></i><span class="handle-tooltip">Sibling</span>';

    ['pointerdown', 'mousedown', 'click'].forEach(evtType => {
        addSiblingBtn.addEventListener(evtType, (e) => {
            e.stopPropagation();
            if (evtType === 'click') {
                e.preventDefault();
                addSiblingNode(node.id);
            }
        });
    });
    hoverActionsDiv.appendChild(addSiblingBtn);

    div.appendChild(hoverActionsDiv);

    // Node Event Listeners
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node.id);
    });

    div.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startInlineEditing(node.id);
    });

    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectNode(node.id);
        showContextMenu(e.clientX, e.clientY);
    });

    // Drag and Drop re-parenting
    div.addEventListener('dragstart', (e) => {
        if (node.id === state.tree.id) {
            e.preventDefault();
            return; // Cannot drag root node
        }
        state.draggedNodeId = node.id;
        e.dataTransfer.setData('text/plain', node.id);
        div.style.opacity = '0.5';
    });

    div.addEventListener('dragend', () => {
        div.style.opacity = '1';
        state.draggedNodeId = null;
        removeDropHighlights();
    });

    div.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (state.draggedNodeId && state.draggedNodeId !== node.id) {
            // Check if node is not a descendant of dragged node
            const dragged = findNode(state.tree, state.draggedNodeId);
            if (dragged && !findNode(dragged, node.id)) {
                div.classList.add('drop-target');
                state.dropTargetId = node.id;
            }
        }
    });

    div.addEventListener('dragleave', () => {
        div.classList.remove('drop-target');
    });

    div.addEventListener('drop', (e) => {
        e.preventDefault();
        removeDropHighlights();
        if (state.draggedNodeId && state.dropTargetId) {
            reparentNode(state.draggedNodeId, state.dropTargetId);
        }
    });

    return div;
}

// Remove All Drop Target Highlights
function removeDropHighlights() {
    document.querySelectorAll('.mindmap-node.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
}

// Re-parent Node
function reparentNode(childId, newParentId) {
    if (childId === newParentId) return;

    const oldParent = findParentNode(state.tree, childId);
    const newParent = findNode(state.tree, newParentId);
    const childNode = findNode(state.tree, childId);

    if (!oldParent || !newParent || !childNode) return;

    // Check ancestor loop
    if (findNode(childNode, newParentId)) {
        showToast('Cannot move a parent into its own sub-branch');
        return;
    }

    saveSnapshot();

    // Remove from old parent
    oldParent.children = oldParent.children.filter(c => c.id !== childId);

    // Add to new parent
    if (!newParent.children) newParent.children = [];
    newParent.children.push(childNode);
    newParent.collapsed = false;

    renderMap();
    saveToLocalStorage();
    showToast('Node re-parented');
}

// Select Node
function selectNode(id) {
    state.selectedNodeId = id;
    document.querySelectorAll('.mindmap-node').forEach(el => {
        el.classList.toggle('selected', el.id === id);
    });
    updateInspectorPanel();
}

// Toggle Collapse Node
function toggleCollapseNode(id) {
    const node = findNode(state.tree, id);
    if (node && node.children && node.children.length > 0) {
        saveSnapshot();
        node.collapsed = !node.collapsed;
        renderMap();
        saveToLocalStorage();
    }
}

function setNodeCollapsed(id, collapsed) {
    const node = findNode(state.tree, id);
    if (!node || !node.children || node.children.length === 0 || node.collapsed === collapsed) {
        hideContextMenu();
        return;
    }

    saveSnapshot();
    node.collapsed = collapsed;
    hideContextMenu();
    renderMap();
    saveToLocalStorage();
}

// Inline Text Editing
function startInlineEditing(id) {
    selectNode(id);
    const nodeEl = document.getElementById(id);
    if (!nodeEl) return;

    const textSpan = nodeEl.querySelector('.node-text');
    if (!textSpan) return;

    textSpan.contentEditable = 'true';
    textSpan.focus();

    // Select all text inside node
    const range = document.createRange();
    range.selectNodeContents(textSpan);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEdit() {
        textSpan.contentEditable = 'false';
        const newText = textSpan.textContent.trim();
        const node = findNode(state.tree, id);
        if (node && node.text !== newText) {
            saveSnapshot();
            node.text = newText || 'Untitled';
            renderMap();
            saveToLocalStorage();
        }
    }

    textSpan.onblur = finishEdit;
    textSpan.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textSpan.blur();
        } else if (e.key === 'Escape') {
            const node = findNode(state.tree, id);
            if (node) textSpan.textContent = node.text;
            textSpan.blur();
        }
    };
}

// Ensure Target Node Remains Visible Inside Screen Bounds (Auto Pan Viewport)
function ensureNodeVisible(nodeId) {
    const node = findNode(state.tree, nodeId);
    if (!node) return;

    // Convert node canvas coords to viewport screen coords
    const screenX = state.transform.x + node.x * state.transform.scale;
    const screenY = state.transform.y + node.y * state.transform.scale;

    const margin = 140;
    const minX = margin;
    const maxX = window.innerWidth - margin;
    const minY = 60 + margin;
    const maxY = window.innerHeight - margin;

    let shiftX = 0;
    let shiftY = 0;

    if (screenX < minX) shiftX = minX - screenX;
    else if (screenX > maxX) shiftX = maxX - screenX;

    if (screenY < minY) shiftY = minY - screenY;
    else if (screenY > maxY) shiftY = maxY - screenY;

    if (shiftX !== 0 || shiftY !== 0) {
        state.transform.x += shiftX;
        state.transform.y += shiftY;
        updateViewportTransform();
    }
}

// Node Operations
function addChildNode(targetId) {
    const parentId = targetId || state.selectedNodeId;
    if (!parentId) return;
    const parent = findNode(state.tree, parentId);
    if (!parent) return;

    saveSnapshot();
    if (!parent.children) parent.children = [];
    parent.collapsed = false;

    const newNode = {
        id: generateId(),
        text: 'Sub-topic',
        color: parent.color || '#4f46e5',
        shape: 'pill',
        children: []
    };

    parent.children.push(newNode);
    renderMap();
    saveToLocalStorage();
    selectNode(newNode.id);
    ensureNodeVisible(newNode.id);
    setTimeout(() => startInlineEditing(newNode.id), 50);
}

function addSiblingNode(targetId) {
    const nodeParamId = targetId || state.selectedNodeId;
    if (!nodeParamId || nodeParamId === state.tree.id) {
        addChildNode(state.tree.id); // Root node creates child instead
        return;
    }

    const parent = findParentNode(state.tree, nodeParamId);
    if (!parent) return;

    saveSnapshot();

    const newNode = {
        id: generateId(),
        text: 'New Sibling',
        color: parent.color || '#4f46e5',
        shape: 'pill',
        children: []
    };

    const index = parent.children.findIndex(c => c.id === nodeParamId);
    parent.children.splice(index + 1, 0, newNode);

    renderMap();
    saveToLocalStorage();
    selectNode(newNode.id);
    ensureNodeVisible(newNode.id);
    setTimeout(() => startInlineEditing(newNode.id), 50);
}

function deleteSelectedNode() {
    if (!state.selectedNodeId || state.selectedNodeId === state.tree.id) {
        showToast('Cannot delete root node');
        return;
    }

    const parent = findParentNode(state.tree, state.selectedNodeId);
    if (!parent) return;

    saveSnapshot();
    parent.children = parent.children.filter(c => c.id !== state.selectedNodeId);
    state.selectedNodeId = parent.id;

    renderMap();
    saveToLocalStorage();
    showToast('Node deleted');
}

function clearAllData() {
    state.currentMapId = generateMapId();
    state.mapLibrary = [];
    state.tree = {
        id: 'root',
        text: '',
        color: '#4f46e5',
        shape: 'pill',
        collapsed: false,
        children: []
    };
    state.selectedNodeId = 'root';
    state.undoStack = [];
    state.redoStack = [];
    state.layoutStyle = 'mindmap';
    state.lineStyle = 'curve';
    state.searchQuery = '';
    state.searchMatches = [];
    state.currentMatchIndex = 0;

    document.getElementById('map-title-input').value = 'Untitled Mind Map';
    document.getElementById('search-input').value = '';
    document.getElementById('search-count').textContent = '';

    document.querySelectorAll('#style-menu button[data-layout]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-layout') === state.layoutStyle);
    });
    document.querySelectorAll('#line-style-menu button[data-line-style]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-line-style') === state.lineStyle);
    });

    try {
        ['mindflow_maps', 'mindflow_current_map', 'mindflow_tree', 'mindflow_title', 'mindflow_layout', 'mindflow_line_style'].forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (e) {
        console.warn('LocalStorage clear failed', e);
    }

    saveToLocalStorage();
    renderMap();
    fitView();
    showToast('All mind map data cleared');
}

// Viewport Transform Controller (Pan & Zoom)
function updateViewportTransform() {
    const viewport = document.getElementById('mindmap-viewport');
    if (viewport) {
        viewport.style.transform = `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`;
    }
    const zoomInd = document.getElementById('zoom-indicator');
    if (zoomInd) {
        zoomInd.textContent = `${Math.round(state.transform.scale * 100)}%`;
    }

    // Move grid background dynamically for seamless infinite canvas tracking
    const gridBg = document.querySelector('.canvas-grid-bg');
    if (gridBg) {
        const gridScale = 24 * state.transform.scale;
        gridBg.style.backgroundSize = `${gridScale}px ${gridScale}px`;
        gridBg.style.backgroundPosition = `${state.transform.x}px ${state.transform.y}px`;
    }
}

function zoom(deltaScale, centerPoint = { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2 }) {
    const oldScale = state.transform.scale;
    let newScale = oldScale * deltaScale;
    newScale = Math.max(0.2, Math.min(3.0, newScale));

    // Zoom relative to point
    state.transform.x = centerPoint.x - (centerPoint.x - state.transform.x) * (newScale / oldScale);
    state.transform.y = centerPoint.y - (centerPoint.y - state.transform.y) * (newScale / oldScale);
    state.transform.scale = newScale;

    updateViewportTransform();
}

function resetView() {
    state.transform = { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2, scale: 1.0 };
    updateViewportTransform();
}

function fitView() {
    const allNodes = flattenTree(state.tree);
    if (allNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    allNodes.forEach(node => {
        minX = Math.min(minX, node.x - 100);
        maxX = Math.max(maxX, node.x + 100);
        minY = Math.min(minY, node.y - 40);
        maxY = Math.max(maxY, node.y + 40);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 80;

    const availableWidth = window.innerWidth - padding * 2;
    const availableHeight = (window.innerHeight - 60) - padding * 2;

    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    let scale = Math.min(scaleX, scaleY);
    scale = Math.max(0.3, Math.min(1.5, scale));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    state.transform.scale = scale;
    state.transform.x = window.innerWidth / 2 - centerX * scale;
    state.transform.y = (window.innerHeight - 60) / 2 - centerY * scale;

    updateViewportTransform();
}

// Inspector Right Panel Updates
function updateInspectorPanel() {
    const panel = document.getElementById('property-panel');
    if (!state.selectedNodeId) {
        panel.classList.remove('active');
        return;
    }

    const node = findNode(state.tree, state.selectedNodeId);
    if (!node) return;

    panel.classList.add('active');

    document.getElementById('node-text-input').value = node.text || '';
    document.getElementById('node-notes-input').value = node.notes || '';
    document.getElementById('node-status-select').value = node.status || '';
    document.getElementById('node-shape-select').value = node.shape === 'circle' ? 'circle' : 'pill';
    document.getElementById('custom-color-picker').value = node.color || '#4f46e5';
}

// Setup Event Listeners
function setupEventListeners() {
    const canvasContainer = document.getElementById('canvas-container');

    // Pan Canvas
    canvasContainer.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.mindmap-node') || e.button !== 0) return;
        state.isPanning = true;
        state.panStart = { x: e.clientX - state.transform.x, y: e.clientY - state.transform.y };
        canvasContainer.classList.add('panning');
    });

    window.addEventListener('pointermove', (e) => {
        if (!state.isPanning) return;
        state.transform.x = e.clientX - state.panStart.x;
        state.transform.y = e.clientY - state.panStart.y;
        updateViewportTransform();
    });

    window.addEventListener('pointerup', () => {
        if (state.isPanning) {
            state.isPanning = false;
            canvasContainer.classList.remove('panning');
        }
    });

    // Zoom Wheel
    canvasContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        zoom(delta, { x: e.clientX, y: e.clientY });
    }, { passive: false });

    // Header Actions
    document.getElementById('btn-home').addEventListener('click', showHomeScreen);
    document.getElementById('welcome-new-map').addEventListener('click', () => {
        createMapDocument({
            id: 'root',
            text: '',
            color: '#4f46e5',
            shape: 'pill',
            collapsed: false,
            children: []
        }, 'Untitled Mind Map');
    });
    document.getElementById('recent-map-list').addEventListener('click', e => {
        const deleteButton = e.target.closest('[data-delete-map-id]');
        if (deleteButton) {
            deleteRecentMap(deleteButton.dataset.deleteMapId);
            return;
        }
        const row = e.target.closest('[data-map-id]');
        if (row && e.target.closest('.recent-map-open-button')) openMapDocument(row.dataset.mapId);
    });
    document.getElementById('map-title-input').addEventListener('input', saveToLocalStorage);

    document.getElementById('btn-add-child').addEventListener('click', addChildNode);
    document.getElementById('btn-add-sibling').addEventListener('click', addSiblingNode);
    document.getElementById('btn-delete-node').addEventListener('click', deleteSelectedNode);
    const clearAllButton = document.getElementById('btn-clear-all-data');
    const clearAllModal = document.getElementById('clear-all-modal');
    const closeClearAllModal = () => {
        clearAllModal.classList.remove('active');
        clearAllButton.focus();
    };

    clearAllButton.addEventListener('click', () => {
        clearAllModal.classList.add('active');
        document.getElementById('cancel-clear-all-btn').focus();
    });
    document.getElementById('close-clear-all-btn').addEventListener('click', closeClearAllModal);
    document.getElementById('cancel-clear-all-btn').addEventListener('click', closeClearAllModal);
    document.getElementById('confirm-clear-all-btn').addEventListener('click', () => {
        clearAllModal.classList.remove('active');
        clearAllData();
        clearAllButton.focus();
    });
    clearAllModal.addEventListener('click', e => {
        if (e.target === clearAllModal) closeClearAllModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && clearAllModal.classList.contains('active')) {
            closeClearAllModal();
        }
    });

    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-redo').addEventListener('click', redo);

    document.getElementById('btn-expand-all').addEventListener('click', () => {
        saveSnapshot();
        function expand(n) {
            n.collapsed = false;
            if (n.children) n.children.forEach(expand);
        }
        expand(state.tree);
        renderMap();
        saveToLocalStorage();
    });

    document.getElementById('btn-collapse-all').addEventListener('click', () => {
        saveSnapshot();
        if (state.tree.children) {
            state.tree.children.forEach(c => c.collapsed = true);
        }
        renderMap();
        saveToLocalStorage();
    });

    document.getElementById('btn-auto-layout').addEventListener('click', () => {
        fitView();
        showToast('Auto layout reset');
    });

    // Zoom Controls
    document.getElementById('btn-zoom-in').addEventListener('click', () => zoom(1.2));
    document.getElementById('btn-zoom-out').addEventListener('click', () => zoom(0.8));
    document.getElementById('btn-center-view').addEventListener('click', resetView);
    document.getElementById('btn-fit-view').addEventListener('click', fitView);

    // Inspector Inputs Live Binding
    document.getElementById('node-text-input').addEventListener('input', (e) => {
        const node = findNode(state.tree, state.selectedNodeId);
        if (node) {
            node.text = e.target.value;
            renderMap();
            saveToLocalStorage();
        }
    });

    document.getElementById('node-notes-input').addEventListener('input', (e) => {
        const node = findNode(state.tree, state.selectedNodeId);
        if (node) {
            node.notes = e.target.value;
            renderMap();
            saveToLocalStorage();
        }
    });

    document.getElementById('node-status-select').addEventListener('change', (e) => {
        const node = findNode(state.tree, state.selectedNodeId);
        if (node) {
            saveSnapshot();
            node.status = e.target.value;
            renderMap();
            saveToLocalStorage();
        }
    });

    document.getElementById('node-shape-select').addEventListener('change', (e) => {
        const node = findNode(state.tree, state.selectedNodeId);
        if (node) {
            saveSnapshot();
            node.shape = e.target.value === 'circle' ? 'circle' : 'pill';
            renderMap();
            saveToLocalStorage();
        }
    });

    document.getElementById('custom-color-picker').addEventListener('input', (e) => {
        const node = findNode(state.tree, state.selectedNodeId);
        if (node) {
            node.color = e.target.value;
            renderMap();
            saveToLocalStorage();
        }
    });

    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-color');
            const node = findNode(state.tree, state.selectedNodeId);
            if (node) {
                saveSnapshot();
                node.color = color;
                renderMap();
                saveToLocalStorage();
            }
        });
    });

    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.getAttribute('data-icon');
            const node = findNode(state.tree, state.selectedNodeId);
            if (node) {
                saveSnapshot();
                node.emoji = icon;
                renderMap();
                saveToLocalStorage();
            }
        });
    });

    document.getElementById('close-panel-btn').addEventListener('click', () => {
        document.getElementById('property-panel').classList.remove('active');
    });

    // Map Style Switcher
    const styleBtn = document.getElementById('style-dropdown-btn');
    const styleMenu = document.getElementById('style-menu');

    if (styleBtn && styleMenu) {
        styleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            styleMenu.classList.toggle('show');
        });

        document.querySelectorAll('#style-menu button[data-layout]').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.getAttribute('data-layout');
                state.layoutStyle = layout;
                document.querySelectorAll('#style-menu button[data-layout]').forEach(b => {
                    const isActive = b === btn;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-pressed', isActive);
                });
                styleMenu.classList.remove('show');
                saveToLocalStorage();
                renderMap();
                fitView();
                showToast(`Layout changed to ${layout}`);
            });
        });
    }

    // Theme Switcher
    const themeBtn = document.getElementById('theme-dropdown-btn');
    const themeMenu = document.getElementById('theme-menu');
    const lineStyleBtn = document.getElementById('line-style-dropdown-btn');
    const lineStyleMenu = document.getElementById('line-style-menu');

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('show');
    });

    if (lineStyleBtn && lineStyleMenu) {
        lineStyleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lineStyleMenu.classList.toggle('show');
        });

        document.querySelectorAll('#line-style-menu button[data-line-style]').forEach(btn => {
            btn.addEventListener('click', () => {
                const style = btn.getAttribute('data-line-style');
                state.lineStyle = style;
                document.querySelectorAll('#line-style-menu button[data-line-style]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                lineStyleMenu.classList.remove('show');
                saveToLocalStorage();
                renderMap();
                showToast(`Line style changed to ${style}`);
            });
        });
    }

    document.querySelectorAll('#theme-menu button').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = `theme-${theme}`;
            document.querySelectorAll('#theme-menu button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            themeMenu.classList.remove('show');
            showToast(`Theme changed to ${theme}`);
        });
    });

    // Export Dropdown Menu
    const exportBtn = document.getElementById('export-dropdown-btn');
    const exportMenu = document.getElementById('export-menu');

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        if (styleMenu) styleMenu.classList.remove('show');
        if (lineStyleMenu) lineStyleMenu.classList.remove('show');
        themeMenu.classList.remove('show');
        exportMenu.classList.remove('show');
        hideContextMenu();
    });

    // Export Handlers
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.getElementById('export-png').addEventListener('click', exportPNG);
    document.getElementById('export-svg').addEventListener('click', exportSVG);
    document.getElementById('export-md').addEventListener('click', exportMarkdown);
    document.getElementById('export-all-data').addEventListener('click', () => {
        downloadBackup();
        showToast('Exported all MindFlow data');
    });

    // Import Handler
    const importFileInput = document.getElementById('import-file-input');
    document.getElementById('import-json-btn').addEventListener('click', () => {
        importFileInput.value = '';
        importFileInput.dataset.importAllData = 'false';
        importFileInput.click();
    });
    document.getElementById('import-all-data-btn').addEventListener('click', () => {
        importFileInput.value = '';
        importFileInput.dataset.importAllData = 'true';
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const importAllData = importFileInput.dataset.importAllData === 'true';
        importFileInput.dataset.importAllData = 'false';
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (importAllData && (!imported || imported.format !== 'mindflow-backup' || !Array.isArray(imported.maps))) {
                    alert('Select a valid MindFlow all-data backup file');
                    return;
                }
                if (imported && imported.format === 'mindflow-backup' && Array.isArray(imported.maps)) {
                    const maps = imported.maps.filter(map => map && map.id && map.tree && map.tree.id);
                    if (maps.length === 0) {
                        alert('Backup file contains no valid mind maps');
                        return;
                    }
                    state.mapLibrary = maps;
                    state.currentMapId = null;
                    state.undoStack = [];
                    state.redoStack = [];
                    const activeMap = maps.find(map => map.id === imported.currentMapId) || maps[0];
                    openMapDocument(activeMap.id);
                    showToast('MindFlow backup restored');
                } else if (imported && imported.id) {
                    saveSnapshot();
                    state.tree = imported;
                    renderMap();
                    fitView();
                    saveToLocalStorage();
                    showToast('Map imported successfully');
                } else {
                    alert('Invalid mind map JSON file format');
                }
            } catch (err) {
                alert('Error parsing JSON file');
            }
        };
        reader.readAsText(file);
    });

    // Search Box Implementation
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        state.searchQuery = q;
        const allNodes = flattenTree(state.tree);

        if (!q) {
            state.searchMatches = [];
            document.getElementById('search-count').textContent = '';
            renderMap();
            return;
        }

        state.searchMatches = allNodes.filter(n => (n.text && n.text.toLowerCase().includes(q)) || (n.notes && n.notes.toLowerCase().includes(q))).map(n => n.id);

        document.getElementById('search-count').textContent = state.searchMatches.length ? `${state.searchMatches.length} match` : '0 matches';
        renderMap();
    });

    // Modals
    const templatesModal = document.getElementById('templates-modal');
    document.getElementById('btn-templates').addEventListener('click', () => templatesModal.classList.add('active'));
    document.getElementById('welcome-template').addEventListener('click', () => templatesModal.classList.add('active'));
    document.getElementById('close-templates-btn').addEventListener('click', () => templatesModal.classList.remove('active'));

    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-template');
            if (TEMPLATES[key]) {
                if (document.body.classList.contains('home-screen-active')) {
                    createMapDocument(deepClone(TEMPLATES[key]), card.querySelector('h3').textContent);
                    showToast('Created map from template');
                } else {
                    saveSnapshot();
                    state.tree = deepClone(TEMPLATES[key]);
                    renderMap();
                    fitView();
                    saveToLocalStorage();
                    templatesModal.classList.remove('active');
                    showToast(`Loaded ${key} template`);
                }
            }
        });
    });

    const shortcutsModal = document.getElementById('shortcuts-modal');
    document.getElementById('btn-shortcuts').addEventListener('click', () => shortcutsModal.classList.add('active'));
    document.getElementById('close-shortcuts-btn').addEventListener('click', () => shortcutsModal.classList.remove('active'));

    // Keyboard Shortcuts Listener
    window.addEventListener('keydown', (e) => {
        if (document.body.classList.contains('home-screen-active')) return;

        // If typing in input or textarea, ignore canvas shortcuts
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.contentEditable === 'true') {
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            addChildNode();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            addSiblingNode();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelectedNode();
        } else if (e.key === 'F2' || e.key === ' ') {
            e.preventDefault();
            if (state.selectedNodeId) startInlineEditing(state.selectedNodeId);
        } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            navigateArrowKeys(e.key);
        }
    });

    // Context Menu Buttons
    document.getElementById('ctx-add-child').addEventListener('click', addChildNode);
    document.getElementById('ctx-add-sibling').addEventListener('click', addSiblingNode);
    document.getElementById('ctx-edit-text').addEventListener('click', () => {
        if (state.selectedNodeId) startInlineEditing(state.selectedNodeId);
    });
    document.getElementById('ctx-expand-node').addEventListener('click', () => {
        if (state.selectedNodeId) setNodeCollapsed(state.selectedNodeId, false);
    });
    document.getElementById('ctx-collapse-node').addEventListener('click', () => {
        if (state.selectedNodeId) setNodeCollapsed(state.selectedNodeId, true);
    });
    document.getElementById('ctx-inspector').addEventListener('click', () => {
        document.getElementById('property-panel').classList.add('active');
    });
    document.getElementById('ctx-delete').addEventListener('click', deleteSelectedNode);
}

// Navigate Tree via Arrow Keys
function navigateArrowKeys(key) {
    if (!state.selectedNodeId) return;
    const current = findNode(state.tree, state.selectedNodeId);
    if (!current) return;

    if (key === 'ArrowRight') {
        if (current.children && current.children.length > 0 && !current.collapsed) {
            selectNode(current.children[0].id);
        }
    } else if (key === 'ArrowLeft') {
        const parent = findParentNode(state.tree, current.id);
        if (parent) selectNode(parent.id);
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        const parent = findParentNode(state.tree, current.id);
        if (parent && parent.children) {
            const index = parent.children.findIndex(c => c.id === current.id);
            if (key === 'ArrowUp' && index > 0) {
                selectNode(parent.children[index - 1].id);
            } else if (key === 'ArrowDown' && index < parent.children.length - 1) {
                selectNode(parent.children[index + 1].id);
            }
        }
    }
}

// Show Context Menu
function showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    const node = findNode(state.tree, state.selectedNodeId);
    const hasChildren = Boolean(node && node.children && node.children.length > 0);
    document.getElementById('ctx-expand-node').disabled = !hasChildren || !node.collapsed;
    document.getElementById('ctx-collapse-node').disabled = !hasChildren || node.collapsed;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('active');
}

function hideContextMenu() {
    document.getElementById('context-menu').classList.remove('active');
}

// Toast Notifications
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

// EXPORT FUNCTIONS

// 1. Export JSON Data
function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tree, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${getMapTitle()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported JSON');
}

function downloadBackup() {
    saveToLocalStorage();
    if (!state.mapLibrary.length) return;

    const backup = {
        format: 'mindflow-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        currentMapId: state.currentMapId,
        maps: deepClone(state.mapLibrary)
    };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `MindFlow-Backup-${timestamp}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// 2. Export Markdown Outline
function exportMarkdown() {
    let mdText = `# ${getMapTitle()}\n\n`;

    function buildMD(node, depth = 0) {
        const indent = '  '.repeat(depth);
        const prefix = depth === 0 ? '# ' : depth === 1 ? '## ' : '- ';
        mdText += `${indent}${prefix}${node.emoji ? node.emoji + ' ' : ''}${node.text}\n`;
        if (node.notes) {
            mdText += `${indent}  > ${node.notes}\n`;
        }
        if (node.children) {
            node.children.forEach(c => buildMD(c, depth + 1));
        }
    }

    buildMD(state.tree);

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${getMapTitle()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Markdown Outline');
}

// 3. Export SVG Vector Graphic
function exportSVG() {
    const svgEl = document.getElementById('svg-connections');
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);

    // Create standalone SVG wrapper with node rendering
    const allNodes = flattenTree(state.tree);
    let nodesSVG = '';

    allNodes.forEach(n => {
        const x = n.x + 10000;
        const y = n.y + 10000;
        nodesSVG += `
            <g transform="translate(${x}, ${y})">
                <rect x="-60" y="-18" width="120" height="36" rx="8" fill="${n.color || '#1e293b'}" stroke="#ffffff" stroke-width="1.5" />
                <text x="0" y="4" fill="#ffffff" font-family="Inter, sans-serif" font-size="12" text-anchor="middle">${n.text || ''}</text>
            </g>
        `;
    });

    const fullSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20000" height="20000" viewBox="0 0 20000 20000">
        ${svgString}
        ${nodesSVG}
    </svg>`;

    const blob = new Blob([fullSVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${getMapTitle()}.svg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported SVG Vector');
}

// 4. Export PNG Image
function exportPNG() {
    const allNodes = flattenTree(state.tree);
    if (allNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allNodes.forEach(n => {
        minX = Math.min(minX, n.x - 120);
        maxX = Math.max(maxX, n.x + 120);
        minY = Math.min(minY, n.y - 60);
        maxY = Math.max(maxY, n.y + 60);
    });

    const padding = 60;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // Hi-DPI scaling
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Canvas Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    // Draw Connection Lines
    function drawLines(parent) {
        if (!parent.children || parent.children.length === 0 || parent.collapsed) return;
        parent.children.forEach(child => {
            ctx.beginPath();
            const sx = parent.x + offsetX;
            const sy = parent.y + offsetY;
            const ex = child.x + offsetX;
            const ey = child.y + offsetY;

            const isRight = child.x >= parent.x;
            const dx = Math.abs(ex - sx);
            const cpOffset = Math.max(dx * 0.5, 40);
            const midX = (sx + ex) / 2;
            const midY = (sy + ey) / 2;

            if (state.lineStyle === 'straight') {
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
            } else if (state.lineStyle === 'dashed') {
                const cp1x = isRight ? sx + cpOffset : sx - cpOffset;
                const cp1y = sy;
                const cp2x = isRight ? ex - cpOffset : ex + cpOffset;
                const cp2y = ey;
                ctx.moveTo(sx, sy);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
                ctx.setLineDash([8, 8]);
            } else if (state.lineStyle === 'organic') {
                const qx = isRight ? midX + Math.max(dx * 0.2, 35) : midX - Math.max(dx * 0.2, 35);
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(qx, midY, ex, ey);
            } else {
                const cp1x = isRight ? sx + cpOffset : sx - cpOffset;
                const cp1y = sy;
                const cp2x = isRight ? ex - cpOffset : ex + cpOffset;
                const cp2y = ey;
                ctx.moveTo(sx, sy);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
            }

            ctx.strokeStyle = child.color || parent.color || '#475569';
            ctx.lineWidth = state.lineStyle === 'straight' ? 2 : 2.5;
            ctx.stroke();
            ctx.setLineDash([]);

            drawLines(child);
        });
    }

    drawLines(state.tree);

    // Draw Nodes
    allNodes.forEach(n => {
        const nx = n.x + offsetX;
        const ny = n.y + offsetY;
        const text = (n.emoji ? n.emoji + ' ' : '') + (n.text || 'Topic');

        ctx.font = n.depth === 0 ? 'bold 16px Inter' : '13px Inter';
        const textMetrics = ctx.measureText(text);
        const nw = Math.max(textMetrics.width + 30, 90);
        const nh = n.depth === 0 ? 44 : 34;

        // Draw Pill/Card
        ctx.fillStyle = n.color || (n.depth === 0 ? '#6366f1' : '#1e293b');
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;

        roundRect(ctx, nx - nw / 2, ny - nh / 2, nw, nh, n.depth === 0 ? 20 : 8, true, true);

        // Draw Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, nx, ny);
    });

    const link = document.createElement('a');
    link.download = `${getMapTitle()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Exported PNG Image');
}

// Canvas Rounded Rect Utility
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function getMapTitle() {
    return document.getElementById('map-title-input').value.trim() || 'MindMap';
}

// Run Initialization on Load
window.addEventListener('DOMContentLoaded', initApp);
