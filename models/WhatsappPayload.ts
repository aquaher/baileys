export class WhatsappPayload {
    object: string = 'whatsapp_business_account';
    entry: WhatsappEntry[] = [];
}

export class WhatsappEntry {
    id: string = ""
    changes: WhatsappChange[] = [];
    locale: string = 'es';
}

export class WhatsappChange {
    value: WhatsappValue = new WhatsappValue();
    field: string = "messages";
}

export class WhatsappValue {
    messaging_product: string = "whatsapp";
    metadata: WhatsappMetadata = new WhatsappMetadata();
    contacts: WhatsappContact[] = [];
    messages: WhatsappMessage[] = [];
}

export class WhatsappMetadata {
    display_phone_number: string = "";
    phone_number_id: string = "";
}

export class WhatsappContact {
    profile: WhatsappProfile = new WhatsappProfile();
    wa_id: string = ""
}

export class WhatsappProfile {
    name: string = "customer"
}

export class WhatsappMessage {
    from: string = ""
    id: string = ""
    timestamp: string = ""
    text: WhatsappText = new WhatsappText();
    type: string = "text"
}

export class WhatsappText {
    body: string = "";
}