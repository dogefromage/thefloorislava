import * as THREE from 'three';
import { ClientGame } from './clientGame';
import { ClientNoiseWorld } from './clientNoiseWorld';
import { getModel, disposeObject } from './assetsLoader';
import { ClientGameObject } from './clientGame';
import { ClientData, ClientInput, GameObjectPropertyType, GameObjectState } from '../common/gameObjectTypes';
import * as INPUT from './input';
import { log } from '../common/debug';
import { movePlayer, getRotation } from '../common/playerMovement';
import { integrateStates, lerpStates, stateRMSError } from '../common/goState';

export class ClientPlayer implements ClientGameObject
{
    private mesh: THREE.Object3D;
    
    public position = new THREE.Vector3();
    public rotX = 0;
    public rotY = 0;

    private colliderVisible = false;
    private collider: THREE.LineSegments;

    private avgServerDeltaTime = -1;
    private stateVelocity: GameObjectState | undefined;

    constructor(private game: ClientGame, public name: string)    
    {
        let scale = 0.05;
        // start mesh
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.mesh.position.copy(this.position);
        this.mesh.scale.set(scale, scale, scale);

        this.game.addToScene(this.mesh);

        // make into promise!!
        getModel('assets/models/spaceship.obj', (model: THREE.Object3D) => 
        {
            // replace old mesh
            this.game.removeFromScene(this.mesh);
            this.mesh = model;
            this.game.addToScene(this.mesh);
            this.mesh.position.copy(this.position);
            this.mesh.scale.set(scale, scale, scale);
        });
            
        this.collider = new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.CylinderGeometry(scale * 0.4, scale * 0.45, scale * 1.7, 5, 1, true)), 
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    }

    setColliderVisibility(visibility: boolean)
    {
        if (visibility !== this.colliderVisible)
        {
            if (visibility)
            {
                this.game.addToScene(this.collider);
            }
            else
            {
                this.game.removeFromScene(this.collider);
            }

            this.colliderVisible = visibility;
        }
    }

    update(world: ClientNoiseWorld, dt: number)
    {
        // rotation.x += 1.570796;
        // this.collider.position.copy(this.position);
        // this.collider.rotation.copy(rotation);

        // ////////////// COLLISIONS ////////////////
        // this.collider.updateWorldMatrix(true, false);

        // let isColliding = false;
        // if (this.collider.geometry instanceof THREE.BufferGeometry)
        // {
        //     let positions = this.collider.geometry.attributes["position"].array;
        //     for (let i = 0; i < positions.length; i += 3)
        //     {
        //         let p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        //         p = this.collider.localToWorld(p);
                
        //         if (world.isInWall(p.x, p.y, p.z))
        //         {
        //             isColliding = true;
        //         }
        //     }
        // }
        
        // if (this.colliderVisible)
        // {
        //     if (this.collider.material instanceof THREE.LineBasicMaterial)
        //     {
        //         this.collider.material.color = new THREE.Color(isColliding ? 0xff0000 : 0xffffff);
        //     }
        // }

        // if (isColliding)
        // {
        //     this.state = 'dead';
        // }

        /**
         * interpolate between server values
         */
        if (this.stateVelocity !== undefined)
        {
            let state = this.getState();
            state = integrateStates(state, this.stateVelocity, dt);
            this.setState(state);
        }

        ////////////// MODEL AND ANIMATION ////////////////
        let rotation = getRotation(this.rotX, this.rotY);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(rotation);

        if (this.mesh.children.length === 3)
        {
            this.mesh.children[1].rotation.z += 0.5 * dt;
            this.mesh.children[2].rotation.z += -0.7 * dt;
        }
    }

    onDeath()
    {
        this.game.removeFromScene(this.mesh);
        disposeObject(this.mesh);

        this.game.removeFromScene(this.collider);
        disposeObject(this.collider);
    }

    getState()
    {
        let state: number[] = 
        [
            this.position.x,
            this.position.y,
            this.position.z,
            this.rotX,
            this.rotY
        ];

        return state;
    }

    setState(state: GameObjectState)
    {
        for (let i = 0; i < state.length; i++)
        {
            if (isNaN(state[i]))
            {
                state[i] = 0;
                log('object state property is nan');
            }
        }

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
        }
    }

    onServerData(state: GameObjectState, dataIndex: number, avgServerDeltaTime: number)
    {
        // for first call
        if (this.stateVelocity === undefined)
        {
            this.setState(state);
        }
        
        let currState = this.getState();
        if (currState.length != state.length)
        {
            log('states do not match!');
        }

        /**
         * calculate state velocity for smoothly updating object during this.update()
         */
        this.stateVelocity = [];

        for (let i = 0; i < currState.length; i++)
        {
            this.stateVelocity.push((state[i] - currState[i]) / avgServerDeltaTime);
        }
    }
}

interface InputQueueObject
{
    dt: number,
    index: number,
    input: ClientInput,
};

export class ClientMainPlayer extends ClientPlayer
{
    public targetState = [ 0, 0, 0, 0, 0 ];
    private lastInputBufferIndex = 0;
    public inputQueue: InputQueueObject[] = [];

    saveState(dt: number, index: number, input: ClientInput)
    {
        let state: InputQueueObject = 
        {
            dt,
            index,
            input
        };

        this.inputQueue.push(state);
    }

    onServerData(serverState: GameObjectState, dataIndex: number, avgServerDeltaTime: number)
    {
        // cut off old part from stateQueue
        while (true)
        {
            if (this.inputQueue.length === 0)
            {
                break;
            }
            
            if (dataIndex < this.inputQueue[0].index)
            {
                break;
            }

            this.inputQueue.shift();
        }

        // simulate forwards
        for (let i = 0; i < this.inputQueue.length; i++)
        {
            let inputObj = this.inputQueue[i];
            serverState = movePlayer(serverState, inputObj.input, inputObj.dt);
        }

        this.targetState = serverState;
    }

    update(world: ClientNoiseWorld, dt: number)
    {
        let inputAxes = INPUT.getAxesDelta(this.lastInputBufferIndex);
        this.lastInputBufferIndex = INPUT.getCurrentIndex();

        let state = movePlayer(this.getState(), inputAxes, dt);
        this.targetState = movePlayer(this.targetState, inputAxes, dt);

        state = lerpStates(state, this.targetState, dt);

        this.setState(state);

        // fully accept target if too far off
        let stateErr = stateRMSError(this.targetState, state);
        if (stateErr > 1.0)
        {
            this.setState(this.targetState);
        }

        super.update(world, dt);
    }
}
