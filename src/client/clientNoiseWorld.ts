import * as THREE from 'three';
import { marchingCubes } from './marchingCubes';
import { ClientGame } from './clientGame';
import { NoiseWorld } from '../common/noiseWorld';

export class ClientNoiseWorld extends NoiseWorld
{
    private mesh: THREE.Mesh | null = null;

    constructor(
        private game: ClientGame, 
        public seed: number,
        public bounds: THREE.Box3,
        )
    {
        super(seed, bounds);

        this.generateMesh();

        // generate outlinebox
        const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
        // const transparentMaterial = new THREE.MeshBasicMaterial({
        const transparentMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaffff,
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide,
            flatShading: true,
          });
        const box = new THREE.Mesh(boxGeometry, transparentMaterial);

        this.game.addToScene(box);
    }

    update(dt: number)
    {
        // interpolate

        this.generateMesh();
    }

    setState(data: number[])
    {
        if (data.length === 5)
        {
            this.isolevel =      data[0];
            this.noiseOffset.x = data[1];
            this.noiseOffset.y = data[2];
            this.noiseOffset.z = data[3];
            this.noiseOffset.w = data[4];
        }
        else
        {
            throw new Error('lol');
        }
    }

    generateMesh()
    {
        const geometry = marchingCubes(
            (x: number, y: number, z: number) => this.getNoiseValue(x, y, z), 
            this.isolevel,  // isolevel
            this.bounds,
            0.1); // resolution

        if (this.mesh == null)
        {
            const material = new THREE.MeshNormalMaterial();
            // const material = new THREE.MeshPhongMaterial();
            // new THREE.MeshBasicMaterial({ color: 0xffff00 })
    
            this.mesh = new THREE.Mesh(geometry, material);
    
            this.game.addToScene(this.mesh);
        }
        else
        {
            this.mesh.geometry.dispose();
            this.mesh.geometry = geometry;
        }
    }
}
