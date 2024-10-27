import "./style.css";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import gsap from "gsap";

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// Load and set HDRI as environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Decrease the intensity of the HDRI
    texture.encoding = THREE.LinearEncoding; // Set the encoding
    texture.needsUpdate = true; // Ensure the texture updates

    // Create a material to control the intensity of the environment map
    scene.environment = texture;
    // scene.background = texture.clone(); // Optional: clone for background
  }
);

// Add soft ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

// Add point light for soft shadows and highlights
const pointLight = new THREE.PointLight(0xffffff, 1, 10); // Color, intensity, distance
pointLight.position.set(5, 5, 5); // Position the light
pointLight.castShadow = true; // Enable shadow casting
scene.add(pointLight);

// Optional: Add a helper to visualize the point light
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5);
scene.add(pointLightHelper);

// Setup post-processing for bloom effect
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Create and configure the bloom pass
const bloomPass = new UnrealBloomPass();
bloomPass.threshold = 0.3; // Threshold for bloom effect
bloomPass.strength = 1.5; // Decreased strength of the bloom effect (was 1.5)
bloomPass.radius = 0.4; // Radius of the bloom
composer.addPass(bloomPass);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});

let faceObject; // Declare variable to hold the face object

// Load the GLTF model and animate the 'face' object
const gltfLoader = new GLTFLoader();
gltfLoader.load("/model.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // Find the 'face' object within the model's hierarchy
  faceObject = model.getObjectByName("face");

  if (!faceObject) {
    console.warn("Face object not found in the model.");
  }

  // Set the position of the model to move it closer to the camera
  model.position.z = 2.5; // Move the model closer to the camera
  model.position.y = 0.4; // Slightly lift the model
  model.rotation.x = -0.1;

  // Set the camera position and rotation based on the exported camera
  const exportedCamera = gltf.cameras[0]; // Use the first camera in the GLTF file
  if (exportedCamera) {
    camera.position.copy(exportedCamera.position);
    camera.rotation.copy(exportedCamera.rotation);
  } else {
    console.warn("No camera found in the GLTF model.");
  }
});

// Track mouse movements and apply rotation to the face object
let mouseX = 0;
let mouseY = 0;

window.addEventListener("mousemove", (event) => {
  // Normalize mouse position to range -1 to 1
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  if (faceObject) {
    // Use GSAP to animate the face object rotation based on mouse movement
    gsap.to(faceObject.rotation, {
      x: -mouseY * 0.5, // Inverted multiplier to control rotation range
      y: mouseX * 0.5,
      duration: 1.5, // Smooth animation
      ease: "power3.out",
    });
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

animate();
