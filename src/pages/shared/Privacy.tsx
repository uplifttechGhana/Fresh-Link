import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
export function Privacy() {
  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Privacy Policy" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10">
        <div className="prose prose-sm max-w-none text-ink">
          <p className="text-muted mb-6">Last updated: October 2023</p>

          <h3 className="font-display font-bold text-lg mb-2">
            1. Data We Collect
          </h3>
          <p className="mb-6 leading-relaxed">
            We collect information you provide directly to us, including your
            name, phone number, location, and payment details. We also collect
            transaction history and usage data.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">
            2. How We Use It
          </h3>
          <p className="mb-6 leading-relaxed">
            Your data is used to facilitate marketplace transactions, improve
            our services, provide customer support, and send important service
            updates.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">3. Sharing</h3>
          <p className="mb-6 leading-relaxed">
            We share necessary information (like name and location) between
            buyers, farmers, and drivers to complete deliveries. We do not sell
            your personal data to third parties.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">
            4. Your Rights
          </h3>
          <p className="mb-6 leading-relaxed">
            You have the right to access, correct, or delete your personal data.
            You can manage these preferences in your account settings.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">5. Security</h3>
          <p className="mb-6 leading-relaxed">
            We implement industry-standard security measures to protect your
            information from unauthorized access or disclosure.
          </p>

          <h3 className="font-display font-bold text-lg mb-2">6. Contact</h3>
          <p className="mb-6 leading-relaxed">
            If you have questions about this policy or your data, please contact
            our privacy team through the Help Center.
          </p>
        </div>
      </div>
    </div>);

}