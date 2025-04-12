// Initialize Babylon.js
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

// Register loaders
BABYLON.SceneLoader.RegisterPlugin(new BABYLON.OBJFileLoader());
const gltfLoader = new BABYLON.GLTFFileLoader();
BABYLON.SceneLoader.RegisterPlugin(gltfLoader);

// Set up camera
const camera = new BABYLON.ArcRotateCamera("camera", Math.PI/2, Math.PI/4, 7, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

// Set up lighting
const mainLight = new BABYLON.DirectionalLight("mainLight", new BABYLON.Vector3(-1, -1, -0.5), scene);
mainLight.intensity = 0.8;

// Get DOM elements
const lightDot = document.querySelector('.light-dot');
const posX = document.getElementById('posX');
const posY = document.getElementById('posY');
const posZ = document.getElementById('posZ');
const intensity = document.getElementById('intensity');
const toggleBtn = document.getElementById('toggleBtn');
const fileInput = document.getElementById('fileInput');
const loadButton = document.getElementById('loadButton');
const loadingStatus = document.getElementById('loadingStatus');
let model = null;

// Update light position and visual indicator
function updateLightPosition() {
    const x = parseFloat(posX.value) / 50 - 1;
    const y = parseFloat(posY.value) / 50 - 1;
    const z = parseFloat(posZ.value) / 50 - 1;
    
    mainLight.direction = new BABYLON.Vector3(x, y, z);
    mainLight.intensity = parseFloat(intensity.value) / 50;
    
    lightDot.style.left = `${48 + x * 30}px`;
    lightDot.style.top = `${48 + y * 30}px`;
}

// Initialize light controls
posX.value = 50;
posY.value = 50;
posZ.value = 50;
intensity.value = 40;
updateLightPosition();

// Add event listeners for light controls
[posX, posY, posZ, intensity].forEach(slider => {
    slider.addEventListener('input', updateLightPosition);
});

// Toggle light on/off
toggleBtn.addEventListener('click', () => {
    mainLight.setEnabled(!mainLight.isEnabled());
    toggleBtn.classList.toggle('toggle-off', !mainLight.isEnabled());
    toggleBtn.textContent = mainLight.isEnabled() ? 
        'MATI/HIDUPKAN CAHAYA (ON)' : 'MATI/HIDUPKAN CAHAYA (OFF)';
});

// Model loading function
async function loadModel(file) {
    loadingStatus.textContent = "Memproses file...";
    loadingStatus.className = "status-message loading";

    try {
        if (model) model.dispose();
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        const objectUrl = URL.createObjectURL(file);
        
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "",
            objectUrl,
            scene,
            null,
            "." + fileExt
        );
        
        model = result.meshes[0];
        model.position = BABYLON.Vector3.Zero();
        
        const boundingBox = model.getBoundingInfo().boundingBox;
        camera.setTarget(boundingBox.center);
        camera.radius = boundingBox.extendSize.length() * 2;
        
        loadingStatus.textContent = "Model berhasil dimuat!";
        loadingStatus.className = "status-message success";
        
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        loadingStatus.textContent = `Error: ${error.message}`;
        loadingStatus.className = "status-message error";
        console.error("Model loading error:", error);
    }
}

// File input handler
loadButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        loadModel(file);
    } else {
        loadingStatus.textContent = "Tidak ada file yang dipilih";
        loadingStatus.className = "status-message error";
    }
});

// Load test model
async function loadTestModel() {
    try {
        const response = await fetch("model/bugatti.obj");
        const blob = await response.blob();
        const file = new File([blob], "bugatti.obj", { type: "model/obj" });
        loadModel(file);
    } catch (error) {
        console.error("Failed to load test model:", error);
    }
}

// Initialize
loadTestModel();
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
