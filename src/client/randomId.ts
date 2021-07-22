// import crypto from 'crypto';

// export function randomId(length = 3)
// {
//     return crypto.randomBytes(length).toString("hex");
// }

export function randomId(length = 6)
{
    let rand = Math.random().toString(16).substr(2, length);
    return rand;
}