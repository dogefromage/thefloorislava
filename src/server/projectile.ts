import { GameObject } from "./game";
import * as THREE from 'three';
import { NoiseWorld } from "../common/noiseWorld";
import { GameObjectInformation, GameObjectPropertyType, GameObjectState, GameObjectType } from "../common/gameObjectTypes";

export class Projectile implements GameObject
{
    public isDead = false;

    constructor(
        public position: THREE.Vector3,
        public velocity: THREE.Vector3,
    )
    {
        
    }

    update(world: NoiseWorld, dt: number)
    {
        
    }

    onDeath()
    {

    }

    getInfo()
    {
        let info: GameObjectInformation =
        [
            GameObjectType.Projectile,
        ];
        return info;
    }

    getState()
    {
        let state: GameObjectState =
        [
            this.position.x,
            this.position.y,
            this.position.z,
        ];
        return state;
    }
}