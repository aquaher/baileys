import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
/* GET home page. */
router.get('/', function (req: Request, res: Response, next: NextFunction) {
    res.status(200);
    res.send('Whatsapp Bot Baileys, webSocket');
});
module.exports = router;
