import React, { useState } from 'react';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { Sprout, CheckCircle2 } from 'lucide-react';
import { useMyFundingRequests, useCreateFundingRequest, FundingRequest } from '../../lib/hooks/useFunding';

function formatApiError(err: unknown): string {
  const body = (err as { body?: { message?: string | string[] } })?.body;
  const message = body?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Submission failed. Try again.';
}

export function FarmerFunding() {
  const { data: requests = [], isLoading } = useMyFundingRequests();
  const createRequest = useCreateFundingRequest();

  const [openRequest, setOpenRequest] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !goal) return;
    createRequest.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        goal: parseFloat(goal),
        deadline: deadline || undefined,
      },
      {
        onSuccess: () => {
          setOpenRequest(false);
          setTitle(''); setGoal(''); setDescription(''); setDeadline('');
        },
      },
    );
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Farm Funding" showBack />

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        {/* CTA Banner */}
        <Card className="p-6 bg-forest text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <h2 className="text-xl font-display font-bold mb-2 relative z-10">Grow Your Farm</h2>
          <p className="text-sm text-green-100 mb-6 relative z-10 max-w-[80%]">
            Connect with investors to fund your next planting season. Get capital upfront,
            share the harvest returns.
          </p>
          <Button variant="secondary" onClick={() => setOpenRequest(true)} className="relative z-10">
            Request Funding
          </Button>
        </Card>

        <h3 className="font-bold text-ink mb-4">My Funding Requests</h3>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Sprout size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">You haven't requested any funding yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => <FundingCard key={req.id} req={req} />)}
          </div>
        )}
      </div>

      <Sheet open={openRequest} onClose={() => setOpenRequest(false)} title="Request Funding">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2024 Tomato Season"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
              Amount Needed (₵)
            </label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. 5000"
              min={1}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your project and how funds will be used..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block pl-1">
              Deadline (optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-ink outline-none focus:border-green focus:ring-1 focus:ring-green"
            />
          </div>

          <div className="bg-orange-soft p-4 rounded-xl">
            <p className="text-xs text-orange-800 font-medium leading-relaxed">
              By requesting funding, you agree to repay the principal plus any agreed return
              at the end of the project. FreshLink will verify your farm before listing.
            </p>
          </div>

          {createRequest.isError && (
            <p className="text-red-500 text-sm text-center">
              {formatApiError(createRequest.error)}
            </p>
          )}

          <Button
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={!title.trim() || !goal || createRequest.isPending}
            className="mt-4"
          >
            {createRequest.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function FundingCard({ req }: { req: FundingRequest }) {
  const progress = Math.min(100, Math.round((req.raised / req.goal) * 100));
  const statusClass: Record<string, string> = {
    active: 'bg-green-50 text-green',
    funded: 'bg-blue-50 text-blue-600',
    pending: 'bg-orange-soft text-orange',
    closed: 'bg-gray-100 text-muted',
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-sm text-ink">{req.title}</h4>
          {req.deadline && (
            <p className="text-xs text-muted">
              Deadline: {new Date(req.deadline).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass[req.status] ?? 'bg-gray-100 text-muted'}`}>
          {req.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span className="text-green">₵{req.raised.toLocaleString()} raised</span>
          <span className="text-muted">Goal: ₵{req.goal.toLocaleString()}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-muted mt-1">{progress}% funded</p>
      </div>

      {req.status === 'funded' && (
        <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green flex-shrink-0" />
          <p className="text-xs text-green-800 font-medium">
            Fully funded! Funds have been transferred to your wallet.
          </p>
        </div>
      )}
    </Card>
  );
}
