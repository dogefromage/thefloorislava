import * as THREE from 'three';
import { Game, GameObject } from './game';
import { ClientInput, GameObjectInformation, GameObjectPropertyType, GameObjectState } from '../common/gameObjectTypes';
import { NoiseWorld } from '../common/noiseWorld';
import { log } from '../common/debug';
import { getRotation, movePlayer } from '../common/playerMovement';

export class Player implements GameObject
{
    public rotX = 0;
    public rotVelX = 0;
    public rotVelY = 0;

    private collider: THREE.BufferGeometry;
    private input: ClientInput = [ 0, 0 ];

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

    update(world: NoiseWorld, dt: number)
    {
        this.setState( movePlayer(this.getState(), this.input, dt ));

        ////////////// COLLISIONS ////////////////
        // create matrix to transform vertices to world space
        let rotation = getRotation(this.rotX, this.rotY);
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
        let info: GameObjectInformation = 
        [
            GameObjectPropertyType.Name, this.name
        ];

        return info;
    }

    setState(state: GameObjectState)
    {
        // set state
        if (state.length === 5)
        {
            this.position.x = state[0];
            this.position.y = state[1];
            this.position.z = state[2];
            this.rotX = state[3];
            this.rotY = state[4];
        }
        else
        {
            log('state did not match object');
            return;
        }
    }
    
    getState()
    {
        let state: GameObjectState = 
        [
            this.position.x, 
            this.position.y, 
            this.position.z, 
            this.rotX, 
            this.rotY,
        ];

        return state;
    }

    setInput(input: ClientInput)
    {
        this.input = input;
    }
}
