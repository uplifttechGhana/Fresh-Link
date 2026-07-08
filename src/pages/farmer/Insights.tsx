import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { TrendingUp, AlertCircle, CloudRain, PackageSearch } from 'lucide-react';
import { TypewriterText } from '../../components/ui/TypewriterText';
import { useDemandAnalytics } from '../../lib/hooks/useOrders';

export function Insights() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: demandData = [] } = useDemandAnalytics();
  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Smart Insights" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 space-y-6">
        {/* Dynamic Pricing Suggestion */}
        <section>
          <TypewriterText text="Dynamic Pricing" className="font-bold text-ink mb-3" />
          <Card className="p-4 border-2 border-green-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-ink">Tomatoes (Local Vine)</h4>
                <p className="text-xs text-muted">Current: ₵12.80/kg</p>
              </div>
              <div className="bg-green-50 text-green px-2 py-1 rounded-lg text-center">
                <p className="text-[10px] font-bold">Suggested</p>
                <p className="font-bold">₵14.50/kg</p>
              </div>
            </div>
            <p className="text-xs text-muted mb-4">
              Demand is high in your area due to upcoming festivals. We
              recommend increasing your price.
            </p>
            <Button fullWidth size="sm" onClick={() => setShowSuccess(true)}>
              Apply Suggested Price
            </Button>
          </Card>
        </section>

        {/* Demand Forecasting */}
        <section>
          <TypewriterText text="Demand Forecast" className="font-bold text-ink mb-3" />
          <Card className="p-4 h-56">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-sm text-ink">
                Projected Demand (Tomatoes)
              </h4>
              <span className="text-[10px] text-green font-bold bg-green-50 px-2 py-0.5 rounded-full">
                High Confidence
              </span>
            </div>
            <div className="h-32 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandData.length > 0 ? demandData : [{ name: 'Week 1', demand: 0 }]}>
                  <defs>
                    <linearGradient
                      id="colorDemand"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1">
                      
                      <stop offset="5%" stopColor="#EA7A3B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EA7A3B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: '#6B7770'
                    }}
                    dy={5} />
                  
                  <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{
                      fontSize: '10px',
                      color: '#6B7770'
                    }}
                    itemStyle={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#16201A'
                    }} />
                  
                  <Area
                    type="monotone"
                    dataKey="demand"
                    stroke="#EA7A3B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDemand)"
                    strokeDasharray="5 5" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* Inventory Prediction */}
        <section>
          <TypewriterText text="Inventory Prediction" className="font-bold text-ink mb-3" />
          <Card className="p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-soft text-orange flex items-center justify-center flex-shrink-0">
              <PackageSearch size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-ink">Stock-out Warning</h4>
              <p className="text-xs text-muted mt-1">
                Based on current sales velocity, your{' '}
                <span className="font-bold text-ink">Onions</span> will run out
                in <span className="font-bold text-orange">3 days</span>.
              </p>
              <button className="text-xs font-bold text-green mt-2">
                Update Inventory →
              </button>
            </div>
          </Card>
        </section>

        {/* Reminders */}
        <section>
          <TypewriterText text="Smart Alerts" className="font-bold text-ink mb-3" />
          <div className="space-y-3">
            <Card className="p-3 flex items-center gap-3 bg-blue-50 border-none">
              <CloudRain size={20} className="text-blue-500" />
              <div>
                <h4 className="font-bold text-sm text-ink">
                  Heavy Rain Expected
                </h4>
                <p className="text-xs text-muted">
                  Tomorrow afternoon. Secure your harvested crops.
                </p>
              </div>
            </Card>
            <Card className="p-3 flex items-center gap-3 bg-green-50 border-none">
              <TrendingUp size={20} className="text-green" />
              <div>
                <h4 className="font-bold text-sm text-ink">Harvest Reminder</h4>
                <p className="text-xs text-muted">
                  Garden Eggs are ready for optimal harvest today.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <Sheet open={showSuccess} onClose={() => setShowSuccess(false)}>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-green-50 text-green rounded-full flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round">
              
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold text-ink mb-2">
            Price Updated!
          </h3>
          <p className="text-muted text-sm mb-6">
            Your tomatoes are now listed at ₵14.50/kg.
          </p>
          <Button fullWidth onClick={() => setShowSuccess(false)}>
            Done
          </Button>
        </div>
      </Sheet>
    </div>);

}