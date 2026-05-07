import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...xs: ClassValue[]) { return twMerge(clsx(xs)); }
