let canvas = document.getElementById("renderCanvas");
let engine = new BABYLON.Engine(canvas, true);
let scene = new BABYLON.Scene(engine);
let camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);
let light;
let model = null;
let animationGroups = [];

const lightTypeSelect = document.getElementById("lightType");
const intensitySlider = document.getElementById("intensitySlider");
const radiusSlider = document.getElementById("radiusSlider");
const lightX = document.getElementById("lightX");
const lightY = document.getElementById("lightY");
const lightZ = document.getElementById("lightZ");
const scaleSlider = document.getElementById("scaleSlider");
const modelUpload = document.getElementById("modelUpload");
const downloadBtn = document.getElementById("downloadBtn");
const animationSelect = document.getElementById("animationSelect");
const playBtn = document.getElementById("playSelectedAnimationBtn");

function createLight(type) {
  if (light) light.dispose();
  const position = new BABYLON.Vector3(
    parseFloat(lightX.value),
    parseFloat(lightY.value),
    parseFloat(lightZ.value)
  );

  switch (type) {
    case "directional":
      light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
      break;
    case "point":
      light = new BABYLON.PointLight("pointLight", position, scene);
      break;
    case "spot":
      light = new BABYLON.SpotLight("spotLight", position, new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
      break;
    case "hemispheric":
      light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      break;
  }

  updateLightProperties();
}

function updateLightProperties() {
  if (!light) return;
  light.intensity = parseFloat(intensitySlider.value);
  if (light.position) {
    light.position.set(
      parseFloat(lightX.value),
      parseFloat(lightY.value),
      parseFloat(lightZ.value)
    );
  }
  if (light.radius !== undefined) {
    light.radius = parseFloat(radiusSlider.value);
  }
}

lightTypeSelect.addEventListener("change", () => createLight(lightTypeSelect.value));
[intensitySlider, radiusSlider, lightX, lightY, lightZ].forEach(elem => {
  elem.addEventListener("input", updateLightProperties);
});

scaleSlider.addEventListener("input", () => {
  if (model) model.scaling.setAll(parseFloat(scaleSlider.value));
});

modelUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const filename = file.name.toLowerCase();
  const fileReader = new FileReader();

  fileReader.onload = function () {
    const arrayBuffer = this.result;
    const blobUrl = URL.createObjectURL(new Blob([arrayBuffer]));

    BABYLON.SceneLoader.ImportMesh("", "", blobUrl, scene, (meshes, _, skeletons, animGroups) => {
      if (model) model.dispose();
      model = meshes[0];
      model.position = new BABYLON.Vector3(0, 0.5, 0);
      model.scaling.setAll(parseFloat(scaleSlider.value));

      animationGroups = animGroups;
      loadAnimations();
    });
  };

  fileReader.readAsArrayBuffer(file);
});

function loadAnimations() {
  animationSelect.innerHTML = "<option value=''> (Tidak ada animasi) </option>";
  if (animationGroups.length > 0) {
    animationGroups.forEach((group, index) => {
      const option = document.createElement("option");
      option.textContent = group.name || `Animasi ${index + 1}`;
      option.value = index;
      animationSelect.appendChild(option);
    });
  }
}

let currentPlaying = null;
playBtn.addEventListener("click", () => {
  const index = parseInt(animationSelect.value);
  if (isNaN(index) || !animationGroups[index]) return;

  if (currentPlaying && currentPlaying.isPlaying) {
    currentPlaying.pause();
    playBtn.textContent = "Putar";
  } else {
    if (currentPlaying && !currentPlaying.isPlaying) {
      currentPlaying.play();
    } else {
      animationGroups.forEach(g => g.stop());
      currentPlaying = animationGroups[index];
      currentPlaying.start(true);
    }
    playBtn.textContent = "Jeda";
  }
});

downloadBtn.addEventListener("click", () => {
  if (!model) return;
  const gltfExport = BABYLON.GLTF2Export.GLB(scene, "exportedModel");
  gltfExport.then(gltf => {
    gltf.downloadFiles();
  });
});

createLight("directional");
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
