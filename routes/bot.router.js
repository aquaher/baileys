"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const bot_1 = __importDefault(require("../bot"));
const { sendMessage } = require("../utils/socket");
/* Connect client. */
router.post('/:session/connect-client', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const hasSocket = yield bot_1.default.hasSocket(req.params.session);
        if (hasSocket) {
            res.send({ isConnected: true });
        }
        else {
            bot_1.default.startSock(req.params.session).then((su) => {
                console.log('suxx', su);
                res.status(200);
                res.send(su);
            }).catch(err => {
                res.status(400);
                res.send(err);
            });
        }
    });
});
router.post('/:session/send-message', function (req, res, next) {
    console.log('send-message', req.body);
    if (!req.body.cellphone) {
        res.status(400);
        res.send({ status: 'number not found' });
        return;
    }
    const cellphone = req.body.cellphone;
    delete req.body.cellphone;
    bot_1.default.sendMessageWTyping(req.params.session, req.body, cellphone).then(mes => {
        console.log('mes', mes);
        res.status(200);
        res.send({ status: 'mensaje enviado' });
    }).catch(err => {
        console.log('error', err);
        res.status(400);
        res.send({ status: 'mensaje no enviado' });
    });
});
router.post('/:session/logout', function (req, res, next) {
    bot_1.default.logoutSession(req.params.session).then(mes => {
        console.log('mes', mes);
        res.status(200);
        res.send(mes);
    }).catch(err => {
        console.log('error', err);
        res.status(400);
        res.send(err);
    });
});
router.get('/:session/socket', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        bot_1.default.getBusinessProfileF(req.params.session).then(mes => {
            var _a, _b, _c;
            const id = ((_c = (_b = (_a = mes === null || mes === void 0 ? void 0 : mes.authState) === null || _a === void 0 ? void 0 : _a.creds) === null || _b === void 0 ? void 0 : _b.me) === null || _c === void 0 ? void 0 : _c.id) || null;
            const resp = {};
            if (id) {
                resp['profilePictureUrl'] = mes.profilePictureUrl(id);
                resp['getBusinessProfile'] = mes.getBusinessProfile(id);
            }
            console.log('resp', resp);
            console.log('mes', mes);
            res.status(200);
            res.send(Object.assign(Object.assign({}, mes), resp));
        }).catch(err => {
            console.log('error', err);
            res.status(400);
            res.send(err);
        });
    });
});
router.get('/:session/exist/:number', function (req, res, next) {
    bot_1.default.existOnWhatsapp(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200);
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400);
        res.send(err);
    });
});
router.get('/:session/ping-client', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const [ping, error] = yield bot_1.default.pingClient(req.params.session);
        if (error) {
            console.log('error exist', error);
            res.status(200);
            error.isConnected = false;
            error.isErrorCliet = true;
            res.send(error);
        }
        else {
            res.status(200);
            res.send(ping);
        }
    });
});
router.get('/:session/status/:number', function (req, res, next) {
    bot_1.default.getStatus(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200);
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400);
        res.send(err);
    });
});
router.get('/:session/profile/:number', function (req, res, next) {
    bot_1.default.getProfile(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200);
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400);
        res.send(err);
    });
});
router.get('/:session/message/socket/:message', function (req, res, next) {
    sendMessage(req.params.session, { message: req.params.message });
    res.send({ session: req.params.session, message: req.params.message });
});
router.get('/:session/logout', function (req, res, next) {
    bot_1.default.logoutSession(req.params.session).then((mes) => __awaiter(this, void 0, void 0, function* () {
        res.send(mes);
    })).catch(err => {
        console.log('error', err);
        res.status(400);
        res.send(err);
    });
});
module.exports = router;
