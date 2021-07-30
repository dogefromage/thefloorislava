import { ClientInput } from "../common/gameObjectTypes";
import { SafeRingBuffer } from "./ringBuffer";


let axisSumX = 0;
let axisSumY = 0;

/**
 * This circular buffer keeps track of the sum of all inputs.
 * The difference of two sums will always correspond to the 
 * distance the input has traveled in this timeframe
 */
let buffer = new SafeRingBuffer(512, 2);

document.addEventListener('mousemove', (e) =>
{
    axisSumX += e.movementX;
    axisSumY += e.movementY;

    buffer.addEntry([ axisSumX, axisSumY ]);
});

/**
 * Subtracting the older sum from the newer sum somehow results in the integral between the two timeFrames.
 * This function searches the buffervalue which matches the last time best and uses it to compute the deltaAxes.
 */
export function getAxesDelta(lastIndex: number): ClientInput
{
    if (buffer.getCurrentIndex() <= lastIndex)
    {
        // no new input
        return [ 0, 0 ];
    }

    let currentEntry = buffer.getCurrentEntry();
    let oldEntry = buffer.getClosestEntry(lastIndex);

    let axes: ClientInput = 
    [
        currentEntry[0] - oldEntry[0],
        currentEntry[1] - oldEntry[1],
    ];

    return axes;
}

export function getCurrentIndex()
{
    return buffer.getCurrentIndex();
}