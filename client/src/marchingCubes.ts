
import * as THREE from 'three';
import { Noise4D } from './open-simplex-noise/lib/4d';
import { edgeTable, triTable } from './marchingCubesTables';

//http://paulbourke.net/geometry/polygonise/

export function marchingCubes(
    scalarField: (x: number, y: number, z: number) => number, 
    isolevel: number, 
    bounds: THREE.Box3, 
    stepSize: number
    ): THREE.BufferGeometry
{
    
    if (stepSize <= 0) stepSize = 0.1; // prevent div/0
    // calculate resolution along every axis
    let res = bounds.max.clone().sub(bounds.min).divideScalar(stepSize).floor();
    
    // create grid of noise values
    let noiseGrid: number[][][] = [];
    for (let k = 0; k < res.z; k++)
    {
        let z = bounds.min.x + k * stepSize;
        noiseGrid.push([]);
        
        for (let j = 0; j < res.y; j++)
        {
            let y = bounds.min.y + j * stepSize;
            noiseGrid[k].push([]);

            for (let i = 0; i < res.x; i++)
            {
                let x = bounds.min.x + i * stepSize;
                let noiseVal = scalarField(x, y, z);
                noiseGrid[k][j].push(noiseVal);
            }
        }    
    }

    const geometry = new THREE.BufferGeometry();

    // march cubes
    let verts: number[] = [];
    for (let k = 0; k < noiseGrid.length - 1; k++)
    {
        for (let j = 0; j < noiseGrid[0].length - 1; j++)
        {
            for (let i = 0; i < noiseGrid[0][0].length - 1; i++)
            {
                let cubeindex = 0;
                if (noiseGrid[  k  ][  j  ][  i  ] < isolevel) cubeindex |= 1;
                if (noiseGrid[  k  ][  j  ][ i+1 ] < isolevel) cubeindex |= 2;
                if (noiseGrid[  k  ][ j+1 ][ i+1 ] < isolevel) cubeindex |= 4;
                if (noiseGrid[  k  ][ j+1 ][  i  ] < isolevel) cubeindex |= 8;
                if (noiseGrid[ k+1 ][  j  ][  i  ] < isolevel) cubeindex |= 16;
                if (noiseGrid[ k+1 ][  j  ][ i+1 ] < isolevel) cubeindex |= 32;
                if (noiseGrid[ k+1 ][ j+1 ][ i+1 ] < isolevel) cubeindex |= 64;
                if (noiseGrid[ k+1 ][ j+1 ][  i  ] < isolevel) cubeindex |= 128;

                
            }
        }
    }


    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geometry.computeVertexNormals();

    return geometry;
}
