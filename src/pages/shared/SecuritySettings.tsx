import React, { useState } from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
export function SecuritySettings() {
  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Security & Privacy" showBack />
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 pl-1">
            Login Security
          </h3>
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm text-ink">
                  Change Password
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Last changed 3 months ago
                </p>
              </div>
              <button className="text-green text-sm font-bold">Update</button>
            </div>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm text-ink">
                  Biometric Login
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Use Face ID / Touch ID
                </p>
              </div>
              <Toggle
                checked={biometric}
                onChange={() => setBiometric(!biometric)} />
              
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm text-ink">
                  Two-Factor Auth
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Add an extra layer of security
                </p>
              </div>
              <Toggle
                checked={twoFactor}
                onChange={() => setTwoFactor(!twoFactor)} />
              
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 pl-1">
            Data Privacy
          </h3>
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50">
              <h4 className="font-medium text-sm text-ink">Privacy Policy</h4>
              <span className="text-gray-300">›</span>
            </div>
            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
              <h4 className="font-medium text-sm text-red-500">
                Delete Account
              </h4>
              <span className="text-gray-300">›</span>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}
function Toggle({
  checked,
  onChange



}: {checked: boolean;onChange: () => void;}) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-green' : 'bg-gray-200'}`}>
      
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      
    </button>);

}