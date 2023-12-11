import { Boom } from '@hapi/boom'
import P from 'pino'
import makeWASocket, {
    downloadMediaMessage,
    AnyMessageContent,
    delay,
    DisconnectReason,
    makeInMemoryStore,
    useMultiFileAuthState
} from '@whiskeysockets/baileys'

const { sendMessage } = require("../utils/socket");
const fs = require('fs')
import { writeFile } from 'fs/promises'
import {
    WhatsappPayload, WhatsappEntry, WhatsappChange,
    WhatsappValue, WhatsappMetadata, WhatsappContact,
    WhatsappProfile, WhatsappMessage, WhatsappText
} from '../models/WhatsappPayload';
import axios from 'axios';
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
lngDetector.setLanguageType('iso2');
require('dotenv').config();
const BOT_URL = process.env.BOT_URL;

let sockets: any = {};

async function initSessions() {
    const dir = './auth'
    const files = fs.readdirSync(dir)
    if (files) {
        for (const file of files) {
            if (file !== 'auth.data') {
                const filesChild = await fs.readdirSync(dir + '/' + file);
                if (filesChild.length > 0) {
                    const splitFile = file.split('_');
                    await startSock(splitFile[0]);
                } else {
                    await fs.rmdirSync(dir + '/' + file, { recursive: true, force: true});
                }
            }
        }
    }

}

