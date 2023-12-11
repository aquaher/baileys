"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const cors = require('cors');
// Socket
const http = require('http');
const server = http.Server(app);
const { socketConnection } = require("./utils/socket");
const { initSessions } = require("./bot");
socketConnection(server);
initSessions().then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
});
// Routes
const indexRouter = require('./routes/index');
const botRouter = require('./routes/bot.router');
app.use(cors({
    origin: '*',
    methods: '*'
}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use('/', indexRouter);
app.use('/api/bot', botRouter);
server.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}.`);
});
