import * as THREE from 'three';

export interface ServerData
{
    go: ([ string, number[] ])[]
}

function isServerData(obj: any)
{
    return (
        obj.go instanceof Array &&
        obj.go instanceof Array
    );
}

export interface GameObjectData
{
    position?: THREE.Vector3,
    velocity?: THREE.Vector3
}

enum GODataTypes
{
    Position,
    Velocity
};

export function compress(data: GameObjectData)
{
    let compressed: number[] = [];
    
    if (data.position !== undefined)
    {
        compressed.push(GODataTypes.Position, data.position.x, data.position.y, data.position.z);
    }
    
    if (data.velocity !== undefined)
    {
        compressed.push(GODataTypes.Velocity, data.velocity.x, data.velocity.y, data.velocity.z);
    }

    return compressed;
}

export function decompress(data: number[])
{
    let obj: GameObjectData = {};
    
    while (data.length > 0)
    {
        let dataType = data.shift();

        switch (dataType)
        {
            case GODataTypes.Position:
                if (data.length < 3)
                {
                    throwDataLengthError(dataType, data.length);
                }
                obj.position = new THREE.Vector3(data.shift(), data.shift(), data.shift());
                break;

            case GODataTypes.Velocity:
                if (data.length < 3)
                {
                    throwDataLengthError(dataType, data.length);
                }
                obj.velocity = new THREE.Vector3(data.shift(), data.shift(), data.shift());
                break;

            default:
                throw new Error(`Type not recognized (type: ${dataType})`);
        }

        return obj;
    }
}

export function jsonify(obj: ServerData, decimalPlaces = 3)
{
    const reducedJSON = JSON.stringify(obj, function(key, value) 
    {
        // limit precision of floats
        if (typeof(value) === 'number') 
        {
            return parseFloat(value.toFixed(decimalPlaces));
        }
        // convert all maps to arrays with key-value sub arrays and all sets to arrays
        else if (value instanceof Map || value instanceof Set) 
        {
            return [...value];
        }
        return value;
    });

    return reducedJSON;
}

export function dejsonify(json: string)
{
    const serverData = JSON.parse(json, (key, value) =>
    {
        // if (key == 'go')
        // {
        //     if (value instanceof Array)
        //     {
        //         return new Map(value);
        //     }
        // }
            
        return value;
    });

    if (!isServerData(serverData))
    {
        throw new Error('Object is not compatible with type ServerData');
    }

    return <ServerData>serverData;
}

function throwDataLengthError(type: number, length: number)
{
    throw new Error(`Data length does not match data type (type: ${type}, length: ${length})`);
}