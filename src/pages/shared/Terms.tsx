import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
export function Terms() {
  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Terms of Service" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        <div className="prose prose-sm max-w-none text-ink">
          <p className="text-muted mb-6">Last updated: October 2023</p>

          <h3 className="font-display font-bold text-lg mb-2">1. Acceptance</h3>
          <p className="mb-6 leading-relaxed">
            By accessing and using FreshLink Ghana, you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please
            do not use our platform.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">2. Accounts</h3>
          <p className="mb-6 leading-relaxed">
            You must provide accurate information when creating an account. You
            are responsible for maintaining the security of your account
            credentials and for all activities that occur under your account.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">
            3. Marketplace Conduct
          </h3>
          <p className="mb-6 leading-relaxed">
            Users agree to conduct transactions fairly and honestly. Farmers
            must accurately represent their produce. Buyers must honor their
            purchase commitments.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">
            4. Payments & Escrow
          </h3>
          <p className="mb-6 leading-relaxed">
            Payments are held securely in escrow until delivery is confirmed.
            FreshLink takes a small commission on successful transactions to
            maintain the platform.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">5. Delivery</h3>
          <p className="mb-6 leading-relaxed">
            Transport providers agree to deliver goods safely and within the
            estimated timeframe. Buyers must be present at the agreed drop-off
            location.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">6. Liability</h3>
          <p className="mb-6 leading-relaxed">
            FreshLink acts as a facilitator. We are not directly liable for the
            quality of produce or delays caused by external factors, though we
            provide dispute resolution services.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">7. Privacy</h3>
          <p className="mb-6 leading-relaxed">
            Your use of FreshLink is also governed by our Privacy Policy, which
            details how we collect and use your data.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">8. Changes</h3>
          <p className="mb-6 leading-relaxed">
            We may update these terms periodically. Continued use of the app
            constitutes acceptance of any changes.
          </p>
        </div>
      </div>
    </div>);

}