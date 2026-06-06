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

// Water bill only — no rent mention at all
export const buildInvoiceMessage = (invoice) => {
  return `Hello ${invoice.tenantName},

WATER BILL:
Previous Reading: ${invoice.previousReading}
Current Reading: ${invoice.currentReading}
Units Used: ${invoice.unitsUsed}
Amount Due: KES ${invoice.waterCost.toFixed(2)}

Thank you.`;
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
