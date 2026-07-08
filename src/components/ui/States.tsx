import React from 'react';
import { twMerge } from 'tailwind-merge';
interface StateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
}
export function EmptyState({ icon, title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      {icon && <div className="text-muted mb-4">{icon}</div>}
      {title &&
      <h3 className="text-lg font-display font-bold text-ink mb-2">
          {title}
        </h3>
      }
      {description && <p className="text-sm text-muted mb-6">{description}</p>}
      {action}
    </div>);

}
export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this content.',
  onRetry
}: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 className="text-lg font-display font-bold text-ink mb-2">{title}</h3>
      <p className="text-sm text-muted mb-6">{description}</p>
      {onRetry &&
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-ink shadow-sm hover:bg-gray-50">
        
          Try Again
        </button>
      }
    </div>);

}
export function SuccessState({ title, description }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3 className="text-xl font-display font-bold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>);

}
export function Skeleton({ className }: {className?: string;}) {
  return (
    <div
      className={twMerge('bg-gray-200 animate-pulse rounded-xl', className)} />);


}
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex justify-between items-center mt-1">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>);

}
export function ListRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>);

}