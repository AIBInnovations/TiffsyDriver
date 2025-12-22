// src/screens/help/data/faqs.ts

import { FAQ } from "../types";

export const seedFAQs: FAQ[] = [
  {
    id: "faq-1",
    title: "How do I mark pickup for a batch?",
    shortAnswer:
      "Navigate to your active batch, tap on the pickup location, and use the 'Confirm Pickup' button after collecting all items.",
    details: [
      "Go to the Deliveries tab and select your active batch",
      "Tap on the pickup location card at the top",
      "Verify all items are collected using the checklist",
      "Tap 'Confirm Pickup' and wait for confirmation",
      "If items are missing, use 'Report Issue' before confirming",
    ],
    category: "Batch Issue",
  },
  {
    id: "faq-2",
    title: "What if OTP/POD fails at customer door?",
    shortAnswer:
      "Try asking customer to resend OTP, or use the 'POD Issues' option to capture alternate proof like a photo or signature.",
    details: [
      "First, ask the customer to check their SMS for the OTP",
      "If OTP isn't received, tap 'Resend OTP' (max 3 attempts)",
      "Use 'Alternate POD' to capture photo proof of delivery",
      "Customer can also provide a digital signature",
      "If all fails, mark as 'Delivery Issue' with reason",
    ],
    category: "POD Issue",
  },
  {
    id: "faq-3",
    title: "How to reorder stops in my route?",
    shortAnswer:
      "Reordering is only allowed for non-time-sensitive deliveries. Use the 'Optimize Route' or drag handles if enabled by dispatch.",
    details: [
      "Open your active batch and tap the route icon",
      "If reordering is enabled, you'll see drag handles",
      "Drag stops to your preferred order",
      "Time-sensitive deliveries are locked in position",
      "Tap 'Apply Changes' to save the new order",
    ],
    category: "Delivery Issue",
  },
  {
    id: "faq-4",
    title: "What to do when customer is unreachable?",
    shortAnswer:
      "Try calling/messaging through the app 2-3 times, wait the required time, then mark the delivery as 'Customer Unreachable'.",
    details: [
      "Tap the phone icon to call the customer (in-app)",
      "Try at least 2-3 contact attempts with 2-min gaps",
      "Wait at the location for the required time (usually 5-10 min)",
      "Take a photo of the location for records",
      "Select 'Failed Delivery' → 'Customer Unreachable'",
      "The order will be returned or rescheduled automatically",
    ],
    category: "Delivery Issue",
  },
  {
    id: "faq-5",
    title: "How to report a failed delivery with reason?",
    shortAnswer:
      "Use the 'Mark Failed' button on the delivery screen, select the appropriate reason, add notes and photo proof.",
    details: [
      "On the active delivery, tap 'Mark Failed'",
      "Select the failure reason from the list",
      "Add any additional notes for context",
      "Capture a photo if required (address/location)",
      "Confirm the failed delivery submission",
      "The item will be added to your return batch",
    ],
    category: "Delivery Issue",
  },
  {
    id: "faq-6",
    title: "Why is an order missing from my batch?",
    shortAnswer:
      "Orders can be reassigned by dispatch, cancelled by customer, or moved due to time constraints. Check the batch history.",
    details: [
      "Open your batch and tap 'Batch Details'",
      "Scroll to 'Removed Orders' section",
      "Each removed order shows the reason",
      "If unexpected, contact dispatch via the app",
      "Your earnings for that order are adjusted automatically",
    ],
    category: "Batch Issue",
  },
  {
    id: "faq-7",
    title: "App shows offline / cannot refresh deliveries",
    shortAnswer:
      "Check your internet connection, try switching between WiFi and mobile data, or force-restart the app.",
    details: [
      "Ensure mobile data or WiFi is connected",
      "Toggle airplane mode on/off to reset connection",
      "Pull down to refresh the deliveries screen",
      "If still offline, force-close and restart the app",
      "Clear app cache from device settings if persistent",
      "Contact support if issue continues",
    ],
    category: "App Bug",
  },
  {
    id: "faq-8",
    title: "Logout/login issues - can't access my account",
    shortAnswer:
      "Try resetting your password via OTP, clear app data if stuck, or contact support for account recovery.",
    details: [
      "Use 'Forgot Password' on the login screen",
      "Verify OTP sent to your registered number",
      "If OTP not received, check if number is correct",
      "Try clearing app data and reinstalling",
      "Contact support with your registered phone number",
    ],
    category: "Account",
  },
  {
    id: "faq-9",
    title: "How are my earnings calculated?",
    shortAnswer:
      "Earnings include base pay per delivery, distance bonus, time bonuses, and tips. View breakdown in the Earnings section.",
    details: [
      "Base pay: Fixed amount per successful delivery",
      "Distance bonus: Extra for longer distances",
      "Time bonus: For completing before deadline",
      "Peak hour bonus: Higher rates during rush hours",
      "Tips: 100% of customer tips go to you",
      "View detailed breakdown in Profile → Earnings",
    ],
    category: "Payment/Settlement",
  },
  {
    id: "faq-10",
    title: "When do I receive my payment?",
    shortAnswer:
      "Payments are processed weekly on Mondays. Daily payouts are available for eligible drivers with a small fee.",
    details: [
      "Weekly payout: Every Monday to your bank account",
      "Daily payout: Available after 50 completed deliveries",
      "Daily payout fee: ₹10 per transaction",
      "Minimum payout threshold: ₹100",
      "Bank details can be updated in Profile → Bank Account",
      "Payment issues? Contact support with transaction ID",
    ],
    category: "Payment/Settlement",
  },
];

export const contactOptions = [
  {
    id: "contact-call",
    type: "call" as const,
    label: "Call Support",
    value: "+91 1800-XXX-XXXX",
    availability: "Mon-Sat, 8 AM - 10 PM",
    responseTime: "Immediate",
  },
  {
    id: "contact-whatsapp",
    type: "whatsapp" as const,
    label: "WhatsApp Support",
    value: "+91 98XXX-XXXXX",
    availability: "24/7",
    responseTime: "Within 30 minutes",
  },
  {
    id: "contact-email",
    type: "email" as const,
    label: "Email Support",
    value: "driver-support@tiffsy.com",
    availability: "24/7",
    responseTime: "Within 24 hours",
  },
];

export const ticketCategories: Array<{
  value: string;
  label: string;
  icon: string;
}> = [
  { value: "Delivery Issue", label: "Delivery", icon: "package-variant" },
  { value: "Batch Issue", label: "Batch", icon: "format-list-bulleted" },
  { value: "POD Issue", label: "POD/OTP", icon: "qrcode-scan" },
  { value: "Payment/Settlement", label: "Payment", icon: "currency-inr" },
  { value: "App Bug", label: "App Bug", icon: "bug" },
  { value: "Account", label: "Account", icon: "account-circle" },
  { value: "Other", label: "Other", icon: "help-circle" },
];
