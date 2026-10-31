import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Scroll-driven animations (pinning, scrubbed fades) only run at this size and up;
// phones and small tablets get plain native scrolling
export const SCROLL_MOTION_QUERY = "(min-width: 1024px)"
