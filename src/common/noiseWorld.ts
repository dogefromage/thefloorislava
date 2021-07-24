import { makeNoise4D, Noise4D } from '../open-simplex-noise/lib/4d';
import * as THREE from 'three';

export class NoiseWorld
{
    private noiseGenerator: Noise4D;
    
    public noiseOffset: THREE.Vector4;
    public noiseOffsetVelocity: THREE.Vector4;
    public isolevel = 0;

    constructor(
        public seed: number,
        public bounds: THREE.Box3,
        )
    {
        this.noiseGenerator = makeNoise4D(seed);
        
        this.noiseOffset = new THREE.Vector4(0, 0, 0, 0);
        this.noiseOffsetVelocity = new THREE.Vector4(0, 0, 0, 0);
    }

    update(dt: number)
    {
        let offsetAcceleration = new THREE.Vector4(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, 3 * (Math.random()));
        offsetAcceleration.setLength(0.05 * dt);
        this.noiseOffsetVelocity.add(offsetAcceleration);
        this.noiseOffsetVelocity.setLength(0.1);
        this.noiseOffset.add(this.noiseOffsetVelocity.clone().multiplyScalar(dt));
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
                return new THREE.Vector3(0, 0, 0);
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

    getState()
    {
        return [
            this.isolevel,
            this.noiseOffset.x, this.noiseOffset.y, this.noiseOffset.z, this.noiseOffset.w,
        ];
    }
}
