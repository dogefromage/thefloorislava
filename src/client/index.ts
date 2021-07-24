import './styles';
import { ClientGame } from './clientGame';
import * as io from 'socket.io-client';

const socket: io.Socket = io.io(location.host);

const game = new ClientGame(socket);

const menu = document.querySelector('#menu');

document.querySelector('#join-button')?.addEventListener('click', () =>
{
    let inputField: any = document.querySelector('#name-input');
    let name = inputField?.value || 'noname';

    socket.emit('request-join', name, (joinAccepted: boolean, msg: string) => 
    {
        if (joinAccepted)
        {
            // request accepted
            setVisibility(menu, false);
            enterPointerLock();
        }
        else
        {
            alert('join denied, server says: "' + msg + '"');
        }
    });
});

document.addEventListener('la-death', (e) =>
{
    setTimeout(() =>
    {
        setVisibility(menu, true);
        exitPointerLock();
    }, 2000);
});

document.addEventListener('click', () =>
{
    if (game.getGameState() === 'ingame')
    {
        enterPointerLock();
    }
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
    document.exitPointerLock?.();
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
