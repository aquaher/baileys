"use strict";
let io;
let sockets;
exports.socketConnection = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', (socket) => {
        sockets = socket;
        console.info(`Client connected [id=${socket.id}]`);
        sockets.join(socket.request._query.session);
        sockets.on(socket.request._query.session, () => {
            console.info(`Client Connected [id=${socket.id}]`);
            console.info(`Session [${socket.request._query.id}]`);
        });
        sockets.on('disconnect', () => {
            console.info(`Client disconnected [id=${socket.id}]`);
        });
        sockets.on('wsconnect', () => {
            console.info(`wsconnect [id=${socket.id}]`);
        });
    }).on('authenticated', (socket) => {
        console.log(socket);
        //this socket is authenticated, we are good to handle more events from it.
        console.log(`hello! ${socket.decoded_token.name}`);
    });
};
exports.sendMessage = (key, message) => io.emit(key, message);
exports.setOnConection = (key) => sockets.on(key, () => {
    console.info(`wsconnect [id=${sockets.id}]`);
});
// exports.getRooms = () => io.sockets.adapter.rooms;
