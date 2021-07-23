import { NoiseWorld } from "./noiseWorld";
import * as dataCompressor from '../common/dataCompressor'; 

export interface GameObject
{
    state: 'alive' | 'dead';

    update(world: NoiseWorld, dt: number): void;

    onDeath(): void;

    setData(data: dataCompressor.GameObjectData): void;
}