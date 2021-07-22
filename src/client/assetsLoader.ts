import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
const objLoader = new OBJLoader();

let models = new Map<string, THREE.Object3D>();

export function getModel(path: string, onload: (model: THREE.Object3D) => void)
{
    let model = models.get(path);

    if (model !== undefined)
    {
        onload(model);
    }
    else
    {
        objLoader.load(path, (obj) =>
        {
            models.set(path, obj);
            onload(obj);
        }, 
            undefined, (error) =>
        {
            console.log('error while loading obj-file');
            console.error(error);
        });
    }
}