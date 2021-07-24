import { ClientNoiseWorld } from "./clientNoiseWorld";
import * as THREE from 'three';
import { ClientGame } from "./clientGame";

export class ThirdPersonCamera
{
    state: 'dead' | 'alive' = 'alive';
    
    constructor(
        public game: ClientGame, 
        public camera: THREE.PerspectiveCamera,
        public distance = 0.15,
        public aimSmoothness = 10,
        public moveSmoothness = 0.2) {}

    update(world: ClientNoiseWorld, dt: number)
    {
        let mainPlayer = this.game.getMainPlayer();
        if (mainPlayer !== undefined)
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