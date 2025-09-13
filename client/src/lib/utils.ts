import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function calculatePrice(costPrice: number, markup: number): number {
  return costPrice / (1 - markup / 100);
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Enquiry statuses
    "New": "bg-blue-100 text-blue-800 border-blue-200",
    "In Progress": "bg-amber-100 text-amber-800 border-amber-200",
    "Quoted": "bg-green-100 text-green-800 border-green-200",
    "Closed": "bg-gray-100 text-gray-800 border-gray-200",
    
    // Quotation statuses
    "Draft": "bg-gray-100 text-gray-800 border-gray-200",
    "Sent": "bg-blue-100 text-blue-800 border-blue-200",
    "Accepted": "bg-green-100 text-green-800 border-green-200",
    "Rejected": "bg-red-100 text-red-800 border-red-200",
    "Expired": "bg-red-100 text-red-800 border-red-200",
    
    // Sales Order statuses
    "Confirmed": "bg-green-100 text-green-800 border-green-200",
    "Processing": "bg-blue-100 text-blue-800 border-blue-200",
    "Shipped": "bg-purple-100 text-purple-800 border-purple-200",
    "Delivered": "bg-green-100 text-green-800 border-green-200",
    "Cancelled": "bg-red-100 text-red-800 border-red-200",
  };
  
  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
