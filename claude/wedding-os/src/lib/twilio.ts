import twilio from 'twilio';

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  return twilio(accountSid, authToken);
}

export function isTwilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSms(to: string, body: string) {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error('TWILIO_PHONE_NUMBER not set');
  return getClient().messages.create({ to, from, body });
}

export async function sendWhatsApp(to: string, body: string) {
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!fromNumber) throw new Error('TWILIO_WHATSAPP_NUMBER not set');
  return getClient().messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${fromNumber}`,
    body,
  });
}
