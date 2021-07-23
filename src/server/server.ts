import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";
import * as dataCompressor from "../common/dataCompressor";

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

interface ClientData
{
    name: string,
    goData?: number[]
}

let clients = new Map<string, ClientData>();

io.on('connection', (socket: socketio.Socket) =>
{
    console.log(`${socket.id} connected`);

    socket.on('request-join', (playerInfo, acceptCallback, denyCallback) =>
    {
        let clientData: ClientData =
        {
            name: playerInfo.name
        };

        clients.set(socket.id, clientData);

        acceptCallback();
    });

    socket.on('disconnect', () =>
    {
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
    let serverData: dataCompressor.ServerData = 
    {
        go: []
    };

    for (let [ id, clientData ] of clients)
    {
        let goData = clientData.goData;
        if (goData !== undefined)
        {
            serverData.go.push([ id, goData ])
        }
    }

    io.emit('server-data', data);


}, 1000 * dt);