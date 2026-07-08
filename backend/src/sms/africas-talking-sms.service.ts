import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { normalizeGhanaPhone } from '../common/utils/phone.util';

const AT_MESSAGING_URL_LIVE = 'https://api.africastalking.com/version1/messaging';
const AT_MESSAGING_URL_SANDBOX = 'https://api.sandbox.africastalking.com/version1/messaging';

function atMessagingUrl(username: string): string {
  return username === 'sandbox' ? AT_MESSAGING_URL_SANDBOX : AT_MESSAGING_URL_LIVE;
}

export interface SmsDeliveryStatus {
  configured: boolean;
  sandbox: boolean;
  username: string;
  senderId: string | null;
  hint: string;
}

@Injectable()
export class AfricasTalkingSmsService {
  private readonly logger = new Logger(AfricasTalkingSmsService.name);

  getStatus(): SmsDeliveryStatus {
    const apiKey = process.env.AFRICASTALKING_API_KEY?.trim();
    const username = process.env.AFRICASTALKING_USERNAME?.trim() || 'sandbox';
    const sandbox = username === 'sandbox';
    const configured = !!apiKey;

    let hint = 'Add AFRICASTALKING_API_KEY to backend/.env to send real SMS.';
    if (configured && sandbox) {
      hint =
        'Sandbox mode: open Sandbox → Launch Simulator, enter your +233 number, then send OTP — messages appear in the simulator (not on a real phone).';
    } else if (configured) {
      hint = 'Live SMS enabled. Custom sender ID must be approved in your AT dashboard.';
    }

    return {
      configured,
      sandbox,
      username,
      senderId: process.env.AFRICASTALKING_SENDER_ID?.trim() || null,
      hint,
    };
  }

  isConfigured(): boolean {
    return !!process.env.AFRICASTALKING_API_KEY?.trim();
  }

  /**
   * Send an SMS via Africa's Talking.
   * Without an API key, logs the message (dev stub) and returns.
   * With an API key, throws if the provider rejects the send.
   */
  async send(rawPhone: string, message: string): Promise<'sent' | 'stubbed'> {
    const phone = normalizeGhanaPhone(rawPhone);
    const apiKey = process.env.AFRICASTALKING_API_KEY?.trim();
    const username = process.env.AFRICASTALKING_USERNAME?.trim() || 'sandbox';
    const isSandbox = username === 'sandbox';

    if (!apiKey) {
      this.logger.warn(`[SMS stub] To ${phone}: ${message}`);
      return 'stubbed';
    }

    const params: Record<string, string> = {
      username,
      to: phone,
      message,
    };

    // Custom sender IDs are not supported in sandbox — AT uses AFRICASTKNG automatically.
    if (!isSandbox) {
      const senderId = process.env.AFRICASTALKING_SENDER_ID?.trim();
      if (senderId) params.from = senderId;
    }

    try {
      const { data } = await axios.post(atMessagingUrl(username), new URLSearchParams(params), {
        headers: {
          apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15_000,
      });

      const recipients = data?.SMSMessageData?.Recipients as
        | Array<{ number?: string; status?: string; statusCode?: number }>
        | undefined;

      const recipient = recipients?.find((r) => r.number?.includes(phone.replace('+', '')) || r.number === phone)
        ?? recipients?.[0];

      const status = recipient?.status?.toLowerCase() ?? '';
      const code = recipient?.statusCode;

      if (status === 'success' || code === 101 || code === 102) {
        this.logger.log(`SMS sent to ${phone} via AT (${username})`);
        return 'sent';
      }

      const providerMsg =
        recipient?.status
        ?? data?.SMSMessageData?.Message
        ?? 'Unknown Africa\'s Talking error';

      this.logger.error(`AT SMS rejected for ${phone}: ${providerMsg}`, data);
      throw new ServiceUnavailableException(
        `SMS could not be delivered (${providerMsg}). ` +
          (isSandbox
            ? 'Register this number in the AT Sandbox dashboard first.'
            : 'Check your AT account balance and sender ID.'),
      );
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;

      const atMessage =
        (err as { response?: { data?: { SMSMessageData?: { Message?: string } } } })?.response?.data
          ?.SMSMessageData?.Message
        ?? (err as Error).message;

      this.logger.error(`AT SMS HTTP error for ${phone}: ${atMessage}`, err);
      throw new ServiceUnavailableException(
        `SMS provider error: ${atMessage}. ` +
          (isSandbox ? 'Ensure the phone is registered in AT Sandbox.' : 'Check AT credentials and balance.'),
      );
    }
  }
}
