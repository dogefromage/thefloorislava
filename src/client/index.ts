import './styles';
import { Game } from './game';
import * as io from 'socket.io-client';

const socket: io.Socket = io.io(location.host);

const game = new Game(socket);

const menu = document.querySelector('#menu');

document.querySelector('#join-button')?.addEventListener('click', () =>
{
    let inputField = document.querySelector('#name-input');
    let name = inputField?.nodeValue || 'noname';

    let playerInfo = 
    {
        name
    }

    socket.emit('request-join', playerInfo, () => 
    {
        // request accepted
        setVisibility(menu, false);
        game.joinPlayer(socket.id, name);
        enterPointerLock();
    }, (responce) => 
    {
        // request denied
        alert('join denied, server says: "' + responce + '"');
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
