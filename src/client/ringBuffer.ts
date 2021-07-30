

export class SafeRingBuffer
{
    private buffer: Float32Array;
    private currentIndex = -1;

    constructor(
        private size: number,
        private itemsPerEntry: number,
    ) 
    {
        this.buffer = new Float32Array(this.size * this.itemsPerEntry);
    }

    addEntry(entry: number[])
    {
        if (entry.length != this.itemsPerEntry)
        {
            throw new Error('Entry does not fit into buffer!');
        }

        this.currentIndex++;
        
        let bufferIndex = this.itemsPerEntry * (this.currentIndex % this.size)
        for (let i = 0; i < this.itemsPerEntry; i++)
        {
            this.buffer[bufferIndex + i] = entry[i];
        }
    }

    getCurrentIndex()
    {
        return this.currentIndex;
    }

    getCurrentEntry()
    {
        let entry: number[] = [];

        let bufferIndex = this.itemsPerEntry * (this.currentIndex % this.size);
        for (let i = 0; i < this.itemsPerEntry; i++)
        {
            entry.push(this.buffer[bufferIndex + i]);
        }

        return entry;
    }
    
    /**
     * Returns the oldest possible entry, if the buffer has already erased the requested one.
     */
    getClosestEntry(index: number)
    {
        if (this.currentIndex - this.size >= index)
        {
            // buffer has fully looped, therefore use last possible value
            index = this.currentIndex - this.size + 1;
        }
        else if (index > this.currentIndex)
        {
            index = this.currentIndex;
        }
    
        let entry: number[] = [];

        let bufferIndex = this.itemsPerEntry * (index % this.size);
        for (let i = 0; i < this.itemsPerEntry; i++)
        {
            entry.push(this.buffer[bufferIndex + i]);
        }

        return entry;
    }
}