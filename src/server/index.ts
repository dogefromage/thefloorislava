import * as express from "express";
import * as socketio from "socket.io";
import * as path from "path";

const app = require('express')();
const port = Number(process.env.PORT || 6969);
app.set('port', port);

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.get("/", (req: express.Request, res: express.Response) => 
{
    res.sendFile(path.resolve(process.cwd(), 'dist/client/index.html'));
});

io.on('connection', (socket: socketio.Socket) =>
{
    console.log("connected");

    socket.on('disconnect', () =>
    {
        console.log('socket disconnected');
    });
});

const server = http.listen(port, () =>
{
    console.log('Server listening on port ' + port);
});