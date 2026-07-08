import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { ChevronDown, ChevronUp, Smartphone } from 'lucide-react';

export function HelpCenter() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const faqs = [
    {
      q: 'How do I track my order?',
      a: "You can track your order in real-time by going to the 'Orders' tab and tapping on your active order. You'll see the driver's location on the map.",
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept Mobile Money (MTN, Vodafone Cash, ATMoney) and major credit/debit cards.',
    },
    {
      q: 'How do I become a verified farmer?',
      a: 'Go to your profile settings and submit your farm registration documents. Our team will review and verify your account within 48 hours.',
    },
    {
      q: 'What if my delivery is late?',
      a: 'If your delivery is delayed by more than 30 minutes, please contact support or message your driver directly from the tracking screen.',
    },
    {
      q: t('ussd.helpTitle'),
      a: t('ussd.helpDesc'),
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Help Center" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
        <button
          type="button"
          onClick={() => navigate('/ussd')}
          className="w-full mb-8 p-4 bg-forest text-white rounded-2xl flex items-center gap-4 active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <Smartphone size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">{t('ussd.settingsTitle')}</p>
            <p className="text-xs text-white/75 mt-0.5">{t('ussd.settingsDesc')}</p>
          </div>
        </button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-50 text-green rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            💬
          </div>
          <h2 className="text-xl font-display font-bold text-ink mb-2">How can we help?</h2>
          <p className="text-sm text-muted">Search our FAQ or contact support</p>
        </div>

        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 pl-1">
          Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Card key={i} className="overflow-hidden">
              <button
                className="w-full p-4 flex justify-between items-center text-left"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-medium text-sm text-ink pr-4">{faq.q}</span>
                {openIdx === i ? (
                  <ChevronUp size={18} className="text-muted flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-muted flex-shrink-0" />
                )}
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                  {i === faqs.length - 1 && (
                    <button
                      type="button"
                      onClick={() => navigate('/ussd')}
                      className="mt-3 block text-green font-bold text-sm"
                    >
                      Open USSD simulator →
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <button className="w-full bg-white border-2 border-green text-green font-bold py-4 rounded-2xl shadow-sm hover:bg-green-50 transition-colors">
            Contact Live Support
          </button>
        </div>
      </div>
    </div>
  );
}
