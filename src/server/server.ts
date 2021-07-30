import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";
import { Game } from "./game";
import { ClientData, ClientDataRequest, ServerGameData } from "../common/gameObjectTypes";

const app = require('express')();
const port = Number(process.env.PORT || 6969);
app.set('port', port);

let http = require("http").Server(app);
let io: socketio.Server = require("socket.io")(http);

app.use(express.static(path.resolve(process.cwd(), 'dist/client/')))

app.get("/", (req: express.Request, res: express.Response) => 
{
    res.sendFile(path.resolve(process.cwd(), 'src/client/index.html'));
});

let game = new Game();

class Client
{
    public lastRequest?: ClientDataRequest;
    public lastIndex?: number;

    constructor(
        public socket: socketio.Socket
        ) 
    {
    }
}

let clients = new Map<string, Client>();

io.on('connection', (socket: socketio.Socket) =>
{
    console.log(`${socket.id} connected`);

    clients.set(socket.id, new Client(socket));

    socket.on('request-join', (name: string, callback: (acceptJoin: boolean, msg: string) => void) =>
    {
        game.addPlayer(socket.id, name);

        callback(true, '');
    });

    socket.on('disconnect', () =>
    {
        game.removePlayer(socket.id);

        clients.delete(socket.id);

        console.log(`${socket.id} disconnected`);
    });
});

const server = http.listen(port, () =>
{
    console.log('Server listening on port ' + port);
});

let dt = 0.1;
setInterval(() => 
{
    game.update(dt);

    let baseData = game.getBasicServerData();

    let hasSpecificData = false;

    for (let [ id, client ] of clients)
    {
        let data: ServerGameData =
        {
            ix: -1,
            ...baseData
        };

        if (client.lastRequest !== undefined)
        {
            let specificData = game.getClientSpecificGameData(client.lastRequest);
            
            // merge
            data = { ...data, ...specificData };
            
            hasSpecificData = true;
            client.lastRequest = undefined;
        }

        if (client.lastIndex !== undefined)
        {
            data.ix = client.lastIndex;
        }

        let jsonData = JSON.stringify(data, function(key, value) 
        {
            // limit precision of floats
            if (typeof(value) === 'number') 
            {
                return parseFloat(value.toFixed(3));
            }
            return value;
        });

        console.log(jsonData);

        client.socket.volatile.emit('server-data', jsonData, (clientData: ClientData) =>
        {
            game.setInput(client.socket.id, clientData.in);

            client.lastIndex = clientData.ix;

            if (clientData.re !== undefined)
            {
                // safe request for next sending of data
                client.lastRequest = clientData.re;
            }
        });
    }
}, 1000 * dt);