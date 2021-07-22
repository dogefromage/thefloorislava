import { NoiseWorld } from "./noiseWorld";

export interface GameObject
{
    state: 'alive' | 'dead';

    update(world: NoiseWorld, dt: number): void;

    lateUpdate?(world: NoiseWorld, dt: number): void;

    onDeath(): void;
}