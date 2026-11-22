import { motion } from 'motion/react';
import { Player } from '../types/game';

interface MarkIconProps {
  player: Player;
  ghost?: boolean;
  vanishing?: boolean;
  dimmed?: boolean;
  sizeClass?: string;
}

export function MarkIcon({
  player,
  ghost = false,
  vanishing = false,
  dimmed = false,
  sizeClass = 'w-12 h-12 sm:w-16 sm:h-16',
}: MarkIconProps) {
  const strokeColor = player === 'X' ? '#DC2626' : '#2563EB';
  const opacityClass = ghost
    ? 'opacity-25'
    : dimmed
      ? 'opacity-30'
      : vanishing
        ? 'opacity-45'
        : 'opacity-100';

  if (player === 'X') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={`${sizeClass} ${opacityClass} transition-opacity duration-150`}
      >
        <motion.path
          d="M16 16L48 48"
          stroke={strokeColor}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeDasharray={vanishing ? '5 6' : undefined}
          initial={ghost ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M48 16L16 48"
          stroke={strokeColor}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeDasharray={vanishing ? '5 6' : undefined}
          initial={ghost ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.16, delay: ghost ? 0 : 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`${sizeClass} ${opacityClass} transition-opacity duration-150`}
    >
      <motion.circle
        cx="32"
        cy="32"
        r="17"
        stroke={strokeColor}
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeDasharray={vanishing ? '6 6' : undefined}
        initial={ghost ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
