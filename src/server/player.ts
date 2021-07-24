import * as THREE from 'three';
import { Game, GameObject } from './game';
import { GameObjectPropertyTypes, GameObjectState } from '../common/gameObjectTypes';
import { NoiseWorld } from '../common/noiseWorld';

export class Player implements GameObject
{
    public rotX = 0;
    public rotVelX = 0;
    public rotVelY = 0;

    private collider: THREE.BufferGeometry;

    public isDead = false;

    constructor(
        private game: Game, 
        public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        public name: string,
        public rotY: number = Math.random() * 6.283)    
    {
        let scale = 0.05;

        this.collider = 
            new THREE.WireframeGeometry(new THREE.CylinderGeometry(scale * 0.4, scale * 0.45, scale * 1.7, 5, 1, true)); 
    }

    getRotation()
    {
        return new THREE.Euler(this.rotX, this.rotY, 0, 'YXZ');
    }

    update(world: NoiseWorld, dt: number)
    {
        ////////////// MOVEMENT ////////////////
        let speed = 0.5;
        let movementVector = new THREE.Vector3(0, 0, speed * dt).applyEuler(this.getRotation());
        this.position.add(movementVector);

        ////////////// COLLISIONS ////////////////
        // create matrix to transform vertices to world space
        let rotation = this.getRotation();
        rotation.x += 1.570796; // 90°
        let rotationQuat = new THREE.Quaternion().setFromEuler(rotation);
        let matrix = new THREE.Matrix4().compose(this.position, rotationQuat, new THREE.Vector3(1,1,1));
        
        let isColliding = false;
        let positions = this.collider.attributes["position"].array;
        for (let i = 0; i < positions.length; i += 3)
        {
            let p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            p = p.applyMatrix4(matrix);
            
            if (world.isInWall(p.x, p.y, p.z))
            {
                isColliding = true;
            }
        }

        if (isColliding)
        {
            this.isDead = true;
        }
    }

    onDeath()
    {
        this.collider.dispose();
    }
    
    getInfo()
    {
        let info: GameObjectState = 
        [
            GameObjectPropertyTypes.Name, this.name
        ];

        return info;
    }
    
    getState()
    {
        let state: GameObjectState = 
        [
            GameObjectPropertyTypes.Position, this.position.x, this.position.y, this.position.z,
            GameObjectPropertyTypes.Rotation, this.rotX, this.rotY,
        ];

        return state;
    }    
}
