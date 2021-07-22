import { NoiseWorld } from "./noiseWorld";
import * as THREE from 'three';
import { QuadraticBezierCurve, Quaternion } from "three";
import { Game } from "./game";
import { GameObject } from './gameObject';

export class ThirdPersonCamera implements GameObject
{
    state: 'dead' | 'alive' = 'alive';
    
    constructor(
        public game: Game, 
        public camera: THREE.PerspectiveCamera,
        public distance = 0.15,
        public aimSmoothness = 10,
        public moveSmoothness = 0.2) {}

    update(world: NoiseWorld, dt: number) {}
    
    lateUpdate(world: NoiseWorld, dt: number)
    {
        let mainPlayer = this.game.getMainPlayer();
        if (mainPlayer !== null)
        {
            // position
            let dirVector = mainPlayer.position.clone().sub(this.camera.position);
            let len = dirVector.length();
            
            if (len > this.distance)
            {
                let deltaP = dirVector.clone().multiplyScalar((len - this.distance) / len);
                this.camera.position.add(deltaP);
            }
    
            // rotation
            let rot = this.camera.quaternion.clone();
            this.camera.lookAt(mainPlayer.position);
            rot.slerp(this.camera.quaternion, this.aimSmoothness * dt);
            this.camera.rotation.setFromQuaternion(rot);
        }
    }

    onDeath() {}
}