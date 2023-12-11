import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import bot from '../bot'
const { sendMessage } = require("../utils/socket");

/* Connect client. */
router.post('/:session/connect-client', async function (req: Request, res: Response, next: NextFunction) {
    const hasSocket = await bot.hasSocket(req.params.session);
    if (hasSocket) {
        res.send({ isConnected: true });
    } else {
        bot.startSock(req.params.session).then((su: any) => {
            console.log('suxx', su);
            res.status(200);
            res.send(su)
        }).catch(err => {
            res.status(400);
            res.send(err);
        });
    }

});
router.post('/:session/send-message', function (req: Request, res: Response, next: NextFunction) {
    console.log('send-message', req.body);
    if (!req.body.cellphone) {
        res.status(400);
        res.send({ status: 'number not found' });
        return;
    }
    const cellphone = req.body.cellphone;
    delete req.body.cellphone;
    bot.sendMessageWTyping(req.params.session, req.body, cellphone).then(mes => {
        console.log('mes', mes);
        res.status(200)
        res.send({ status: 'mensaje enviado' });
    }).catch(err => {
        console.log('error', err);
        res.status(400)
        res.send({ status: 'mensaje no enviado' });
    });
});
router.post('/:session/logout', function (req: Request, res: Response, next: NextFunction) {
    bot.logoutSession(req.params.session).then(mes => {
        console.log('mes', mes);
        res.status(200)
        res.send(mes);
    }).catch(err => {
        console.log('error', err);
        res.status(400)
        res.send(err);
    });
});
router.get('/:session/socket', async function (req: Request, res: Response, next: NextFunction) {
    bot.getBusinessProfileF(req.params.session).then(mes => {
        const id = mes?.authState?.creds?.me?.id || null;
        const resp: any = {};
        if (id) {
            resp['profilePictureUrl'] = mes.profilePictureUrl(id);
            resp['getBusinessProfile'] = mes.getBusinessProfile(id);
        }
        console.log('resp', resp);
        console.log('mes', mes);
        res.status(200)
        res.send({...mes, ...resp});
    }).catch(err => {
        console.log('error', err);
        res.status(400)
        res.send(err);
    });
});
router.get('/:session/exist/:number', function (req: Request, res: Response, next: NextFunction) {
    bot.existOnWhatsapp(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200)
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400)
        res.send(err);
    });
});
router.get('/:session/ping-client', async function (req: Request, res: Response, next: NextFunction) {
    const [ping, error]: any = await bot.pingClient(req.params.session);
    if (error) {
        console.log('error exist', error);
        res.status(200)
        error.isConnected = false;
        error.isErrorCliet = true;
        res.send(error);
    } else {
        res.status(200);
        res.send(ping);
    }
});
router.get('/:session/status/:number', function (req: Request, res: Response, next: NextFunction) {
    bot.getStatus(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200)
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400)
        res.send(err);
    });
});
router.get('/:session/profile/:number', function (req: Request, res: Response, next: NextFunction) {
    bot.getProfile(req.params.session, req.params.number).then(mes => {
        console.log('exist', mes);
        res.status(200)
        res.send(mes);
    }).catch(err => {
        console.log('error exist', err);
        res.status(400)
        res.send(err);
    });
});

router.get('/:session/message/socket/:message', function (req: Request, res: Response, next: NextFunction) {
    sendMessage(req.params.session, { message: req.params.message });
    res.send({ session: req.params.session, message: req.params.message });
});
router.get('/:session/logout', function (req: Request, res: Response, next: NextFunction) {
    bot.logoutSession(req.params.session).then(async mes => {
        res.send(mes)
    }).catch(err => {
        console.log('error', err);
        res.status(400)
        res.send(err);
    });
});
module.exports = router;
