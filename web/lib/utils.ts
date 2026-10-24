import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper de shadcn: une clases y resuelve conflictos de Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
