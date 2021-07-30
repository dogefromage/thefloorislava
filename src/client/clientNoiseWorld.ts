import * as THREE from 'three';
import { marchingCubes } from './marchingCubes';
import { ClientGame } from './clientGame';
import { NoiseWorld } from '../common/noiseWorld';
import { log } from '../common/debug';
import { GameObjectState } from '../common/gameObjectTypes';
import { integrateStates } from '../common/goState';

export class ClientNoiseWorld extends NoiseWorld
{
    private mesh: THREE.Mesh | null = null;

    private stateVelocity: GameObjectState | undefined;

    constructor(
        private game: ClientGame, 
        public seed: number,
        public bounds: THREE.Box3,
        )
    {
        super(seed, bounds);

        this.generateMesh();

        // generate outlinebox
        const boxGeometry = new THREE.BoxGeometry(4, 4, 4);
        // const transparentMaterial = new THREE.MeshBasicMaterial({
        const transparentMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaffff,
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide,
            flatShading: true,
          });
        const box = new THREE.Mesh(boxGeometry, transparentMaterial);

        this.game.addToScene(box);
    }

    update(dt: number)
    {
        /**
         * interpolate between server values
         */
         if (this.stateVelocity !== undefined)
         {
             let state = this.getState();
             state = integrateStates(state, this.stateVelocity, dt);
             this.setState(state);
         }

        this.generateMesh();
    }

    setState(state: GameObjectState)
    {
        if (state.length === 5)
        {
            this.isolevel =      state[0];
            this.noiseOffset.x = state[1];
            this.noiseOffset.y = state[2];
            this.noiseOffset.z = state[3];
            this.noiseOffset.w = state[4];
        }
        else
        {
            log('state does not work');
        }
    }

    getState(): GameObjectState
    {
        return [
            this.isolevel,
            this.noiseOffset.x,
            this.noiseOffset.y,
            this.noiseOffset.z,
            this.noiseOffset.w,
        ]
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

    generateMesh()
    {
        const geometry = marchingCubes(
            (x: number, y: number, z: number) => this.getNoiseValue(x, y, z), 
            this.isolevel,  // isolevel
            this.bounds,
            0.1); // resolution

        if (this.mesh == null)
        {
            const material = new THREE.MeshNormalMaterial();
            // const material = new THREE.MeshPhongMaterial();
            // new THREE.MeshBasicMaterial({ color: 0xffff00 })
    
            this.mesh = new THREE.Mesh(geometry, material);
    
            this.game.addToScene(this.mesh);
        }
        else
        {
            this.mesh.geometry.dispose();
            this.mesh.geometry = geometry;
        }
    }
}
