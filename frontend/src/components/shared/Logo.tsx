import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="hsl(var(--accent, 280 80% 60%))" />
        </linearGradient>
        <linearGradient id="logo-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent, 280 80% 60%))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
        </linearGradient>
        <filter id="logo-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Glow Aura */}
      <circle cx="50" cy="50" r="30" fill="url(#logo-grad-1)" opacity="0.15" filter="url(#logo-glow)" />

      {/* Geometric Loop Path 1 */}
      <path
        d="M25 40C25 28.9543 33.9543 20 45 20H55C66.0457 20 75 28.9543 75 40V60C75 71.0457 66.0457 80 55 80H45C33.9543 80 25 71.0457 25 60V40Z"
        stroke="url(#logo-grad-2)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Premium Hexagonal Loop Path 2 */}
      <path
        d="M50 25L75 40V60L50 75L25 60V40L50 25Z"
        fill="url(#logo-grad-1)"
        fillRule="evenodd"
        clipRule="evenodd"
        opacity="0.85"
      />

      {/* Central Diamond Accent */}
      <path
        d="M50 38L62 50L50 62L38 50L50 38Z"
        fill="white"
        opacity="0.9"
        className="animate-pulse"
      />
    </svg>
  );
}
