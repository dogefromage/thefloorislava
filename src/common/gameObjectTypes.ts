

/**
 * Enum acting as key for properties which are sent between server and client.
 * Using a number instead of strings safes bandwidth.
 */
export const enum GameObjectPropertyTypes
{
    Position,
    Rotation,
    Name,
};

/**
 * A GameObjectState is an array of state items of an object.
 * The array should only contain GameObjectPropertyTypes followed by values for the corresponding property.
 */
export type GameObjectState = ( GameObjectPropertyTypes | string | number )[];

/**
 * If a client either 
 *  - unique id
 *  - wants to know information about a gameObject or 
 *  - wants to asks if an object still exists,
 * the client should add its ID into the corresponding array
 * and send the request to the server. 
 */
export interface ClientDataRequest
{
    id: number,      // identifier
    in: string[],   // info
    ex: string[]    // exists
};

/**
 * ServerGameData is sent to the client and contains 
 *  - id: identifier which maches request id.
 *  - wo: the current world state.
 *  - go: a key-value pair list of all gameObject states.
 *  - in: the info which was requested in the ClientDataRequest in same order as requested.
 *  - ex: a 0 or 1 depending if the object still exists in the same order as requested.
 */
export interface ServerGameData
{
    id?: number,
    wo?: number[];
    go?: [ string, GameObjectState ][],
    in?: GameObjectState[],
    ex?: number[],
}