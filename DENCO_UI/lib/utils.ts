import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * cn("px-2 py-1", condition && "bg-blue-500")
 * cn("text-sm", props.className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
