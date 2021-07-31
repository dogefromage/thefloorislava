import { NoiseWorld } from "../common/noiseWorld";
import * as THREE from 'three';
import { ClientDataRequest, ClientInput, GameObjectState, ServerGameData, GameObjectInformation } from "../common/gameObjectTypes";
import { Player } from "./player";
import { Octree } from "./octree";

export interface GameObject
{
    update(world: NoiseWorld, dt: number): void;
    
    isDead: boolean;
    onDeath(): void;

    /**
     * Information about object: name, model, type, etc. 
     * Sent only when requested.
     */
    getInfo(): GameObjectInformation;
    
    /**
     * Current state of object: position, velocity, rotation, etc.
     * Broadcasted continuously.
     */
    getState(): GameObjectState;
}

export class Game
{
    private world: NoiseWorld;

    private gameObjects = new Map<string, GameObject>();

    constructor(public worldSeed: number)
    {
        this.world = new NoiseWorld(
            this.worldSeed, // seed 
            new THREE.Box3( // bounds
                new THREE.Vector3(-2, -2, -2), 
                new THREE.Vector3(2, 2, 2))
            );
    }

    *gameObjectsOfType(Type: any)
    {
        for (let pair of this.gameObjects)
        {
            if (pair[1] instanceof Type)
            {
                yield pair;
            }
        }

        return;
    }

    update(dt: number)
    {
        ////////// WORLD //////////
        this.world.update(dt);

        ////////// GAMEOBJECTS //////////
        for (let [ id, go ] of this.gameObjects)
        {
            go.update(this.world, dt);

            if (go.isDead)
            {
                go.onDeath();
                this.gameObjects.delete(id);
            }
        }

        //////// OCTREE //////////
        const octree = new Octree<GameObject>(this.world.bounds);
        for (let [ id, go ] of this.gameObjects)
        {
            let bounds = (<any>go).getBounds?.();

            if (bounds instanceof THREE.Box3)
            {
                octree.insert(bounds, go);
            }
        }

        
    }

    /**
     * Returns ServerGameData containing all states of gameObjects, excluding the special requests of clients.
     */
    getBasicServerData()
    {
        let basicData: { wo: number[], go: [ string, GameObjectState ][] } = 
        {
            wo: this.world.getState(),
            go: [],
        };

        for (let [ id, go ] of this.gameObjects)
        {
            basicData.go.push([ id, go.getState() ]);
        };

        return basicData;
    }

    getClientSpecificGameData(req: ClientDataRequest)
    {
        let data: { in?: GameObjectInformation[], ex?: number[] } = {};

        if (req.in !== undefined)
        {
            data.in = [];

            for (let id of req.in)
            {
                let obj = this.gameObjects.get(id);
                if (obj !== undefined)
                {
                    data.in.push(obj.getInfo());
                }
                else
                {
                    // if the object is deleted before info was requested, the client receives an empty array
                    data.in.push([]);
                }
            }
        }

        if (req.ex !== undefined)
        {
            data.ex = [];

            for (let id of req.ex)
            {
                if (this.gameObjects.has(id))
                {
                    data.ex.push(1);
                }
                else
                {
                    data.ex.push(0);
                }
            }
        }

        return data;
    }

    addPlayer(id: string, name: string)
    {
        const player = new Player(this, this.world.generateSpawningLocation(), name);

        this.gameObjects.set(id, player);
    }

    removePlayer(id: string)
    {
        let player = this.gameObjects.get(id);
        if (player !== undefined)
        {
            player.isDead = true;
        }
    }

    setInput(id: string, input: ClientInput)
    {
        let player = this.gameObjects.get(id);
        
        if (player !== undefined)
        {
            if (player instanceof Player)
            {
                player.setInput(input);
            }
        }
    }
}