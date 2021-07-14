import * as THREE from 'three';
import './styles';
import { NoiseWorld } from './noiseWorld';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function onResize(): void
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener('resize', onResize);

const noiseWorld = new NoiseWorld(scene, 1);

// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(2, 2, 2), 
//     new THREE.MeshBasicMaterial({ color: 0x00ffff })
//     );

// scene.add(cube);

camera.position.z = 5;

function update()
{
    requestAnimationFrame(update);
    
    // cube.rotation.x += 0.04;
    // cube.rotation.y += 0.02;

    renderer.render(scene, camera);
}
update();
