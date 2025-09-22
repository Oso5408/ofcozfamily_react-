import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function generateReceiptNumber() {
  const allBookings = JSON.parse(localStorage.getItem('ofcoz_bookings') || '[]');
  let newReceiptNumber;
  let isUnique = false;

  while (!isUnique) {
    newReceiptNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
    if (!allBookings.some(b => b.receiptNumber === newReceiptNumber)) {
      isUnique = true;
    }
  }
  return newReceiptNumber;
}

export function generatePassword() {
  return Math.random().toString(36).slice(-8);
}