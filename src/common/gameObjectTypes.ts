import { ClientGameObject } from "../client/clientGame";


/**
 * Enum acting as key for properties which are sent between server and client.
 * Using a number instead of strings safes bandwidth.
 */
export const enum GameObjectPropertyType
{
    Name,
};

/**
 * list of gameobject types
 */
export const enum GameObjectType
{
    Player,
    Projectile,
}

export type GameObjectInformation = ( GameObjectType | GameObjectPropertyType | number | string )[];

export type GameObjectState = number[];

/**
 * ServerGameData is sent to the client and contains 
 *  - ix: identifier which maches request index.
 *  - wo: the current world state.
 *  - go: a key-value pair list of all gameObject states.
 *  - in: the info which was requested in the ClientDataRequest in same order as requested.
 *  - ex: a 0 or 1 depending if the object still exists in the same order as requested.
 */
export interface ServerGameData
{
    ix: number,
    wo?: GameObjectState;
    go?: [ string, GameObjectState ][],
    in?: GameObjectInformation[],
    ex?: number[],
}

/**
 * If a client either 
 *  - in: wants to know information about a gameObject or 
 *  - ex: wants to asks if an object still exists,
 * the client should add its ID into the corresponding array
 * and send the request to the server. 
 *  - id: is used to match the request of server and client.
 */
export interface ClientDataRequest
{
    in: string[],   // info
    ex: string[]    // exists
};

export type ClientInput = [ number, number ];

/**
 * The clients sends this object back after receiving server data.
 * - ix: index used for mainPlayer prediction
 * - in: user input
 * - re: clientDataRequest
 */
export interface ClientData
{
    ix: number,
    in: ClientInput,
    re?: ClientDataRequest
}