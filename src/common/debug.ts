

const mode: 'dev' | 'prod' = 'dev';

export function log(...args: any[])
{
    if (mode === 'dev')
    {
        console.log(...args);
    }
}
