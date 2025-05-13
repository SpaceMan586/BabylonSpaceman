const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
let scene, model, light, shadowGenerator, lightIndicator;

function createLight(type, scene) {
  if (light) light.dispose();

  switch (type) {
    case "directional":
      light = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, -1), scene);
      break;
    case "point":
      light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 3, -3), scene);
      break;
    case "spot":
      light = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 4, -4), BABYLON.Vector3.Zero(), Math.PI / 3, 2, scene);
      break;
    case "hemispheric":
      light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      break;
  }

  updateLightProperties();
}

function updateLightProperties() {
  if (!light) return;

  const intensity = parseFloat(document.getElementById("intensitySlider").value);
  const radius = parseFloat(document.getElementById("radiusSlider").value);
  const x = parseFloat(document.getElementById("lightX").value);
  const y = parseFloat(document.getElementById("lightY").value);
  const z = parseFloat(document.getElementById("lightZ").value);

  light.intensity = intensity;
  if ("radius" in light) light.radius = radius;
  if ("position" in light) light.position = new BABYLON.Vector3(x, y, z);

  // Update shadow generator
  if (shadowGenerator) shadowGenerator.dispose();
  if (light.getShadowGenerator) {
    shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    if (model) shadowGenerator.addShadowCaster(model);
  }

  // Update the light indicator position
  if (lightIndicator) {
    lightIndicator.position = light.position.clone();
  }
}

function createScene() {
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 4, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.useAutoRotationBehavior = true;

  createLight("directional", scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  model = BABYLON.MeshBuilder.CreateBox("model", { size: 1 }, scene);
  model.position.y = 0.5;
  model.receiveShadows = true;
  updateLightProperties();

  // Create light position indicator
  lightIndicator = BABYLON.MeshBuilder.CreateSphere("lightIndicator", { diameter: 0.2 }, scene);
  lightIndicator.position = new BABYLON.Vector3(5, 5, 5);
  lightIndicator.material = new BABYLON.StandardMaterial("lightMat", scene);
  lightIndicator.material.emissiveColor = new BABYLON.Color3(1, 1, 0);  // Yellow

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK && pointerInfo.pickInfo.hit) {
      if (pointerInfo.pickInfo.pickedMesh === model) {
        model.scaling = model.scaling.multiplyByFloats(5, 5, 5);
      }
    }
  });

  return scene;
}

scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

document.getElementById("scaleSlider").addEventListener("input", (e) => {
  const scale = parseFloat(e.target.value);
  if (model) model.scaling = new BABYLON.Vector3(scale, scale, scale);
});

["lightType", "intensitySlider", "radiusSlider", "lightX", "lightY", "lightZ"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    const type = document.getElementById("lightType").value;
    createLight(type, scene);
  });
});

document.getElementById("modelUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = () => {
    const name = file.name.toLowerCase();
    const data = new Uint8Array(fileReader.result);

    BABYLON.SceneLoader.ImportMesh("", "file:", file, scene, (meshes) => {
      if (model) model.dispose();
      model = meshes[0];
      model.position = new BABYLON.Vector3(0, 0.5, 0);
      updateLightProperties();
    });
  };
  fileReader.readAsArrayBuffer(file);
});

let animationStarted = false; // Flag to check if animation has started
document.getElementById("playAnimationBtn").addEventListener("click", () => {
  if (model && model.animations && model.animations.length > 0) {
    if (!animationStarted) {
      // Start the animation
      scene.beginAnimation(model, 0, model.animations[0].frameCount, true);
      animationStarted = true; // Set the flag to true
    } else {
      // Stop the animation if it's already playing
      scene.stopAnimation(model);
      animationStarted = false; // Reset the flag
    }
  } else {
    alert("Model tidak memiliki animasi.");
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (model) {
    BABYLON.GLTF2Export.GLTFAsync(scene, "model.glb").then((glb) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(glb);
      link.download = "model.glb";
      link.click();
    });
  }
});
