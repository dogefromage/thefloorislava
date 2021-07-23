import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";
import { randomId } from '../common/utils';

const app = require('express')();
const port = Number(process.env.PORT || 6969);
app.set('port', port);

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.use(express.static(path.resolve(process.cwd(), 'dist/client/')))

app.get("/", (req: express.Request, res: express.Response) => 
{
    res.sendFile(path.resolve(process.cwd(), 'src/client/index.html'));
});

let shortIds = new Map<string, string>();

io.on('connection', (socket: socketio.Socket) =>
{
    // generate simpler id to save bandwidth
    let id = '';
    do
    {
        id = randomId();
    }
    while (shortIds.has(id));
    shortIds.set(socket.id, id);

    console.log(`${socket.id} connected`);

    socket.on('disconnect', () =>
    {
        console.log(`${socket.id} disconnected`);
    });
});

const server = http.listen(port, () =>
{
    console.log('Server listening on port ' + port);
});