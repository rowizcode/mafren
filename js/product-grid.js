// ============================================
// PRODUCT GRID + 3D VIEWER — Mafren Jewelry Atelier
// 6 GLB models — HDRI Studio Lighting
// ============================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // PRODUCT DATA — 2 GLB models only
    // ==========================================
    const PRODUCTS = [
        {
            id: 1,
            name: 'Lion Head Ring',
            category: 'ring',
            categoryLabel: 'Nhẫn',
            material: 'Bạc 925',
            materialType: 'silver',
            desc: 'Nhẫn đầu sư tử thiết kế độc bản — mô hình 3D chi tiết.',
            modelUrl: './public/models/lion_head_ring.glb'
        },
        {
            id: 2,
            name: 'Crab Legs Ring',
            category: 'ring',
            categoryLabel: 'Nhẫn',
            material: 'Bạc 925',
            materialType: 'silver',
            desc: 'Nhẫn chân cua thiết kế độc bản — mô hình 3D chi tiết.',
            modelUrl: './public/models/crab_legs.glb'
        },
        {
            id: 3,
            name: 'Mẫu trang sức 1',
            category: 'jewelry',
            categoryLabel: 'Trang sức',
            material: 'Vàng 18K',
            materialType: 'gold',
            desc: 'Trang sức vàng thiết kế độc bản — chế tác thủ công tinh xảo.',
            modelUrl: './public/models/1.glb'
        },
        {
            id: 4,
            name: 'Mẫu trang sức 2',
            category: 'jewelry',
            categoryLabel: 'Trang sức',
            material: 'Bạc 925',
            materialType: 'silver',
            desc: 'Trang sức thiết kế độc bản — chế tác thủ công tinh xảo.',
            modelUrl: './public/models/2.glb'
        },
        {
            id: 5,
            name: 'Mẫu trang sức 3',
            category: 'jewelry',
            categoryLabel: 'Trang sức',
            material: 'Bạc 925',
            materialType: 'silver',
            desc: 'Trang sức thiết kế độc bản — chế tác thủ công tinh xảo.',
            modelUrl: './public/models/3.glb'
        },
        {
            id: 6,
            name: 'Mẫu trang sức 4',
            category: 'jewelry',
            categoryLabel: 'Trang sức',
            material: 'Vàng 18K',
            materialType: 'gold',
            desc: 'Trang sức vàng thiết kế độc bản — chế tác thủ công tinh xảo.',
            modelUrl: './public/models/4.glb'
        },
    ];

    // ==========================================
    // GRID RENDERING
    // ==========================================
    const gridContainer = document.getElementById('product-grid');

    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    const gltfLoader = new GLTFLoader();
    const exrLoader = new EXRLoader();

    // Silver material — tuned for HDRI reflections
    const silverMat = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8ec, metalness: 1.0, roughness: 0.05,
        envMapIntensity: 2.5, clearcoat: 0.8, clearcoatRoughness: 0.02, reflectivity: 1.0,
    });

    // Gold material — warm 18K gold look
    const goldMat = new THREE.MeshPhysicalMaterial({
        color: 0xd4a843, metalness: 1.0, roughness: 0.12,
        envMapIntensity: 2.2, clearcoat: 0.6, clearcoatRoughness: 0.05, reflectivity: 1.0,
    });

    // Helper to get the right material for a product
    function getMaterial(product) {
        return product.materialType === 'gold' ? goldMat.clone() : silverMat.clone();
    }

    // ==========================================
    // HDRI ENVIRONMENT MAP (EXR)
    // ==========================================
    const HDRI_PATH = './public/models/monochrome_studio_02_1k.exr';
    let cachedRawTexture = null;  // Cache the raw EXR texture, NOT the PMREM result
    let rawTexturePromise = null; // Prevent duplicate loads

    // Load raw EXR texture once, cache for reuse across renderers
    function loadRawEXR() {
        if (rawTexturePromise) return rawTexturePromise;

        rawTexturePromise = new Promise((resolve, reject) => {
            exrLoader.load(HDRI_PATH, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                cachedRawTexture = texture;
                resolve(texture);
            }, undefined, (err) => {
                console.warn('HDRI load failed:', err);
                reject(err);
            });
        });

        return rawTexturePromise;
    }

    // Generate a PMREM env map for a specific renderer from the raw texture
    function loadHDRIEnvMap(renderer) {
        return loadRawEXR().then((rawTexture) => {
            const pmrem = new THREE.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            const envMap = pmrem.fromEquirectangular(rawTexture).texture;
            pmrem.dispose();
            return envMap;
        }).catch(() => {
            // Fallback: procedural env
            return createFallbackEnvMap(renderer);
        });
    }

    // Fallback procedural env map (in case EXR fails to load)
    function createFallbackEnvMap(renderer) {
        const envCanvas = document.createElement('canvas');
        envCanvas.width = 512; envCanvas.height = 256;
        const ctx = envCanvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#e0ddd8');
        grad.addColorStop(0.5, '#909098');
        grad.addColorStop(0.7, '#c0beb8');
        grad.addColorStop(1, '#f0ece6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        const texture = new THREE.CanvasTexture(envCanvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const envMap = pmrem.fromEquirectangular(texture).texture;
        pmrem.dispose();
        texture.dispose();
        return envMap;
    }

    // ==========================================
    // CARD PREVIEW — Live rotating 3D in each card
    // ==========================================
    const cardViewers = []; // track active card renderers for cleanup

    function cleanupCardViewers() {
        cardViewers.forEach(viewer => {
            if (viewer.animId) cancelAnimationFrame(viewer.animId);
            if (viewer.resizeObserver) viewer.resizeObserver.disconnect();
            if (viewer.visibilityObserver) viewer.visibilityObserver.disconnect();
            if (viewer.renderer) {
                viewer.renderer.dispose();
                const canvas = viewer.renderer.domElement;
                if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        });
        cardViewers.length = 0;
    }

    async function createCardViewer(product, container) {
        const w = container.clientWidth || 400;
        const h = container.clientHeight || 400;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const envMap = await loadHDRIEnvMap(renderer);
        scene.environment = envMap;

        const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
        camera.position.set(0, 3, 10);
        camera.lookAt(0, 0, 0);

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xeeeeff, 0.6);
        fillLight.position.set(-3, 2, -3);
        scene.add(fillLight);

        let animId = null;
        let modelRef = null;
        let isVisible = false;

        // Visibility observer - pause when off screen
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });
        visibilityObserver.observe(container);

        // Load GLB
        gltfLoader.load(product.modelUrl, (gltf) => {
            const model = gltf.scene;
            modelRef = model;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = getMaterial(product);
                }
            });

            // Center and scale
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.8 / maxDim;
            model.scale.multiplyScalar(scale);
            model.position.sub(center.multiplyScalar(scale));

            scene.add(model);

            // Hide loader
            const loader = container.querySelector('.card-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 400);
            }

            const animate = () => {
                animId = requestAnimationFrame(animate);

                if (modelRef) {
                    if (isVisible) {
                        // Slow continuous 360° rotation
                        modelRef.rotation.y += 0.003;
                    }
                }

                renderer.render(scene, camera);
            };
            animate();
        }, undefined, (err) => {
            console.error('Failed to load GLB:', product.modelUrl, err);
            const loader = container.querySelector('.card-loader');
            if (loader) {
                loader.innerHTML = '<span style="color:#999;font-size:0.8rem;">Không tải được 3D</span>';
            }
        });

        // Resize handler
        const resizeObserver = new ResizeObserver(() => {
            const nw = container.clientWidth;
            const nh = container.clientHeight;
            if (nw === 0 || nh === 0) return;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        });
        resizeObserver.observe(container);

        cardViewers.push({ renderer, animId, resizeObserver, visibilityObserver });
    }

    // ==========================================
    // RENDER GRID
    // ==========================================
    function renderGrid() {
        if (!gridContainer) return;
        cleanupCardViewers();
        gridContainer.innerHTML = '';

        PRODUCTS.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card featured-card';
            card.dataset.id = product.id;
            card.style.animationDelay = `${index * 0.15}s`;

            card.innerHTML = `
                <div class="card-preview" id="card-preview-${product.id}">
                    <div class="card-loader">
                        <div class="loader-spinner"></div>
                        <span>Đang tải 3D...</span>
                    </div>
                    <div class="card-hover-overlay">
                        <span class="view-3d-label">Xem 3D chi tiết</span>
                    </div>
                </div>
                <div class="card-info">
                    <p class="card-category">${product.categoryLabel}</p>
                    <h4 class="card-name">${product.name}</h4>
                    <p class="card-material">${product.material}</p>
                </div>
            `;

            card.addEventListener('click', () => openModal(product));
            gridContainer.appendChild(card);

            // Create live 3D viewer in the card
            requestAnimationFrame(() => {
                const previewContainer = document.getElementById(`card-preview-${product.id}`);
                if (previewContainer) {
                    createCardViewer(product, previewContainer);
                }
            });
        });
    }

    // ==========================================
    // MODAL 3D VIEWER
    // ==========================================
    const modal = document.getElementById('product-modal');
    const modalClose = document.getElementById('modal-close');
    const modalCanvasContainer = document.getElementById('modal-canvas-container');
    const modalLoader = document.getElementById('modal-loader');
    let modalRenderer = null;
    let modalAnimId = null;
    let modalResizeHandler = null;

    function openModal(product) {
        document.getElementById('modal-category').textContent = product.categoryLabel;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-material').textContent = product.material;
        document.getElementById('modal-description').textContent = product.desc;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (modalLoader) {
            modalLoader.style.display = 'flex';
            modalLoader.style.opacity = '1';
        }

        cleanupModalRenderer();

        requestAnimationFrame(() => {
            initModal3D(product);
        });
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        cleanupModalRenderer();
    }

    function cleanupModalRenderer() {
        if (modalAnimId) cancelAnimationFrame(modalAnimId);
        if (modalResizeHandler) {
            window.removeEventListener('resize', modalResizeHandler);
            modalResizeHandler = null;
        }
        if (modalRenderer) {
            modalRenderer.dispose();
            const oldCanvas = modalCanvasContainer.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();
        }
        modalRenderer = null;
        modalAnimId = null;
    }

    async function initModal3D(product) {
        const w = modalCanvasContainer.clientWidth;
        const h = modalCanvasContainer.clientHeight;
        if (w === 0 || h === 0) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);

        modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        modalRenderer.setSize(w, h);
        modalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        modalRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        modalRenderer.toneMappingExposure = 1.8;
        modalCanvasContainer.appendChild(modalRenderer.domElement);

        const modalEnvMap = await loadHDRIEnvMap(modalRenderer);
        scene.environment = modalEnvMap;

        const controls = new OrbitControls(camera, modalRenderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = 2;
        controls.maxDistance = 15;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;

        // Lighting — subtle accents alongside HDRI
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.5);
        keyLight.position.set(5, 6, 5); scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xf0f0ff, 0.8);
        fillLight.position.set(-4, 3, -4); scene.add(fillLight);
        const rimLight = new THREE.PointLight(0xc0c0ff, 0.8);
        rimLight.position.set(0, -3, -5); scene.add(rimLight);
        const topLight = new THREE.SpotLight(0xffffff, 1.5);
        topLight.position.set(0, 8, 0); topLight.angle = Math.PI / 6; topLight.penumbra = 0.4;
        scene.add(topLight);

        // Load GLB
        gltfLoader.load(product.modelUrl, (gltf) => {
            const model = gltf.scene;

            // Apply material based on product type
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = getMaterial(product);
                }
            });

            // Center and scale
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.2 / maxDim;
            model.scale.multiplyScalar(scale);
            model.position.sub(center.multiplyScalar(scale));

            scene.add(model);

            camera.position.set(0, 3.5, 10);
            camera.lookAt(0, 0, 0);

            // Hide loader
            if (modalLoader) {
                setTimeout(() => {
                    modalLoader.style.opacity = '0';
                    setTimeout(() => { modalLoader.style.display = 'none'; }, 400);
                }, 300);
            }

            const animate = () => {
                modalAnimId = requestAnimationFrame(animate);
                controls.update();
                modalRenderer.render(scene, camera);
            };
            animate();

            controls.addEventListener('start', () => { controls.autoRotate = false; });
        }, undefined, (err) => {
            console.error('Failed to load GLB in modal:', err);
            if (modalLoader) {
                modalLoader.innerHTML = '<span style="color:#999;">Không tải được mô hình 3D</span>';
            }
        });

        modalResizeHandler = () => {
            if (!modalRenderer) return;
            const nw = modalCanvasContainer.clientWidth;
            const nh = modalCanvasContainer.clientHeight;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            modalRenderer.setSize(nw, nh);
        };
        window.addEventListener('resize', modalResizeHandler);
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ==========================================
    // INIT
    // ==========================================
    renderGrid();
});
