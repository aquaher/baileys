"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const pino_1 = __importDefault(require("pino"));
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const { sendMessage } = require("../utils/socket");
const fs = require('fs');
const WhatsappPayload_1 = require("../models/WhatsappPayload");
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
lngDetector.setLanguageType('iso2');
require('dotenv').config();
const BOT_URL = process.env.BOT_URL;
let sockets = {};
function initSessions() {
    return __awaiter(this, void 0, void 0, function* () {
        const dir = './auth';
        const files = fs.readdirSync(dir);
        if (files) {
            for (const file of files) {
                if (file !== 'auth.data') {
                    const filesChild = yield fs.readdirSync(dir + '/' + file);
                    if (filesChild.length > 0) {
                        const splitFile = file.split('_');
                        yield startSock(splitFile[0]);
                    }
                    else {
                        yield fs.rmdirSync(dir + '/' + file, { recursive: true, force: true });
                    }
                }
            }
        }
    });
}
// start a connection
function startSock(session) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = {};
        if (!sockets[session]) {
            console.log('newSession');
            yield createSocket(session);
            message = { message: 'new Session', isConnected: false, session };
            sendMessage(session, message);
        }
        else {
            if (sockets[session].isClose) {
                // const dir = './auth'
                // const files = fs.readdirSync(dir)
                // const dirAuth = `./auth/${session}_auth_info_multi.json`
                // if (files.find((file: string) => file === `${session}_auth_info_multi.json`)) {
                //     fs.unlinkSync(dirAuth)
                // }
                yield createSocket(session);
                message = { message: 'new Session pero con socket', isConnected: false, session };
                sendMessage(session, message);
            }
            else {
                if (sockets[session].user) {
                    console.log('tienesesion', sockets[session]);
                    message = { message: 'oppened session', isConnected: true, session };
                    sendMessage(session, message);
                }
                else {
                    message = { message: 'without session, scan QR', isConnected: false, session };
                    sendMessage(session, message);
                }
            }
        }
        yield setEvents(session);
        return Object.assign(Object.assign({}, message), { socket: sockets[session] });
    });
}
function setEvents(session) {
    return __awaiter(this, void 0, void 0, function* () {
        sockets[session].ev.on('messages.upsert', (m) => __awaiter(this, void 0, void 0, function* () {
            sendMessage(session, { event: 'message.upsert', data: m });
            const msg = m.messages[0];
            if (!msg.key.fromMe) {
                // console.log('TeeeeFFst', JSON.stringify(msg));
                // console.log('Existe imageMessage ??? ', msg?.message?.viewOnceMessageV2?.message?.imageMessage)
            }
            else {
                console.log('message from me', msg);
            }
        }));
        sockets[session].ev.on('conflict', (m) => __awaiter(this, void 0, void 0, function* () {
            // sendMessage(session, { event: 'conflict', data: m });
            // console.log(JSON.stringify(m, undefined, 2))
        }));
        sockets[session].ev.on('messages.update', (m) => {
            // sendMessage(session, { event: 'message.update', data: m });
            // console.log(m)
        });
        sockets[session].ev.on('message-receipt.update', (m) => {
            // sendMessage(session, { event: 'message-receipt.update', data: m });
            // console.log(m)
        });
        sockets[session].ev.on('presence.update', (m) => {
            // sendMessage(session, { event: 'presence.update', data: m });
            // console.log('presence.update', m)
        });
        sockets[session].ev.on('chats.update', (m) => {
            // sendMessage(session, { event: 'chats.update', data: m });
            // console.log('chats.update', m)
        });
        sockets[session].ev.on('contacts.upsert', (m) => {
            // sendMessage(session, { event: 'contacts.upsert', data: m });
            // console.log(m)
        });
        sockets[session].ev.on('connection.update', (update) => {
            var _a, _b, _c, _d;
            sendMessage(session, { event: 'connection.update', data: update });
            if (update.isNewLogin) {
                // console.log('isnewlogin', update.isNewLogin);
                // "update sesion data";
            }
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (sockets[session]) {
                    sockets[session].isClose = true;
                    sockets[session].isConnected = false;
                }
                // reconnect if not logged out
                if (((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut) {
                    console.log('Reconnect if logged 130');
                    startSock(session);
                    sendMessage(session, {
                        event: 'connection.update',
                        data: (_d = (_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.statusCode, isConnected: false
                    });
                    // logoutSession(session);
                }
                else {
                    sendMessage(session, {
                        event: 'connection.update',
                        data: update, isConnected: false, message: 'Connection Closed'
                    });
                    logoutSession(session);
                    console.log('connection closed 143');
                }
            }
            else {
                if (connection) {
                    sendMessage(session, {
                        event: 'connection.success', data: update,
                        isConnected: connection !== 'connecting', connection
                    });
                    sockets[session].isClose = connection === 'connecting';
                    sockets[session].isConnected = connection !== 'connecting';
                }
            }
            // console.log('connection update', update)
            // if (update.qr) {
            sendMessage(session, update);
        });
        // listen for when the auth credentials is updated
    });
}
function createSocket(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(`./auth/${session}_auth_info_multi`);
        sockets[session] = (0, baileys_1.default)({
            logger: (0, pino_1.default)({ level: 'trace' }),
            printQRInTerminal: true,
            auth: state,
            version: [2, 2204, 13],
            browser: ['Aquaher-Bot', 'Chrome', '97'],
            // implement to handle retries
            getMessage: () => __awaiter(this, void 0, void 0, function* () {
                return {
                    conversation: 'hello'
                };
            })
        });
        sockets[session].ev.on('creds.update', saveCreds);
    });
}
function sendMessageWTyping(session, msg, number) {
    return __awaiter(this, void 0, void 0, function* () {
        const [existOnWhatsapp] = yield sockets[session].onWhatsApp(number);
        if (existOnWhatsapp && existOnWhatsapp.exists) {
            yield (0, baileys_1.delay)(1000);
            yield sockets[session].presenceSubscribe(existOnWhatsapp.jid);
            yield (0, baileys_1.delay)(500);
            yield sockets[session].sendPresenceUpdate('composing', existOnWhatsapp.jid);
            yield (0, baileys_1.delay)(1000);
            yield sockets[session].sendPresenceUpdate('paused', existOnWhatsapp.jid);
            return yield sockets[session].sendMessage(existOnWhatsapp.jid, msg);
        }
        else {
            throw existOnWhatsapp;
        }
    });
}
function existOnWhatsapp(session, number) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield sockets[session].onWhatsApp(number);
    });
}
function getStatus(session, number) {
    return __awaiter(this, void 0, void 0, function* () {
        const [existOnWhatsapp] = yield sockets[session].onWhatsApp(number);
        if (existOnWhatsapp && existOnWhatsapp.exists) {
            return yield sockets[session].fetchStatus(existOnWhatsapp.jid);
        }
        else {
            throw existOnWhatsapp;
        }
    });
}
function getProfile(session, number) {
    return __awaiter(this, void 0, void 0, function* () {
        const [existOnWhatsapp] = yield sockets[session].onWhatsApp(number);
        if (existOnWhatsapp && (existOnWhatsapp === null || existOnWhatsapp === void 0 ? void 0 : existOnWhatsapp.exists)) {
            const status = yield sockets[session].fetchStatus(existOnWhatsapp.jid);
            // for low res picture
            const imageLow = yield sockets[session].profilePictureUrl(existOnWhatsapp.jid);
            // for high res picture
            const imageHigh = yield sockets[session].profilePictureUrl(existOnWhatsapp.jid, 'image');
            const businessProfile = yield sockets[session].getBusinessProfile(existOnWhatsapp.jid);
            return { status, imageLow, imageHigh, businessProfile };
        }
        else {
            throw existOnWhatsapp;
        }
    });
}
function pingClient(session) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sock = sockets[session] || null;
            if (sock && (sock === null || sock === void 0 ? void 0 : sock.isClose) === false) {
                const status = yield sockets[session].fetchStatus(sock.user.id);
                const cellphone = sock.user.id.split(':')[0];
                // for low res picture
                const imageLow = yield sockets[session].profilePictureUrl(sock.user.id);
                // for high res picture
                const imageHigh = yield sockets[session].profilePictureUrl(sock.user.id, 'image');
                const businessProfile = yield sockets[session].getBusinessProfile(sock.user.id);
                return [{ isConnected: true, user: Object.assign({ cellphone }, sock.user), status, imageLow, imageHigh, businessProfile }, null];
            }
            else {
                return [{ isConnected: false, message: 'No Link to Whatsapp' }, null];
            }
        }
        catch (e) {
            return [null, e];
        }
    });
}
function getBusinessProfileF(session) {
    return __awaiter(this, void 0, void 0, function* () {
        return sockets[session];
    });
}
function logoutSession(session) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existSession = yield hasSocket(session);
            if (existSession) {
                sockets[session].logout();
                (_a = sockets[session]) === null || _a === void 0 ? void 0 : _a.disconnect();
                delete sockets[session];
            }
            if (sockets[session]) {
                // sockets[session]?.disconnect();
                delete sockets[session];
            }
            const dir = './auth';
            const files = fs.readdirSync(dir);
            const dirAuth = `./auth/${session}_auth_info_multi`;
            if (files.find((file) => file === `${session}_auth_info_multi`)) {
                // fs.unlinkSync(dirAuth)
                try {
                    yield fs.rmdirSync(dirAuth, { recursive: true, force: true });
                    // fs.rm(dirAuth, { recursive: true });
                }
                catch (err) {
                    console.log('error rm', err);
                }
            }
            const message = { message: 'Logout Success' };
            sendMessage(session, {
                event: 'connection.update', isConnected: false, message: message.message
            });
            return message;
        }
        catch (e) {
            return e;
        }
    });
}
function hasSocket(session) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!sockets[session]) {
            return false;
        }
        if (typeof ((_a = sockets[session]) === null || _a === void 0 ? void 0 : _a.isClose) === undefined) {
            return false;
        }
        if (sockets[session].isClose) {
            return false;
        }
        if (sockets[session].user) {
            return true;
        }
        else {
            return false;
        }
    });
}
function messageToWhatsappPayload(session, remitente) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('messageToWhatsappPayload remitente', remitente);
        console.log('messageToWhatsappPayload session', sockets[session]);
        sockets[session]['interval_messages'][remitente] = null;
        const mensajes = sockets[session]['list_stored_messages'][remitente] || [];
        console.log('mensajes session', mensajes);
        if (mensajes.length < 1) {
            return;
        }
        const object = mensajes[0] || null;
        let Mensaje = '';
        for (let index = 0; index < mensajes.length; index++) {
            let local_msg = '';
            if ((_b = (_a = mensajes[index]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.templateButtonReplyMessage) {
                local_msg = (_e = (_d = (_c = mensajes[index]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.templateButtonReplyMessage) === null || _e === void 0 ? void 0 : _e.selectedDisplayText;
            }
            if ((_g = (_f = mensajes[index]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.buttonsResponseMessage) {
                local_msg = (_k = (_j = (_h = mensajes[index]) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.buttonsResponseMessage) === null || _k === void 0 ? void 0 : _k.selectedDisplayText;
            }
            if (!(((_m = (_l = mensajes[index]) === null || _l === void 0 ? void 0 : _l.message) === null || _m === void 0 ? void 0 : _m.buttonsResponseMessage) || ((_p = (_o = mensajes[index]) === null || _o === void 0 ? void 0 : _o.message) === null || _p === void 0 ? void 0 : _p.templateButtonReplyMessage))) {
                local_msg = (_r = (_q = mensajes[index]) === null || _q === void 0 ? void 0 : _q.message) === null || _r === void 0 ? void 0 : _r.conversation;
            }
            if (local_msg && local_msg.trim() !== '') {
                Mensaje += local_msg + ' \n';
            }
        }
        const whatsappText = new WhatsappPayload_1.WhatsappText();
        whatsappText.body = Mensaje || '';
        let locale = 'es';
        try {
            const result = lngDetector.detect(whatsappText.body, 1);
            if (result.length > 0) {
                console.log('resultLanguage', result);
                locale = result[0][0] || 'es';
                if (locale !== 'en') {
                    locale = 'es';
                }
            }
        }
        catch (error) {
            console.log('Error Code', error);
        }
        const whatsappMessage = new WhatsappPayload_1.WhatsappMessage();
        const fromSplit = (_s = object === null || object === void 0 ? void 0 : object.key) === null || _s === void 0 ? void 0 : _s.remoteJid.split('@');
        whatsappMessage.from = fromSplit[0] || '';
        whatsappMessage.id = ((_t = object === null || object === void 0 ? void 0 : object.key) === null || _t === void 0 ? void 0 : _t.id) || '';
        whatsappMessage.id = (object === null || object === void 0 ? void 0 : object.messageTimestamp) || '';
        whatsappMessage.text = whatsappText;
        const whatsappContact = new WhatsappPayload_1.WhatsappContact();
        whatsappContact.profile = new WhatsappPayload_1.WhatsappProfile();
        const whatsappMetadata = new WhatsappPayload_1.WhatsappMetadata();
        const userData = ((_u = sockets[session]) === null || _u === void 0 ? void 0 : _u.user) || null;
        const numberBusiness = ((_v = userData === null || userData === void 0 ? void 0 : userData.id) === null || _v === void 0 ? void 0 : _v.split(':')) || ['unknow'];
        whatsappMetadata.display_phone_number = numberBusiness[0];
        whatsappMetadata.phone_number_id = (userData === null || userData === void 0 ? void 0 : userData.id) || 'unknow';
        const whatsappValue = new WhatsappPayload_1.WhatsappValue();
        whatsappValue.metadata = whatsappMetadata;
        whatsappValue.contacts.push(whatsappContact);
        whatsappValue.messages.push(whatsappMessage);
        const whatsappChange = new WhatsappPayload_1.WhatsappChange();
        whatsappChange.value = whatsappValue;
        const whatsappEntry = new WhatsappPayload_1.WhatsappEntry();
        whatsappEntry.changes.push(whatsappChange);
        whatsappEntry.id = ((_w = object === null || object === void 0 ? void 0 : object.key) === null || _w === void 0 ? void 0 : _w.remoteJid) || 'unknow';
        whatsappEntry.locale = locale;
        const payload = new WhatsappPayload_1.WhatsappPayload();
        payload.entry.push(whatsappEntry);
        console.log('payload', JSON.stringify(payload));
        // console.log('BOT_URL', BOT_URL);
        const options = {
            url: `${BOT_URL}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            data: payload,
        };
    });
}
module.exports = {
    initSessions, startSock, sendMessageWTyping, getBusinessProfileF, existOnWhatsapp,
    getStatus, getProfile, pingClient, logoutSession, hasSocket
};