// start a connection
async function startSock(session: string) {
    let message = {}
    if (!sockets[session]) {
        console.log('newSession');
        await createSocket(session);
        message = { message: 'new Session', isConnected: false, session }
        sendMessage(session, message);
    } else {
        if (sockets[session].isClose) {
            // const dir = './auth'
            // const files = fs.readdirSync(dir)
            // const dirAuth = `./auth/${session}_auth_info_multi.json`
            // if (files.find((file: string) => file === `${session}_auth_info_multi.json`)) {
            //     fs.unlinkSync(dirAuth)
            // }
            await createSocket(session);
            message = { message: 'new Session pero con socket', isConnected: false, session }
            sendMessage(session, message);
        } else {
            if (sockets[session].user) {
                console.log('tienesesion', sockets[session])
                message = { message: 'oppened session', isConnected: true, session }
                sendMessage(session, message);
            } else {
                message = { message: 'without session, scan QR', isConnected: false, session }
                sendMessage(session, message);
            }
        }
    }
    await setEvents(session);
    return { ...message, socket: sockets[session] }
}
async function setEvents(session: string) {

    sockets[session].ev.on('messages.upsert', async (m: { messages: any; type: string }) => {
        sendMessage(session, { event: 'message.upsert', data: m });
        const msg = m.messages[0]
        if (!msg.key.fromMe) {
            // console.log('TeeeeFFst', JSON.stringify(msg));
            // console.log('Existe imageMessage ??? ', msg?.message?.viewOnceMessageV2?.message?.imageMessage)
        }
        else {
            console.log('message from me', msg)
        }

    })
    sockets[session].ev.on('conflict', async (m: { messages: any; type: string }) => {
        // sendMessage(session, { event: 'conflict', data: m });
        // console.log(JSON.stringify(m, undefined, 2))
    })
    sockets[session].ev.on('messages.update', (m: any) => {
        // sendMessage(session, { event: 'message.update', data: m });
        // console.log(m)
    })
    sockets[session].ev.on('message-receipt.update', (m: any) => {
        // sendMessage(session, { event: 'message-receipt.update', data: m });
        // console.log(m)
    })
    sockets[session].ev.on('presence.update', (m: any) => {
        // sendMessage(session, { event: 'presence.update', data: m });
        // console.log('presence.update', m)
    })
    sockets[session].ev.on('chats.update', (m: any) => {
        // sendMessage(session, { event: 'chats.update', data: m });
        // console.log('chats.update', m)
    })
    sockets[session].ev.on('contacts.upsert', (m: any) => {
        // sendMessage(session, { event: 'contacts.upsert', data: m });
        // console.log(m)
    })
    sockets[session].ev.on('connection.update', (update: any) => {
        sendMessage(session, { event: 'connection.update', data: update });
        if (update.isNewLogin) {
            // console.log('isnewlogin', update.isNewLogin);
            // "update sesion data";
        }
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (sockets[session]) {
                sockets[session].isClose = true;
                sockets[session].isConnected = false;

            }
            // reconnect if not logged out
            if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconnect if logged 130')
                startSock(session)
                sendMessage(session, {
                    event: 'connection.update',
                    data: (lastDisconnect?.error as Boom)?.output?.statusCode, isConnected: false
                });
                // logoutSession(session);
            } else {
                sendMessage(session, {
                    event: 'connection.update',
                    data: update, isConnected: false, message: 'Connection Closed'
                });
                logoutSession(session);
                console.log('connection closed 143');
            }
        } else {
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
    })
    // listen for when the auth credentials is updated
}
async function createSocket(session: string) {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${session}_auth_info_multi`)
    sockets[session] = makeWASocket({
        logger: P({ level: 'trace' }),
        printQRInTerminal: true,
        auth: state,
        version: [2, 2204, 13],
        browser: ['Aquaher-Bot', 'Chrome', '97'],
        // implement to handle retries
        getMessage: async () => {
            return {
                conversation: 'hello'
            }
        }
    })
    sockets[session].ev.on('creds.update', saveCreds)
}

async function sendMessageWTyping(session: string, msg: AnyMessageContent, number: string) {
    const [existOnWhatsapp] = await sockets[session].onWhatsApp(number);
    if (existOnWhatsapp && existOnWhatsapp.exists) {
        await delay(1000)

        await sockets[session].presenceSubscribe(existOnWhatsapp.jid)
        await delay(500)

        await sockets[session].sendPresenceUpdate('composing', existOnWhatsapp.jid)
        await delay(1000)

        await sockets[session].sendPresenceUpdate('paused', existOnWhatsapp.jid)

        return await sockets[session].sendMessage(existOnWhatsapp.jid, msg)
    } else {
        throw existOnWhatsapp;
    }
}

async function existOnWhatsapp(session: string, number: string) {
    return await sockets[session].onWhatsApp(number)
}

async function getStatus(session: string, number: string) {
    const [existOnWhatsapp] = await sockets[session].onWhatsApp(number);
    if (existOnWhatsapp && existOnWhatsapp.exists) {
        return await sockets[session].fetchStatus(existOnWhatsapp.jid)
    } else {
        throw existOnWhatsapp;
    }
}

async function getProfile(session: string, number: string) {
    const [existOnWhatsapp] = await sockets[session].onWhatsApp(number);
    if (existOnWhatsapp && existOnWhatsapp?.exists) {
        const status = await sockets[session].fetchStatus(existOnWhatsapp.jid)
        // for low res picture
        const imageLow = await sockets[session].profilePictureUrl(existOnWhatsapp.jid)
        // for high res picture
        const imageHigh = await sockets[session].profilePictureUrl(existOnWhatsapp.jid, 'image')
        const businessProfile = await sockets[session].getBusinessProfile(existOnWhatsapp.jid)
        return { status, imageLow, imageHigh, businessProfile }
    } else {
        throw existOnWhatsapp;
    }
}

async function pingClient(session: string) {
    try {
        const sock = sockets[session] || null;
        if (sock && sock?.isClose === false) {
            const status = await sockets[session].fetchStatus(sock.user.id);
            const cellphone = sock.user.id.split(':')[0];
            // for low res picture
            const imageLow = await sockets[session].profilePictureUrl(sock.user.id);
            // for high res picture
            const imageHigh = await sockets[session].profilePictureUrl(sock.user.id, 'image');
            const businessProfile = await sockets[session].getBusinessProfile(sock.user.id);
            return [{ isConnected: true, user: { cellphone, ...sock.user }, status, imageLow, imageHigh, businessProfile }, null]
        } else {
            return [{ isConnected: false, message: 'No Link to Whatsapp'}, null]
        }
    } catch (e) {
        return [null, e];
    }
}

async function getBusinessProfileF(session: string) {
    return sockets[session]
}

async function logoutSession(session: string) {
    try {
        const existSession = await hasSocket(session);
        if (existSession) {
            sockets[session].logout();
            sockets[session]?.disconnect();
            delete sockets[session];
        }
        if (sockets[session]) {
            // sockets[session]?.disconnect();
            delete sockets[session];
        }
        const dir = './auth'
        const files = fs.readdirSync(dir)
        const dirAuth = `./auth/${session}_auth_info_multi`
        if (files.find((file: string) => file === `${session}_auth_info_multi`)) {
            // fs.unlinkSync(dirAuth)
            try {
                await fs.rmdirSync(dirAuth, { recursive: true, force: true});
                // fs.rm(dirAuth, { recursive: true });
            } catch (err) {
                console.log('error rm', err);
            }
        }
        const message = { message: 'Logout Success' }

        sendMessage(session, {
            event: 'connection.update', isConnected: false, message: message.message
        });
        return message;
    } catch (e) {
        return e;
    }

}
async function hasSocket(session: string) {
    if (!sockets[session]) {
        return false;
    }
    if (typeof sockets[session]?.isClose === undefined) {
        return false;
    }
    if (sockets[session].isClose) {
        return false;
    }
    if (sockets[session].user) {
        return true;
    } else {
        return false
    }
}

async function messageToWhatsappPayload(session: any, remitente: any) {
    console.log('messageToWhatsappPayload remitente', remitente)
    console.log('messageToWhatsappPayload session', sockets[session])
    sockets[session]['interval_messages'][remitente] = null;
    const mensajes = sockets[session]['list_stored_messages'][remitente] || [];
    console.log('mensajes session', mensajes)
    if (mensajes.length < 1) { return }
    const object = mensajes[0] || null;
    let Mensaje = '';
    for (let index = 0; index < mensajes.length; index++) {
        let local_msg = '';
        if (mensajes[index]?.message?.templateButtonReplyMessage) {
            local_msg =  mensajes[index]?.message?.templateButtonReplyMessage?.selectedDisplayText;
        }
        if (mensajes[index]?.message?.buttonsResponseMessage) {
            local_msg =  mensajes[index]?.message?.buttonsResponseMessage?.selectedDisplayText;
        }
        if (!(mensajes[index]?.message?.buttonsResponseMessage || mensajes[index]?.message?.templateButtonReplyMessage)) {
            local_msg = mensajes[index]?.message?.conversation;
        }
        if (local_msg && local_msg.trim() !== '') {
            Mensaje += local_msg + ' \n';
        }
    }
    const whatsappText: WhatsappText = new WhatsappText();
    whatsappText.body = Mensaje || '';
    
    let locale = 'es';
    try {
        const result = lngDetector.detect(whatsappText.body, 1);
        if (result.length > 0) {
            console.log('resultLanguage', result)
            locale = result[0][0] || 'es';
            if (locale !== 'en') {
                locale = 'es';
            }
        }
    } catch (error) {
        console.log('Error Code', error);
    }

    const whatsappMessage: WhatsappMessage = new WhatsappMessage();
    const fromSplit = object?.key?.remoteJid.split('@')
    whatsappMessage.from = fromSplit[0] || '';
    whatsappMessage.id = object?.key?.id || '';
    whatsappMessage.id = object?.messageTimestamp || '';
    whatsappMessage.text = whatsappText;

    const whatsappContact: WhatsappContact = new WhatsappContact();
    whatsappContact.profile = new WhatsappProfile();

    const whatsappMetadata: WhatsappMetadata = new WhatsappMetadata();
    const userData = sockets[session]?.user || null;
    const numberBusiness = userData?.id?.split(':') || ['unknow'];
    whatsappMetadata.display_phone_number = numberBusiness[0];
    whatsappMetadata.phone_number_id = userData?.id || 'unknow';

    const whatsappValue: WhatsappValue = new WhatsappValue();
    whatsappValue.metadata = whatsappMetadata;
    whatsappValue.contacts.push(whatsappContact);
    whatsappValue.messages.push(whatsappMessage);

    const whatsappChange: WhatsappChange = new WhatsappChange();
    whatsappChange.value = whatsappValue;

    const whatsappEntry: WhatsappEntry = new WhatsappEntry();
    whatsappEntry.changes.push(whatsappChange);
    whatsappEntry.id = object?.key?.remoteJid || 'unknow'; 
    whatsappEntry.locale = locale;   

    const payload: WhatsappPayload = new WhatsappPayload();
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
    //   try {
    //     console.log('Enviar payload =====>', payload)
    //   } catch (err) {

    //   }
    //   try{
    //     await axios(options).then(response => {
    //     //   console.log('response post', response)
    //       sockets[session]['list_stored_messages'][remitente] = [];
    //     });
    //   } catch(err) {
    //     console.log('Errror Axios ', err)
    //   }
}

export = {
    initSessions, startSock, sendMessageWTyping, getBusinessProfileF, existOnWhatsapp,
    getStatus, getProfile, pingClient, logoutSession, hasSocket
}
