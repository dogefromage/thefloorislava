import { Box3, Vector3 } from 'three';

const TREE_BUCKET_SIZE = 4;

export class Octree<T>
{
    private root: OctNode<T>;
    private size: number = 0;

    constructor(
        public bounds: Box3
        )
    {
        this.root = new OctNode(this.bounds, 0);
    }

    insert(bounds: Box3, obj: T)
    {
        this.root.insert(bounds, obj)
        this.size++;
    }

    *[Symbol.iterator](): Generator<T>
    {
        return this.root[Symbol.iterator]();
    }

    insideBox(bounds: Box3)
    {
        return this.root.insideBox(bounds);
    }

    intersectingPoint(point: Vector3)
    {
        return this.root.intersectingPoint(point);
    }

    isEmpty()
    {
        return (this.size == 0);
    }

    clear()
    {
        this.root = new OctNode<T>(this.bounds, 0);
        this.size = 0;
    }
}

type TreeData<T> = [ Box3, T ];

class OctNode<T>
{
    private nextBounds: Box3[];
    private hasSplit = false;
    private data: TreeData<T>[] = [];
    private children: OctNode<T>[] = [];
    private isLeaf = true;
    private depth: number;

    constructor(
        public bounds: Box3, depth: number)
    {
        const min = this.bounds.min;
        const mid = new Vector3();
        const max = this.bounds.max;
        bounds.getCenter(mid);

        // already safe for checking next elements
        this.nextBounds = 
        [
            new Box3(new Vector3(min.x, min.y, min.z), new Vector3(mid.x, mid.y, mid.z)),
            new Box3(new Vector3(mid.x, min.y, min.z), new Vector3(max.x, mid.y, mid.z)),
            new Box3(new Vector3(min.x, mid.y, min.z), new Vector3(mid.x, max.y, mid.z)),
            new Box3(new Vector3(mid.x, mid.y, min.z), new Vector3(max.x, max.y, mid.z)),
            
            new Box3(new Vector3(min.x, min.y, mid.z), new Vector3(mid.x, mid.y, max.z)),
            new Box3(new Vector3(mid.x, min.y, mid.z), new Vector3(max.x, mid.y, max.z)),
            new Box3(new Vector3(min.x, mid.y, mid.z), new Vector3(mid.x, max.y, max.z)),
            new Box3(new Vector3(mid.x, mid.y, mid.z), new Vector3(max.x, max.y, max.z)),
        ];
        
        this.depth = depth;
    }

    insert(objBounds: Box3, obj: T)
    {
        const dataPair: TreeData<T> = [ objBounds, obj ];
        
        if (this.isLeaf)
        {
            this.data.push(dataPair);
            
            if (this.data.length > TREE_BUCKET_SIZE)
            {
                this.isLeaf = false;

                const temp = this.data;
                this.data = [];
                for (const el of temp)
                {
                    this.insert(...el);
                }
            }
            return;
        }

        let fitsIntoBounds = false;
        for (let i = 0; i < 4; i++)
        {
            if(this.nextBounds[i].containsBox(dataPair[0]))
            {
                if (!this.hasSplit)
                {
                    this.split();
                }

                this.children[i].insert(...dataPair);   // Go deeper into the tree
                fitsIntoBounds = true;
                break;
            }
        }

        if(!fitsIntoBounds)
        {
            this.data.push(dataPair);
        }
    }

    split()
    {
        for (const b of this.nextBounds)
        {
            this.children.push(new OctNode(b, this.depth + 1));
        }
        
        this.hasSplit = true;
    }

    /**
     * DEPTH FIRST ALL ELEMENTS
     */
    *[Symbol.iterator](): Generator<T>
    {
        if (this.hasSplit)
        {
            for (const child of this.children)
            {
                for (const el of child)
                {
                    yield el; // pass on
                }
            }
        }

        // YIELD DATA
        for (const el of this.data)
        {
            yield el[1];
        }
    }

    /**
     * Generator for elements in specified bounds (DEPTH FIRST)
     * @param { Box3 } bounds 
     */
    *insideBox(bounds: Box3): Generator<T>
    {
        if (!bounds.intersectsBox(this.bounds))
        {
            // stop generating
            return;
        }
        
        if (this.hasSplit)
        {
            for (const child of this.children)
            {
                for (const el of child.insideBox(bounds))
                {
                    yield el; // pass on
                }
            }
        }
        
        // YIELD DATA
        for (const el of this.data)
        {
            if (bounds.intersectsBox(el[0]))
            {
                yield el[1];
            }
        }
    }

    /**
     * Generator for elements in specified bounds (DEPTH FIRST)
     * @param { Vector3 } point 
     */
    *intersectingPoint(point: Vector3): Generator<T>
    {
        if (!this.bounds.containsPoint(point))
        {
            // stop generating
            return;
        }
        
        if (this.hasSplit)
        {
            for (const child of this.children)
            {
                for (const el of child.intersectingPoint(point))
                {
                    yield el; // pass on
                }
            }
        }
        
        // YIELD DATA
        for (const el of this.data)
        {
            if (el[0].containsPoint(point))
            {
                yield el[1];
            }
        }
    }
}
