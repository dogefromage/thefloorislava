import './styles';
import { Game } from './game';

const game = new Game();

const menu = document.querySelector('#menu');

document.querySelector('#join-button')?.addEventListener('click', () =>
{
    setVisibility(menu, false);
    
    let inputField = document.querySelector('#name-input');
    let name = inputField?.nodeValue || 'noname';

    document.dispatchEvent(new CustomEvent('la-join', 
    {
        detail: 
        {
            name
        },
    }));

    enterPointerLock();
});

document.addEventListener('la-death', (e) =>
{
    setTimeout(() =>
    {
        setVisibility(menu, true);
        exitPointerLock();
    }, 2000);
});

function enterPointerLock()
{
    const canvas: any = document.querySelector('canvas');
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();
}

function exitPointerLock()
{
    const doc: any = document; // trick typescript
    document.exitPointerLock = document.exitPointerLock || doc.mozExitPointerLock;
    document.exitPointerLock();
}

document.addEventListener('keydown', (e) =>
{
    if (e.code == 'Escape')
    {
        exitPointerLock();
    }
});

function setVisibility(element: any, visible: boolean)
{
    if (visible)
    {
        element?.classList.remove('fade-out');
        element?.classList.add('fade-in');
    }
    else
    {
        element?.classList.remove('fade-in');
        element?.classList.add('fade-out');
    }
}