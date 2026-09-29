"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Minimal, iconic Athens logo combining Quiz & Combat:
 * - Greek Hoplite Shield (Athens, Defense & Tournament Arena)
 * - Crossed Combat Swords (Challenger vs Defender Duel)
 * - Central Question Mark (The Quiz & Knowledge)
 */
export function LogoIcon({ size = 28, className, ...props }: Omit<LogoProps, "showText">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="Athens Logo"
      role="img"
      {...props}
    >
      {/* 1. Crossed Swords (Combat / Dueling Blades in background) */}
      <g stroke="#1d1d1b" strokeLinecap="round" strokeLinejoin="round">
        {/* Sword 1: Top-Left to Bottom-Right */}
        <line x1="4.5" y1="4.5" x2="27.5" y2="27.5" strokeWidth="1.75" />
        <circle cx="4" cy="4" r="1.25" fill="#1d1d1b" stroke="none" />
        <line x1="4.5" y1="4.5" x2="7.5" y2="7.5" strokeWidth="2.5" />
        <line x1="6" y1="9" x2="9" y2="6" strokeWidth="1.75" />

        {/* Sword 2: Top-Right to Bottom-Left */}
        <line x1="27.5" y1="4.5" x2="4.5" y2="27.5" strokeWidth="1.75" />
        <circle cx="28" cy="4" r="1.25" fill="#1d1d1b" stroke="none" />
        <line x1="27.5" y1="4.5" x2="24.5" y2="7.5" strokeWidth="2.5" />
        <line x1="23" y1="6" x2="26" y2="9" strokeWidth="1.75" />
      </g>

      {/* 2. Greek Hoplite Shield (Solid warm gold fill covers sword intersection cleanly) */}
      <circle cx="16" cy="16" r="10.5" fill="#ffe14d" stroke="#1d1d1b" strokeWidth="1.75" />
      {/* Subtle inner concentric shield groove */}
      <circle cx="16" cy="16" r="8.75" stroke="#1d1d1b" strokeWidth="0.75" strokeOpacity="0.25" />

      {/* 3. Central Quiz Emblem: Crisp Question Mark */}
      <path
        d="M 13.5 12.2 C 13.5 10.3 14.6 9.25 16 9.25 C 17.4 9.25 18.5 10.3 18.5 11.8 C 18.5 13.2 17.4 14.1 16 15 V 16.2"
        stroke="#1d1d1b"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19.75" r="1.15" fill="#1d1d1b" />
    </svg>
  );
}

/**
 * Full Logo lockup with Fraunces typography for the site header
 */
export function Logo({ size = 28, className, showText = false, ...props }: LogoProps) {
  if (!showText) {
    return <LogoIcon size={size} className={className} {...props} />;
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoIcon size={size} {...props} />
      <span className="font-heading text-2xl font-bold tracking-tight text-ink leading-none">
        Athens
      </span>
    </div>
  );
}

export default Logo;
