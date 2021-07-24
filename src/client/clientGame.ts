import * as THREE from 'three';
import { ClientNoiseWorld } from './clientNoiseWorld';
import { ClientMainPlayer, ClientPlayer } from './clientPlayer';
import { randomId } from '../common/utils';
import { ThirdPersonCamera } from './thirdPersonCamera';
import * as io from 'socket.io-client';
import { ClientDataRequest, GameObjectPropertyTypes, ServerGameData, GameObjectState } from '../common/gameObjectTypes';

export interface ClientGameObject
{
    update(world: ClientNoiseWorld, dt: number): void;
    
    onDeath(): void;

    setState(state: GameObjectState): void;
}

export class ClientGame
{
    private gameState: 'ingame' | 'inmenu' = 'inmenu';
    
    private renderer: THREE.Renderer;
    private scene: THREE.Scene;

    // cameras
    private menuCamera: THREE.PerspectiveCamera;
    private playerCamera: THREE.PerspectiveCamera;
    private thirdPersonCamera: ThirdPersonCamera;
    private mainCamera: 'menu' | 'player' = 'menu';

    private lastTime = new Date().getTime() / 1000;

    private world: ClientNoiseWorld;
    
    private mainPlayer?: ClientMainPlayer;

    private gameObjects = new Map<string, ClientGameObject>();

    private dataRequests = new Map<number, ClientDataRequest>();
    private lastDataRequestNumber = 0;
    
