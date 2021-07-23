
interface gameObjectData
{
    position?: THREE.Vector3,
    velocity?: THREE.Vector3
}

export function compress(data: gameObjectData)
{
    let keys = '';
    let compressed: (string | number)[] = [];
    
    if (data.position !== undefined)
    {
        keys += 'p';
        compressed.push(data.position.x, data.position.y, data.position.z);
    }
    
    if (data.velocity !== undefined)
    {
        keys += 'v';
        compressed.push(data.velocity.x, data.velocity.y, data.velocity.z);
    }

    if (keys.length > 0)
    {
        compressed.unshift(keys);
    }

    return compressed;
}

export function decompress(data: (string | number)[])
{
    let obj: gameObjectData = {};
    
    if (data.length > 0 && typeof(data[0]) === 'string')
    {
        let key: string = data[0];

        for (let i = 0; i < key.length; i++)
        {
            let c: string = key.charAt[i];

        }
    }
}