import * as THREE from 'three';
import { ClientGame } from './clientGame';
import { ClientNoiseWorld } from './clientNoiseWorld';
import { getModel } from './assetsLoader';
import { getAxes } from './input';
import { lerpClamp } from '../common/utils';
import { ClientGameObject } from './clientGame';
import { GameObjectPropertyTypes, GameObjectState } from '../common/gameObjectTypes';

export class ClientPlayer implements ClientGameObject
{
    private mesh: THREE.Object3D;
    
    public position = new THREE.Vector3();
    public rotX = 0;
    public rotY = 0;
    // public rotVelX = 0;
    // public rotVelY = 0;

    private colliderVisible = false;
    private collider: THREE.LineSegments;

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

    getRotation()
    {
        return new THREE.Euler(this.rotX, this.rotY, 0, 'YXZ');
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
        // ////////////// MOVEMENT ////////////////
        // let speed = 0.5;
        // let movementVector = new THREE.Vector3(0, 0, speed * dt).applyEuler(this.getRotation());
        // this.position.add(movementVector);

        let rotation = this.getRotation();
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(rotation);

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

        ////////////// ANIMATION ////////////////
        if (this.mesh.children.length === 3)
        {
            this.mesh.children[1].rotation.z += 0.5 * dt;
            this.mesh.children[2].rotation.z += -0.7 * dt;
        }
    }

    onDeath()
    {
        this.game.removeFromScene(this.mesh);
        this.game.removeFromScene(this.collider);
    }

    setState(state: GameObjectState)
    {
        let i = 0;
        while (i < state.length)
        {
            let propertyType = state[i]; i++;
            switch (propertyType)
            {
                case GameObjectPropertyTypes.Position:
                    this.position.x = Number(state[i]); i++;
                    this.position.y = Number(state[i]); i++;
                    this.position.z = Number(state[i]); i++;
                    break;

                case GameObjectPropertyTypes.Rotation:
                    this.rotX = Number(state[i]); i++;
                    this.rotY = Number(state[i]); i++;
                    break;

                default:
                    throw new Error('something must have happened');
            }
        }
    }
}

export class ClientMainPlayer extends ClientPlayer
{
    private lastAxisToken = -1;

    update(world: ClientNoiseWorld, dt: number)
    {
        ////////////// ROTATION ////////////////
        // let [ inputX, inputY, axisToken ] = getAxes();
        // if (true) inputX = -inputX;
        // if (false) inputY = -inputY;

        // const rotSmooth = 5;
        // const sensitivity = 0.15;
        
        // if (axisToken == this.lastAxisToken) // new input
        // {
        //     inputX = inputY = 0;
        // }
        // this.lastAxisToken = axisToken;

        // this.rotVelX = lerpClamp(this.rotVelX, sensitivity * inputY, rotSmooth * dt);
        // this.rotVelY = lerpClamp(this.rotVelY, sensitivity * inputX, rotSmooth * dt);

        // this.rotX += this.rotVelX * dt;
        // this.rotY += this.rotVelY * dt;

        // if (this.rotX > 1.570796) this.rotX = 1.570796;
        // else if (this.rotX < -1.570796) this.rotX = -1.570796;

        super.update(world, dt);
    }
}
