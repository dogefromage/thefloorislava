
let axisX = 0, axisY = 0;
let axisToken = 0;

document.addEventListener('mousemove', (e) =>
{
    axisX = e.movementX;
    axisY = e.movementY;
    
    // used to identify updates to avoid using same input twice
    axisToken++;
});

export function getAxes()
{
    return [
        axisX,
        axisY,
        axisToken
    ];
}