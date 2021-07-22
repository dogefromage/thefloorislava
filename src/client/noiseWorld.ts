import * as THREE from 'three';
import { makeNoise4D, Noise4D } from './open-simplex-noise/lib/4d';
import { marchingCubes } from './marchingCubes';
import { Vector3 } from 'three';
import { Game } from './game';

export class NoiseWorld
{
    private noiseGenerator: Noise4D;
    private mesh: THREE.Mesh | null = null;
    private noiseOffset: THREE.Vector4;
    private noiseOffsetVelocity: THREE.Vector4;
    private isolevel = 0;

    constructor(
        private game: Game, 
        public seed: number,
        public bounds: THREE.Box3,
        )
    {
        this.noiseGenerator = makeNoise4D(seed);
        
        this.noiseOffset = new THREE.Vector4(0, 0, 0, 0);
        this.noiseOffsetVelocity = new THREE.Vector4(0, 0, 0, 0);

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
        let offsetAcceleration = new THREE.Vector4(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, 3 * (Math.random()));
        offsetAcceleration.setLength(0.05 * dt);
        this.noiseOffsetVelocity.add(offsetAcceleration);
        this.noiseOffsetVelocity.setLength(0.1);
        this.noiseOffset.add(this.noiseOffsetVelocity.clone().multiplyScalar(dt));

        this.generateMesh();
    }

    isInWall(x: number, y: number, z: number)
    {
        let inNoise = this.getNoiseValue(x, y, z) > this.isolevel;
        let inBounds = this.bounds.containsPoint(new THREE.Vector3(x, y, z));
        return (inNoise || !inBounds);
    }

    getGradient(p: THREE.Vector3)
    {
        const epsilon = 0.001;
        
        // compute gradient of noise using partial derivatives 

        let deltaX = this.getNoiseValue(p.x + epsilon, p.y, p.z) - this.getNoiseValue(p.x - epsilon, p.y, p.z);
        let deltaY = this.getNoiseValue(p.x, p.y + epsilon, p.z) - this.getNoiseValue(p.x, p.y - epsilon, p.z);
        let deltaZ = this.getNoiseValue(p.x, p.y, p.z + epsilon) - this.getNoiseValue(p.x, p.y, p.z - epsilon);
        
        return new THREE.Vector3(
            deltaX / (2 * epsilon),
            deltaY / (2 * epsilon),
            deltaZ / (2 * epsilon),
        );
    }

    generateSpawningLocation()
    {
        const maxIsoval = -0.5;

        let pos = new THREE.Vector3();

        let iterations = 0;

        // attempt over and over until spawning location is valid
        while (true)
        {
            // get random position inside bounds (lerp)
            pos.random().multiply(this.bounds.max.clone().sub(this.bounds.min)).add(this.bounds.min);

            // gradient descend of position through noise world
            for (let i = 0; i < 10; i++) // 10 iterations per attempt
            {
                let gradientAtPos = this.getGradient(pos);
                pos.add( gradientAtPos.multiplyScalar( -0.1 ) ); // alpha = 0.1
            }            

            // pos must be inside bounds
            // pos must be above min isolevel

            if (this.bounds.containsPoint(pos) && 
                this.getNoiseValue(pos.x, pos.y, pos.z) < maxIsoval)
            {
                return pos;
            }

            iterations++;
            if (iterations > 100) // failsafe
            {
                return new Vector3(0, 0, 0);
            }
        }
    }

    getNoiseValue(x: number, y: number, z: number)
    {
        return this.noiseGenerator(
            this.noiseOffset.x + x,
            this.noiseOffset.y + y,
            this.noiseOffset.z + z,
            this.noiseOffset.w
        );
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
