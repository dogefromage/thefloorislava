import { clamp } from "three/src/math/MathUtils"

export function lerpClamp(a: number, b: number, t: number)
{
    t = clamp(t, 0, 1);
    return (1 - t) * a + t * b;
}

export function lerpClampVec(a: THREE.Vector3, b: THREE.Vector3, t: number)
{
    t = clamp(t, 0, 1);
    return a.clone().lerp(b, t);
}

export function randomId(length = 6)
{
    let rand = Math.random().toString(16).substr(2, length);
    return rand;
}