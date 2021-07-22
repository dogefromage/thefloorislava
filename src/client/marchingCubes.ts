
import * as THREE from 'three';
import { triTable } from './marchingCubesTables';

//http://paulbourke.net/geometry/polygonise/

const MOVE_X = 1;
const MOVE_Y = 2;
const MOVE_Z = 4;
const AXIS_X = 8;
const AXIS_Y = 16;
const AXIS_Z = 32;
    
// look-up-table for edge hash function 
const edgeHashTable = 
[
    AXIS_X,
    AXIS_Y | MOVE_X,
    AXIS_X | MOVE_Y,
    AXIS_Y,
    AXIS_X | MOVE_Z,
    AXIS_Y | MOVE_Z | MOVE_X,
    AXIS_X | MOVE_Z | MOVE_Y,
    AXIS_Y | MOVE_Z,
    AXIS_Z,
    AXIS_Z | MOVE_X,
    AXIS_Z | MOVE_X | MOVE_Y,
    AXIS_Z | MOVE_Y
];

// returns corners connected to selected edge
const edgeCornersTable =
[
    [ 0, 1 ],
    [ 1, 2 ],
    [ 2, 3 ],
    [ 3, 0 ],
    [ 4, 5 ],
    [ 5, 6 ],
    [ 6, 7 ],
    [ 7, 4 ],
    [ 0, 4 ],
    [ 1, 5 ],
    [ 2, 6 ],
    [ 3, 7 ],
];

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
    let numberOfPoints = res.x * res.y * res.z;

    // create grid of noise values and their position
    let gridValues = new Float32Array(numberOfPoints);
    let gridValueIndex = 0;
    let gridVerts = new Float32Array(numberOfPoints * 3);
    let gridVertIndex = 0;

    // calculate field value and position vertex for every grid point in bounds
    for (let k = 0; k < res.z; k++)
    {
        let z = bounds.min.x + k * stepSize;
        
        for (let j = 0; j < res.y; j++)
        {
            let y = bounds.min.y + j * stepSize;

            for (let i = 0; i < res.x; i++)
            {
                let x = bounds.min.x + i * stepSize;
                
                gridValues[gridValueIndex] = scalarField(x, y, z);
                gridValueIndex++;

                gridVerts[gridVertIndex    ] = x;
                gridVerts[gridVertIndex + 1] = y;
                gridVerts[gridVertIndex + 2] = z;
                gridVertIndex += 3;
            }
        }    
    }

    const geometry = new THREE.BufferGeometry();

    // one step in y or z direction
    let DY = res.x;
    let DZ = res.x * res.y;

    // produces unique numbers for edges in lattice
    // used for vertex-hashmap
    const hashEdge = (index: number, edge: number) =>
    {
        let axis = 0;
        let tableResult = edgeHashTable[edge];

        if (tableResult & AXIS_X) axis = 0;
        else if (tableResult & AXIS_Y) axis = 1;
        else if (tableResult & AXIS_Z) axis = 2;

        if (tableResult & MOVE_X) index += 1;
        if (tableResult & MOVE_Y) index += DY;
        if (tableResult & MOVE_Z) index += DZ;

        return (3 * index) + axis;
    }

    // make map for vertices
    //                       <edgeHash,[x,      y,      z,      index  ]>    
    let verticesMap = new Map<number, [ number, number, number, number ]>();

    // final vertex buffer
    let verticesList: number[] = [];
    let currentVertexIndex = 0;

    // final triangle/index buffer
    let triangles: number[] = [];

    // march the cubes!
    for (let k = 0; k < res.z - 1; k++)
    {
        for (let j = 0; j < res.y - 1; j++)
        {
            for (let i = 0; i < res.x - 1; i++)
            {
                let gridIndex = i + j * DY + k * DZ;

                let indices =
                [
                    gridIndex              ,
                    gridIndex           + 1,
                    gridIndex      + DY + 1,
                    gridIndex      + DY    ,
                    gridIndex + DZ         ,
                    gridIndex + DZ      + 1,
                    gridIndex + DZ + DY + 1,
                    gridIndex + DZ + DY    ,
                ];
                
                // find cubeindex, 0-255
                let cubeindex = 0;
                for (let b = 0; b < 8; b++)
                {
                    if (gridValues[indices[b]] < isolevel)
                    {
                        cubeindex |= (1 << b);
                    }
                }

                for (let v = 0; v < triTable[cubeindex].length; v++)
                {
                    let edge = triTable[cubeindex][v];

                    let edgeHash = hashEdge(gridIndex, edge);
                    
                    // if edge-vertex doesn't exist, create
                    let vertex = verticesMap.get(edgeHash);
                    if (vertex !== undefined)
                    {
                        triangles.push(vertex[3]); // add index of existing vertex
                    }
                    else
                    {
                        let corners = edgeCornersTable[edge];
                        let a = indices[corners[0]];
                        let b = indices[corners[1]]
                        let vertex = interpolateVertex(isolevel, 
                            [ gridVerts[3 * a], gridVerts[3 * a + 1], gridVerts[3 * a + 2] ], 
                            [ gridVerts[3 * b], gridVerts[3 * b + 1], gridVerts[3 * b + 2] ],
                            gridValues[a],
                            gridValues[b]);

                        // add to map
                        verticesMap.set(edgeHash, [ vertex[0], vertex[1], vertex[2], currentVertexIndex ]);
                        // add to list
                        verticesList.push(...vertex);

                        triangles.push(currentVertexIndex);
                        
                        currentVertexIndex++;
                    }
                }
            }
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verticesList, 3));

    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( triangles ), 1 ) );

    geometry.computeVertexNormals();

    return geometry;
}

function interpolateVertex(isolevel: number, p1: number[], p2: number[], v1: number, v2: number)
{
    return [
        p1[0] + (p2[0] - p1[0]) * (isolevel - v1) / (v2 - v1), 
        p1[1] + (p2[1] - p1[1]) * (isolevel - v1) / (v2 - v1), 
        p1[2] + (p2[2] - p1[2]) * (isolevel - v1) / (v2 - v1), 
    ];
}
