import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
  strokeWidth?: number;
};

const baseProps = {
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function Check({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function X({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ChevronRight({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronLeft({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ArrowLeft({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function RotateCcw({ className = '', strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg {...baseProps} strokeWidth={strokeWidth} className={className} {...rest}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
