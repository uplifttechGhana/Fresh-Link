"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const axios_1 = require("axios");
const envPath = (0, path_1.join)(__dirname, '..', '.env');
if ((0, fs_1.existsSync)(envPath)) {
    for (const line of (0, fs_1.readFileSync)(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (!process.env[key])
                process.env[key] = val;
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
const params = {
    username,
    to: phone,
    message: `FreshLink SMS test at ${new Date().toISOString()}`,
};
if (!isSandbox && process.env.AFRICASTALKING_SENDER_ID) {
    params.from = process.env.AFRICASTALKING_SENDER_ID;
}
console.log(`Sending test SMS to ${phone} (username=${username}, sandbox=${isSandbox})…`);
axios_1.default
    .post('https://api.africastalking.com/version1/messaging', new URLSearchParams(params), {
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
//# sourceMappingURL=test-at-sms.js.map