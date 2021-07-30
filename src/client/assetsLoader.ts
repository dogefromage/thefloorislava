import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { log } from '../common/debug';
const objLoader = new OBJLoader();

let models = new Map<string, THREE.Object3D>();

export function getModel(path: string, onload: (modelInstance: THREE.Object3D) => void)
{
    let model = models.get(path);

    if (model !== undefined)
    {
        let modelInstance = new THREE.Object3D();

        model.traverse((child: any) =>
        {
            if (child.hasOwnProperty('geometry'))
            {
                modelInstance.add(new THREE.Mesh(child.geometry, new THREE.MeshPhongMaterial({ color: 0xaaffff })))
            }
        });

        onload(modelInstance);
    }
    else
    {
        objLoader.load(path, (obj) =>
        {
            models.set(path, obj);
            getModel(path, (modelInstance) => onload(modelInstance)); // recurse
        }, 
            undefined, (error) =>
        {
            log('error while loading obj-file');
        });
    }
}

export function disposeObject(obj: THREE.Object3D)
{
    obj.traverse((mesh: any) =>
    {
        if (mesh.hasOwnProperty('geometry'))
        {
            mesh.geometry.dispose();
        }
    });

    if (obj.hasOwnProperty('geometry'))
    {
        (<any>obj).geometry.dispose();
    }
}