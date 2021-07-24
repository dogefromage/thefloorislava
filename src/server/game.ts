import { NoiseWorld } from "../common/noiseWorld";
import * as THREE from 'three';
import { ClientDataRequest, GameObjectState, ServerGameData } from "../common/gameObjectTypes";
import { Player } from "./player";

export interface GameObject
{
    update(world: NoiseWorld, dt: number): void;
    
    isDead: boolean;
    onDeath(): void;

    /**
     * Information about object: name, model, type, etc. 
     * Sent only when requested.
     */
    getInfo(): GameObjectState;
    
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

    constructor()
    {
        this.world = new NoiseWorld(
            0, // seed 
            new THREE.Box3( // bounds
                new THREE.Vector3(-2, -2, -2), 
                new THREE.Vector3(2, 2, 2))
            );
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
    }

    /**
     * Returns ServerGameData containing all states of gameObjects, excluding the special requests of clients.
     */
    getBasicServerData()
    {
        let gameData: ServerGameData = 
        {
            wo: this.world.getState(),
            go: [],
        };

        for (let [ id, go ] of this.gameObjects)
        {
            gameData.go?.push([ id, go.getState() ]);
        };

        return gameData;
    }

    getClientSpecificGameData(req: ClientDataRequest)
    {
        let data: ServerGameData = 
        {
            id: req.id,
        };

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
}