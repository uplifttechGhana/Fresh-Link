import React, { ReactNode, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { LeafDecoration } from './LeafDecoration';

interface CardProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /** Set to false when the card already places its own <LeafDecoration>s. */
  leaves?: boolean;
  /** Leaf image opacity 0–100. PNG alpha (transparent cutout) is always preserved. */
  leafOpacity?: number;
}

const LEAF_VARIANTS = ['monstera', 'fern', 'single'] as const;

function pickLayout() {
  const a = LEAF_VARIANTS[Math.floor(Math.random() * LEAF_VARIANTS.length)];
  const rest = LEAF_VARIANTS.filter((v) => v !== a);
  const b = rest[Math.floor(Math.random() * rest.length)];
  // ~1 in 3 cards puts the second leaf dead center instead of the opposite corner.
  const centered = Math.random() < 0.33;
  return { a, b, centered };
}

export function Card({ className, children, onClick, leaves = true, leafOpacity = 85 }: CardProps) {
  const [{ a: variantA, b: variantB, centered }] = useState(pickLayout);

  return (
    <div
      className={twMerge(
        'relative isolate bg-card rounded-3xl shadow-card overflow-hidden',
        onClick ?
          'cursor-pointer active:scale-[0.98] transition-transform' :
          '',
        className
      )}
      onClick={onClick}>

      {leaves && (
        <>
          <LeafDecoration
            variant={variantA}
            opacity={85}
            className="-left-3 -top-3 w-12 -rotate-12"
          />
          {centered ? (
            <LeafDecoration
              variant={variantB}
              opacity={30}
              className="left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 rotate-6"
            />
          ) : (
            <LeafDecoration
              variant={variantB}
              opacity={85}
              className="-right-4 -bottom-4 w-16 rotate-12"
            />
          )}
        </>
      )}
      {children}
    </div>);

}
