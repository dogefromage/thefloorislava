import * as THREE from 'three';
import { makeNoise4D, Noise4D } from './open-simplex-noise/lib/4d';
import { marchingCubes } from './marchingCubes';

export class NoiseWorld
{
    private noiseGenerator: Noise4D;
    private mesh: THREE.Mesh | null = null;
    private noiseOffset: THREE.Vector4;

    constructor(
        public scene: THREE.Scene, 
        public seed: number
        )
    {
        this.noiseGenerator = makeNoise4D(seed);
        
        this.noiseOffset = new THREE.Vector4();

        this.generateMesh();
    }

    update()
    {
        this.generateMesh();
    }

    generateMesh()
    {
        if (this.mesh !== null)
        {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
        }

        const noiseFunction = (x: number, y: number, z: number) => 
        {
            return this.noiseGenerator(
                this.noiseOffset.x + x,
                this.noiseOffset.y + y,
                this.noiseOffset.z + z,
                this.noiseOffset.w
            );
        }

        const geometry = marchingCubes(
            noiseFunction, 
            0,  // isolevel
            new THREE.Box3(
                new THREE.Vector3(-1, -1, -1), 
                new THREE.Vector3(1, 1, 1)), 
            0.1); // resolution

        this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }));

        this.scene.add(this.mesh);
    }
}