    constructor(
        private socket: io.Socket,
    )
    {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        window.addEventListener('resize', () => this.resize() );

        document.addEventListener('keydown', (e) => 
        {
            if (e.code == 'KeyR') this.resize();
        });

        this.scene = new THREE.Scene();

        this.menuCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.playerCamera = new THREE.PerspectiveCamera( 85, window.innerWidth / window.innerHeight, 0.01, 100 );

        this.thirdPersonCamera = new ThirdPersonCamera(this, this.playerCamera);

        const light = new THREE.DirectionalLight(0xFFFFFF, 0.9);
        light.position.set(3, 10, 3);
        light.target.position.set(0, 0, 0);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, .2));

        this.world = new ClientNoiseWorld(
            this,
            0, // seed 
            new THREE.Box3( // bounds
                new THREE.Vector3(-2, -2, -2), 
                new THREE.Vector3(2, 2, 2))
            );

        requestAnimationFrame(() => this.update() );

        this.socket.on('server-data', (jsonData, requestCallback) => this.setData(jsonData, requestCallback));
    }

    resize()
    {
        let aspect = window.innerWidth / window.innerHeight
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        
        this.playerCamera.aspect = aspect;
        this.playerCamera.updateProjectionMatrix();

        this.menuCamera.aspect = aspect;
        this.menuCamera.updateProjectionMatrix();
    }

    addToScene(obj: THREE.Object3D)
    {
        this.scene.add(obj);
    }

    removeFromScene(obj: THREE.Object3D)
    {
        this.scene.remove(obj);
    }

    getMainPlayer()
    {
        return this.mainPlayer;
    }

    getGameState()
    {
        return this.gameState;
    }

    update()
    {
        requestAnimationFrame(() => this.update() );

        //////////// TIME ////////////////
        let currentTime = new Date().getTime() / 1000;
        let dt = currentTime - this.lastTime;
        this.lastTime = currentTime;

        //////////// UPDATE WORLD ////////////////
        this.world.update(dt);

        //////////// UPDATE GAMEOBJECTS ////////////////
        for (let [ id, go ] of this.gameObjects)
        {
            go.update(this.world, dt);
        }

        /////////////// RENDER ////////////////
        this.thirdPersonCamera.update(this.world, dt);
        
        if (this.mainCamera === 'menu')
        {
            // orbit the cube
            this.menuCamera.position.y = 2.5;
            this.menuCamera.position.x = Math.sin(0.1 * currentTime) * 4.5;
            this.menuCamera.position.z = Math.cos(0.1 * currentTime) * 4.5;
            this.menuCamera.lookAt(0, 0, 0);

            this.renderer.render(this.scene, this.menuCamera);
        }
        else if (this.mainCamera === 'player')
        {
            this.renderer.render(this.scene, this.playerCamera);
        }
    }

    setData(dataString: string, requestCallback: (clientDataRequest: ClientDataRequest) => void)
    {
        // save all ids for late use
        let allClientIds = new Set<string>();
        for (let [ id, go ] of this.gameObjects)
        {
            allClientIds.add(id);
        }

        let serverData = <ServerGameData>JSON.parse(dataString);

        ////////////// ANSWER REQUEST //////////////
        if (serverData.id !== undefined)
        {
            let dataRequest = this.dataRequests.get(serverData.id);
            if (dataRequest !== undefined)
            {
                ////////////// INFORMATION FOR CREATING NEW OBJECTS //////////////
                if (serverData.in !== undefined)
                {
                    for (let i = 0; i < serverData.in.length; i++)
                    {
                        let id = dataRequest.in[i];
                        let info = serverData.in[i];

                        let name: string = '';
                        
                        /**
                         * loop through properties
                         */
                        for (let i = 0; i < info.length; )
                        {
                            let propertyType = info[i]; i++

                            switch (propertyType)
                            {
                                case GameObjectPropertyTypes.Name:
                                    if (i < info.length)
                                    {
                                        name = info[i].toString();
                                        i++;
                                    }
                                    break;

                                default:
                                    throw new Error('Property not found');
                            }
                        }

                        let oldGO = this.gameObjects.get(id);
                        if (oldGO !== undefined)
                        {
                            oldGO.onDeath();
                            this.gameObjects.delete(id);
                        }

                        if (id === this.socket.id)
                        {
                            let player = new ClientMainPlayer(this, name);
                            this.gameObjects.set(id, player);

                            this.mainPlayer = player;
                            this.gameState = 'ingame';
                            this.mainCamera = 'player';
                        }
                        else
                        {
                            let player = new ClientPlayer(this, name);
                            this.gameObjects.set(id, player);
                        }
                    }
                }

                ////////////// DELETION OF OLD OBJECTS //////////////
                if (serverData.ex !== undefined)
                {
                    for (let i = 0; i < serverData.ex.length; i++)
                    {
                        let id = dataRequest.ex[i];
                        let isStillExisting = serverData.ex[i];

                        if (isStillExisting === 0)
                        {
                            // remove gameobject
                            let go = this.gameObjects.get(id);

                            if (go !== undefined)
                            {
                                go.onDeath();
                                this.gameObjects.delete(id);
                                allClientIds.delete(id);
                        
                                if (id === this.socket.id)
                                {
                                    this.gameState = 'inmenu';
                                    this.mainPlayer = undefined;
                        
                                    document.dispatchEvent(new CustomEvent('la-death', { detail: {}, }));
                        
                                    setTimeout(() =>
                                    {
                                        this.mainCamera = 'menu';
                                    }, 2000);
                                }
                            }
                        }
                    }
                }

                this.dataRequests.delete(serverData.id);
            }
            else
            {
                console.log('data request unknown to client');
            }
        }

        ////////////// WORLD //////////////
        if (serverData.wo !== undefined)
        {
            this.world.setState(serverData.wo);
        }

        let newRequest: ClientDataRequest = 
        {
            id: this.lastDataRequestNumber,
            in: [],
            ex: [],
        };
        this.lastDataRequestNumber++;

        ////////////// GAMEOBJECTS //////////////
        if (serverData.go !== undefined)
        {
            for (let [ id, goState ] of serverData.go)
            {
                let go = this.gameObjects.get(id);

                if (go === undefined)
                {
                    /**
                     * doesn't know obj, ask for information with request
                     */
                    newRequest.in.push(id);
                }
                else
                {
                    go.setState(goState);
                }

                allClientIds.delete(id);
            }
        }

        /**
         * server hasn't sent any information about this gameObject,
         * ask if it still exists
         */
        for (let id of allClientIds)
        {
            newRequest.ex.push(id);
        }

        if (newRequest.in.length === 0 && newRequest.ex.length === 0)
        {
            // request is empty, do not send
            this.lastDataRequestNumber--;
        }
        else
        {
            this.dataRequests.set(newRequest.id, newRequest);

            // request has data, send
            requestCallback(newRequest);
        }
    }
}
