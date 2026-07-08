import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { isAxiosError } from 'axios';

export interface PaystackBankOption {
  name: string;
  code: string;
  type: string;
}

/** Used when Paystack bank list API fails in dev/test. */
const MOBILE_MONEY_FALLBACK: PaystackBankOption[] = [
  { name: 'MTN Mobile Money', code: 'MTN', type: 'mobile_money' },
  { name: 'Vodafone Cash', code: 'VOD', type: 'mobile_money' },
  { name: 'AirtelTigo Money', code: 'ATL', type: 'mobile_money' },
];

const BANK_FALLBACK: PaystackBankOption[] = [
  { name: 'GCB Bank', code: '040', type: 'bank' },
  { name: 'Ecobank Ghana', code: '130', type: 'bank' },
  { name: 'Stanbic Bank', code: '190', type: 'bank' },
  { name: 'Absa Bank Ghana', code: '030', type: 'bank' },
];

@Injectable()
export class PaystackTransfersService {
  private readonly logger = new Logger(PaystackTransfersService.name);
  private readonly baseUrl = 'https://api.paystack.co';

  private get headers() {
    const key = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Paystack is not configured. Add PAYSTACK_SECRET_KEY to backend/.env and restart the server.',
      );
    }
    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  private parseError(err: unknown, fallback: string): never {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      const paystackMsg =
        (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
      this.logger.error(`Paystack error (${status ?? 'network'}): ${paystackMsg}`);
      throw new BadRequestException(
        status === 401
          ? 'Paystack rejected the secret key. Use sk_test_... in backend/.env for test mode.'
          : paystackMsg || fallback,
      );
    }
    throw new BadRequestException(fallback);
  }

  async listProviders(type: 'mobile_money' | 'bank'): Promise<PaystackBankOption[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/bank`, {
        headers: this.headers,
        params: {
          currency: 'GHS',
          type: type === 'mobile_money' ? 'mobile_money' : 'ghipss',
        },
      });
      const data = (res.data?.data ?? []) as Array<{
        name: string;
        code: string;
        type?: string;
      }>;
      return data.map((b) => ({
        name: b.name,
        code: b.code,
        type: type,
      }));
    } catch (err) {
      if (isAxiosError(err)) {
        const paystackMsg =
          (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
        this.logger.warn(`Paystack bank list failed (${type}): ${paystackMsg}`);
        const fallback = type === 'mobile_money' ? MOBILE_MONEY_FALLBACK : BANK_FALLBACK;
        if (fallback.length > 0) {
          return fallback;
        }
      }
      this.parseError(err, 'Could not load payout providers from Paystack.');
    }
  }

  async createRecipient(params: {
    type: 'mobile_money' | 'bank';
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<string> {
    const payload =
      params.type === 'mobile_money'
        ? {
            type: 'mobile_money',
            name: params.name,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: 'GHS',
          }
        : {
            type: 'ghipss',
            name: params.name,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: 'GHS',
          };

    try {
      const res = await axios.post(`${this.baseUrl}/transferrecipient`, payload, {
        headers: this.headers,
      });
      const code = res.data?.data?.recipient_code as string | undefined;
      if (!code) throw new BadRequestException('Paystack did not return a recipient code.');
      return code;
    } catch (err) {
      this.parseError(err, 'Could not register payout account with Paystack.');
    }
  }

  private isTransientNetworkError(err: unknown): boolean {
    if (!isAxiosError(err)) return false;
    if (err.response) return false;
    const code = (err.code ?? '').toLowerCase();
    const msg = (err.message ?? '').toLowerCase();
    return (
      code === 'econnreset' ||
      code === 'etimedout' ||
      code === 'enotfound' ||
      code === 'econnrefused' ||
      msg.includes('socket hang up') ||
      msg.includes('network error')
    );
  }

  async initiateTransfer(params: {
    amountGhs: number;
    recipientCode: string;
    reference: string;
    reason: string;
  }): Promise<{ status: string; transferCode?: string }> {
    const amountPesewas = Math.round(params.amountGhs * 100);
    if (amountPesewas < 100) {
      throw new BadRequestException('Minimum withdrawal is ₵1.00');
    }

    const payload = {
      source: 'balance',
      amount: amountPesewas,
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
    };

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await axios.post(`${this.baseUrl}/transfer`, payload, {
          headers: this.headers,
          timeout: 20_000,
        });
        const data = res.data?.data ?? {};
        return {
          status: (data.status as string) ?? 'pending',
          transferCode: data.transfer_code as string | undefined,
        };
      } catch (err) {
        lastErr = err;
        if (attempt === 0 && this.isTransientNetworkError(err)) {
          this.logger.warn('Paystack transfer network error — retrying once…');
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        this.parseError(err, 'Withdrawal could not be initiated with Paystack.');
      }
    }

    this.parseError(lastErr, 'Withdrawal could not be initiated with Paystack.');
  }
}
