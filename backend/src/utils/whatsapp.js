import axios from 'axios';

const formatPhone = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

// Default template — used when caretaker has no custom template
export const DEFAULT_MESSAGE_TEMPLATE = `Hello {tenantName},

WATER BILL:
Previous Reading: {previousReading}
Current Reading: {currentReading}
Units Used: {unitsUsed}
Amount Due: KES {waterCost}

Thank you.`;

// Build invoice message using caretaker's custom template or the default
export const buildInvoiceMessage = (invoice, customTemplate = '') => {
  const template = customTemplate?.trim() || DEFAULT_MESSAGE_TEMPLATE;
  return template
    .replace(/{tenantName}/g,      invoice.tenantName)
    .replace(/{houseNumber}/g,     invoice.houseNumber)
    .replace(/{previousReading}/g, invoice.previousReading)
    .replace(/{currentReading}/g,  invoice.currentReading)
    .replace(/{unitsUsed}/g,       invoice.unitsUsed)
    .replace(/{waterCost}/g,       invoice.waterCost.toFixed(2));
};

// Water bill reminder only
export const buildReminderMessage = (invoice) => {
  return `Hello ${invoice.tenantName},

Reminder — your water bill is still pending:

Units Used: ${invoice.unitsUsed}
Amount Due: KES ${invoice.waterCost.toFixed(2)}

Please settle this at your earliest convenience.

Thank you.`;
};

export const sendWhatsAppMessage = async (phoneNumber, message) => {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken   = process.env.META_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken || phoneNumberId === 'your_meta_phone_number_id') {
    console.log(`📱 [DEV] WhatsApp to ${phoneNumber}:\n${message}\n`);
    return { success: true, dev: true };
  }

  const formattedPhone = formatPhone(phoneNumber);

  const response = await axios.post(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  return response.data;
};
