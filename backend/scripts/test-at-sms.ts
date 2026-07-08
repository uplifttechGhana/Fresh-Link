/**
 * Quick SMS test — run from backend folder:
 *   npm run test:sms -- +233200000001
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: npx ts-node --transpile-only scripts/test-at-sms.ts +233XXXXXXXXX');
  process.exit(1);
}

const apiKey = process.env.AFRICASTALKING_API_KEY?.trim();
const username = process.env.AFRICASTALKING_USERNAME?.trim() || 'sandbox';

if (!apiKey) {
  console.error('❌ AFRICASTALKING_API_KEY is not set in backend/.env');
  process.exit(1);
}

const isSandbox = username === 'sandbox';
const params: Record<string, string> = {
  username,
  to: phone,
  message: `FreshLink SMS test at ${new Date().toISOString()}`,
};
if (!isSandbox && process.env.AFRICASTALKING_SENDER_ID) {
  params.from = process.env.AFRICASTALKING_SENDER_ID;
}

const messagingUrl = isSandbox
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging';

console.log(`Sending test SMS to ${phone} (username=${username}, sandbox=${isSandbox})…`);

axios
  .post(messagingUrl, new URLSearchParams(params), {
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  .then((res) => {
    console.log('✅ Response:', JSON.stringify(res.data, null, 2));
  })
  .catch((err) => {
    console.error('❌ Failed:', err.response?.data ?? err.message);
    process.exit(1);
  });
