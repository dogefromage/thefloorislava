import * as THREE from 'three';
import { NoiseWorld } from './noiseWorld';
import { MainPlayer, Player } from './player';
import { randomId } from '../common/utils';
import { ThirdPersonCamera } from './thirdPersonCamera';
import { GameObject } from './gameObject';
import * as dataCompressor from '../common/dataCompressor'; 
import * as io from 'socket.io-client';

export class Game
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

    private world: NoiseWorld;
    
    private mainPlayer: MainPlayer | null = null;

    private gameObjects: Map<string, GameObject> = new Map();

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

        this.world = new NoiseWorld(
            this,
            0, // seed
            new THREE.Box3( // bounds
                new THREE.Vector3(-2, -2, -2), 
                new THREE.Vector3(2, 2, 2))
            );

        requestAnimationFrame(() => this.update() );

        this.socket.on('server-data', (dataString) => this.setData(dataString));
    }

    joinPlayer(id: string, name: string)
    {
        if (id === this.socket.id)
        {
            const player = new MainPlayer(this, name, this.world.generateSpawningLocation());
            this.addGameObject(player, id);
            
            this.gameState = 'ingame';
            this.mainPlayer = player;
            this.mainCamera = 'player';
        }
        else
        {
            const player = new Player(this, name, this.world.generateSpawningLocation());
            this.addGameObject(player, id);
        }
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

    createUniqueID()
    {
        let id = '';
        do
        {
            id = randomId();
        }
        while (this.gameObjects.has(id))

        return id;
    }

    addGameObject(go: GameObject, id = this.createUniqueID())
    {
        this.gameObjects.set(id, go);
    }

    removeGameObject(go: string)
    {
        this.gameObjects.delete(go);
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
        /*
            note:
            https://stackoverflow.com/questions/35940216/es6-is-it-dangerous-to-delete-elements-from-set-map-during-set-map-iteration
        */

        for (let [ id, go ] of this.gameObjects)
        {
            go.update(this.world, dt);

            if (go.state === 'dead')
            {
                go.onDeath();
                this.removeGameObject(id);

                if (id === this.clientID)
                {
                    this.gameState = 'inmenu';
                    this.mainPlayer = null;

                    document.dispatchEvent(new CustomEvent('la-death', 
                    {
                        detail: 
                        {
                            
                        },
                    }));

                    setTimeout(() =>
                    {
                        this.mainCamera = 'menu';
                    }, 2000);
                }
            }
        }

        this.thirdPersonCamera.update(this.world, dt);

        /////////////// RENDER ////////////////
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

    setData(dataString: string)
    {
        let data = dataCompressor.dejsonify(dataString);
        let unknownIDs: string[] = [];

        for (let [ id, dataArr ] of data.go)
        {
            let go = this.gameObjects.get(id);
            if (go !== undefined)
            {
                let dataObj = dataCompressor.decompress(dataArr);
                go.setData(dataObj);
            }
            else
            {
                // ask server to send information about object (type, 3dmodel, names, etc)
                unknownIDs.push(id);
            }
        }

        if (unknownIDs.length > 0)
        {
            this.socket.emit('request-go-info', unknownIDs, (serverResponceData) =>
            {
                // create objects etc.
                console.log(serverResponceData);
            });
        }
    }
}
