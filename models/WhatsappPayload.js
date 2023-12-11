"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappText = exports.WhatsappMessage = exports.WhatsappProfile = exports.WhatsappContact = exports.WhatsappMetadata = exports.WhatsappValue = exports.WhatsappChange = exports.WhatsappEntry = exports.WhatsappPayload = void 0;
class WhatsappPayload {
    constructor() {
        this.object = 'whatsapp_business_account';
        this.entry = [];
    }
}
exports.WhatsappPayload = WhatsappPayload;
class WhatsappEntry {
    constructor() {
        this.id = "";
        this.changes = [];
        this.locale = 'es';
    }
}
exports.WhatsappEntry = WhatsappEntry;
class WhatsappChange {
    constructor() {
        this.value = new WhatsappValue();
        this.field = "messages";
    }
}
exports.WhatsappChange = WhatsappChange;
class WhatsappValue {
    constructor() {
        this.messaging_product = "whatsapp";
        this.metadata = new WhatsappMetadata();
        this.contacts = [];
        this.messages = [];
    }
}
exports.WhatsappValue = WhatsappValue;
class WhatsappMetadata {
    constructor() {
        this.display_phone_number = "";
        this.phone_number_id = "";
    }
}
exports.WhatsappMetadata = WhatsappMetadata;
class WhatsappContact {
    constructor() {
        this.profile = new WhatsappProfile();
        this.wa_id = "";
    }
}
exports.WhatsappContact = WhatsappContact;
class WhatsappProfile {
    constructor() {
        this.name = "customer";
    }
}
exports.WhatsappProfile = WhatsappProfile;
class WhatsappMessage {
    constructor() {
        this.from = "";
        this.id = "";
        this.timestamp = "";
        this.text = new WhatsappText();
        this.type = "text";
    }
}
exports.WhatsappMessage = WhatsappMessage;
class WhatsappText {
    constructor() {
        this.body = "";
    }
}
exports.WhatsappText = WhatsappText;
