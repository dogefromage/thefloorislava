import * as THREE from 'three';
import { ClientNoiseWorld } from './clientNoiseWorld';
import { ClientMainPlayer, ClientPlayer } from './clientPlayer';
import { ThirdPersonCamera } from './thirdPersonCamera';
import * as io from 'socket.io-client';
import { ClientDataRequest, GameObjectPropertyType, ServerGameData, GameObjectState, ClientData, GameObjectType } from '../common/gameObjectTypes';
import * as INPUT from './input';
import { lerp } from 'three/src/math/MathUtils';

export interface ClientGameObject
{
    update(world: ClientNoiseWorld, dt: number): void;
    
    onDeath(): void;

    onServerData(serverState: GameObjectState, dataIndex: number, avgServerDeltaTime: number): void;
}

/**
 * holds server state until client knows information to create object
 */
class DummyGameObject implements ClientGameObject
{
    constructor(public state: GameObjectState) {}

    update(world: ClientNoiseWorld, dt: number) {}
    onDeath() {};

    onServerData(serverState: GameObjectState, dataIndex: number)
    {
        this.state = serverState;
    }
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

    private lastServerDataMillis = new Date().getTime();
    private lastInputBufferIndex = 0;
    private avgServerDeltaTime = -1;

    private currentDataIndex = 0;
    
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

        this.socket.on('server-data', 
            (jsonData, requestCallback) => this.onData(jsonData, requestCallback)
            );
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
        requestAnimationFrame( () => this.update() );

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
            let dist = 2.5;
            this.menuCamera.position.y = dist;
            this.menuCamera.position.x = Math.sin(0.1 * currentTime) * dist * 2;
            this.menuCamera.position.z = Math.cos(0.1 * currentTime) * dist * 2;
            this.menuCamera.lookAt(0, 0, 0);

            this.renderer.render(this.scene, this.menuCamera);
        }
        else if (this.mainCamera === 'player')
        {
            this.renderer.render(this.scene, this.playerCamera);
        }
    }

    onData(dataString: string, clientDataCallback: (clientData: ClientData) => void)
    {
        let currentMillis = new Date().getTime();
        let dtServer = 0.001 * (currentMillis - this.lastServerDataMillis);

        if (this.avgServerDeltaTime < 0)
        {
            this.avgServerDeltaTime = dtServer;
        }
        else
        {
            // rolling average
            this.avgServerDeltaTime = lerp(this.avgServerDeltaTime, dtServer, 0.2);
        }

        // safety
        if (this.avgServerDeltaTime === 0) this.avgServerDeltaTime = 0.1;
        
        /**
         * clientdataObject which will be sent back to the server
         */
        this.currentDataIndex++;

        let clientData: ClientData = 
        {
            ix: this.currentDataIndex,
            in: INPUT.getAxesDelta(this.lastInputBufferIndex)
        };

        if (this.mainPlayer !== undefined)
        {
            this.mainPlayer.saveState(dtServer, clientData.ix, clientData.in);
        }
        this.lastInputBufferIndex = INPUT.getCurrentIndex();


        // save all ids for late use
        let allClientIds = new Set<string>();
        for (let [ id, go ] of this.gameObjects)
        {
            allClientIds.add(id);
        }

        let serverData = <ServerGameData>JSON.parse(dataString);

        ////////////// ANSWER REQUEST //////////////
        if (serverData.in !== undefined || serverData.ex !== undefined)
        {
            let dataRequest = this.dataRequests.get(serverData.ix);
            if (dataRequest !== undefined)
            {
                ////////////// INFORMATION FOR CREATING NEW OBJECTS //////////////
                if (serverData.in !== undefined)
                {
                    for (let i = 0; i < serverData.in.length; i++)
                    {
                        let id = dataRequest.in[i];
                        let info = serverData.in[i];

                        let goType = <GameObjectType>info[0];

                        // extract all properties, starting at index 1
                        let goProperties = new Map<GameObjectPropertyType, string | number>();
                        for (let i = 1; i < info.length; i += 2)
                        {
                            let property = <GameObjectPropertyType>info[i];
                            goProperties.set(property, info[i + 1]);
                        }

                        let prevState: GameObjectState | undefined;

                        let oldGO = this.gameObjects.get(id);
                        if (oldGO !== undefined)
                        {
                            if (oldGO instanceof DummyGameObject)
                            {
                                prevState = oldGO.state;
                            }

                            oldGO.onDeath();
                            this.gameObjects.delete(id);
                        }

                        let newGo: ClientGameObject | undefined;
 
                        if (goType === GameObjectType.Player)
                        {
                            let name = 'noname';
                            let nameProperty = goProperties.get(GameObjectPropertyType.Name);
                            if (typeof nameProperty === 'string')
                            {
                                name = nameProperty;
                            }

                            if (id === this.socket.id)
                            {
                                const mp = new ClientMainPlayer(this, name);
                                this.mainPlayer = mp;
                                this.gameState = 'ingame';
                                this.mainCamera = 'player';
                                newGo = mp;
                            }
                            else
                            {
                                newGo = new ClientPlayer(this, name);
                            }
                        }
                        else if (goType === GameObjectType.Projectile)
                        {
                            throw new Error('gagi');
                        }

                        if (newGo !== undefined)
                        {
                            if (prevState !== undefined)
                            {
                                newGo.onServerData(prevState, -1, this.avgServerDeltaTime);
                            }

                            this.gameObjects.set(id, newGo);
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
                                    }, 1000);
                                }
                            }
                        }
                    }
                }
    
                this.dataRequests.delete(serverData.ix);
            }
            else
            {
                console.log('request not found');
            }
        }

        ////////////// WORLD //////////////
        if (serverData.wo !== undefined)
        {
            this.world.onServerData(serverData.wo, serverData.ix, this.avgServerDeltaTime);
        }

        let newRequest: ClientDataRequest = 
        {
            in: [],
            ex: [],
        };

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
                     * & create dummy obj
                     */
                    newRequest.in.push(id);

                    const dummy = new DummyGameObject(goState);
                    this.gameObjects.set(id, dummy);
                }
                else
                {
                    go.onServerData(goState, serverData.ix, this.avgServerDeltaTime);
                }

                allClientIds.delete(id);
            }
        }

        /**
         * server hasn't sent any information about these ids,
         * ask if their objects still exist
         */
        for (let id of allClientIds)
        {
            newRequest.ex.push(id);
        }

        if (newRequest.in.length > 0 || newRequest.ex.length > 0)
        {
            // request has data, therefore save and attach to clientData
            this.dataRequests.set(this.currentDataIndex, newRequest);

            clientData.re = newRequest;
        }

        // send back clientData to server
        clientDataCallback(clientData);

        this.lastServerDataMillis = currentMillis;
    }
}
