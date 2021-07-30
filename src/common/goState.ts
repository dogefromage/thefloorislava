import { log } from "./debug";
import { GameObjectState } from "./gameObjectTypes";

export function stateRMSError(state1: GameObjectState, state2: GameObjectState)
{
    let err = 0;

    for (let i = 0; i < state1.length; i++)
    {
        err += (state1[i] - state2[i])**2;
    }

    return Math.sqrt(err);
}

export function lerpStates(state1: GameObjectState, state2: GameObjectState, t: number)
{
    if (state1.length != state2.length)
    {
        log('states dont match length!');
    }
    
    if (t > 1) t = 1;

    let newState: GameObjectState = [];

    for (let i = 0; i < state1.length; i++)
    {
        newState.push( state1[i] + t * (state2[i] - state1[i]) );
    }

    return newState;
}

export function integrateStates(state: GameObjectState, stateVelocity: GameObjectState, dt: number)
{
    if (state.length != stateVelocity.length)
    {
        log('states dont match length!');
    }
    
    let newState: GameObjectState = [];

    for (let i = 0; i < state.length; i++)
    {
        newState.push( state[i] + stateVelocity[i] * dt );
    }

    return newState;
}