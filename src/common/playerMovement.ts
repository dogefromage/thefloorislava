import * as THREE from 'three';
import { GameObjectState, ClientInput } from './gameObjectTypes';

export function getRotation(rotX: number, rotY: number)
{
    return new THREE.Euler(rotX, rotY, 0, 'YXZ');
}

export function movePlayer(state: GameObjectState, input: ClientInput, dt: number)
{
    let [ x, y, z, rotX, rotY ] = state;

    const inputSensitivity = 0.001;
    
    rotY -= inputSensitivity * input[0];
    rotX += inputSensitivity * input[1];

    if (rotX > 1.570796) rotX = 1.570796;
    else if (rotX < -1.570796) rotX = -1.570796;

    ////////////// MOVEMENT ////////////////
    let speed = 0.6;
    let movementVector = new THREE.Vector3(0, 0, speed * dt).applyEuler(getRotation(rotX, rotY));
    
    x += movementVector.x;
    y += movementVector.y;
    z += movementVector.z;

    return <GameObjectState>[ x, y, z, rotX, rotY ];
}