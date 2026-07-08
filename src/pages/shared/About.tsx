import React from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Globe, Mail, Twitter, Instagram, ChevronRight } from 'lucide-react';
export function About() {
  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="About FreshLink" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-green rounded-3xl flex items-center justify-center shadow-float mb-4">
            <span className="text-white font-display font-bold text-3xl">
              FL
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-ink">
            FreshLink Ghana
          </h1>
          <p className="text-sm text-muted mt-1">Version 1.0.0</p>
        </div>

        <div className="mb-8">
          <p className="text-ink text-center leading-relaxed">
            Connecting Ghanaian farmers directly with buyers and transport
            providers. Our mission is to empower local agriculture, reduce
            post-harvest losses, and ensure fresh produce reaches every table.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-green mb-1">10k+</div>
            <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
              Farmers
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-green mb-1">50k+</div>
            <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
              Buyers
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold text-green mb-1">5k+</div>
            <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
              Drivers
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <LinkRow icon={<Globe size={20} />} title="Website" />
          <LinkRow icon={<Mail size={20} />} title="Contact Us" />
          <LinkRow icon={<Twitter size={20} />} title="Twitter" />
          <LinkRow
            icon={<Instagram size={20} />}
            title="Instagram"
            border={false} />
          
        </Card>
      </div>
    </div>);

}
function LinkRow({
  icon,
  title,
  border = true




}: {icon: React.ReactNode;title: string;border?: boolean;}) {
  return (
    <div
      className={`flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer ${border ? 'border-b border-gray-100' : ''}`}>
      
      <div className="flex items-center gap-3">
        <div className="text-green">{icon}</div>
        <span className="font-medium text-sm text-ink">{title}</span>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </div>);

}