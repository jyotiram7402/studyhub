import { SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { EmailMessage } from "@/lib/email/types";

interface OrderEmailContext {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  itemTitle: string;
  total: number;
  libraryUrl: string;
}

interface SellerSaleEmailContext {
  sellerEmail: string;
  sellerName: string;
  itemTitle: string;
  amount: number;
  dashboardUrl: string;
}

export function purchaseSuccessEmail(context: OrderEmailContext): EmailMessage {
  return {
    to: context.buyerEmail,
    subject: `Your purchase is ready — ${context.itemTitle}`,
    text: [
      `Hi ${context.buyerName},`,
      ``,
      `Your payment for "${context.itemTitle}" was successful.`,
      `You now have lifetime download access from your library:`,
      context.libraryUrl,
      ``,
      `— The ${SITE_NAME} team`,
    ].join("\n"),
  };
}

export function orderConfirmationEmail(context: OrderEmailContext): EmailMessage {
  return {
    to: context.buyerEmail,
    subject: `Order confirmed — ${context.orderNumber}`,
    text: [
      `Hi ${context.buyerName},`,
      ``,
      `We received your order ${context.orderNumber}.`,
      `Item: ${context.itemTitle}`,
      `Total: ${formatPrice(context.total)}`,
      ``,
      `— The ${SITE_NAME} team`,
    ].join("\n"),
  };
}

export function receiptEmail(context: OrderEmailContext): EmailMessage {
  return {
    to: context.buyerEmail,
    subject: `Receipt for order ${context.orderNumber}`,
    text: [
      `Hi ${context.buyerName},`,
      ``,
      `Receipt for order ${context.orderNumber}`,
      `Item: ${context.itemTitle}`,
      `Amount paid: ${formatPrice(context.total)}`,
      ``,
      `Keep this email for your records.`,
      `— The ${SITE_NAME} team`,
    ].join("\n"),
  };
}

export function sellerSaleEmail(context: SellerSaleEmailContext): EmailMessage {
  return {
    to: context.sellerEmail,
    subject: `You made a sale — ${context.itemTitle}`,
    text: [
      `Hi ${context.sellerName},`,
      ``,
      `"${context.itemTitle}" just sold for ${formatPrice(context.amount)}.`,
      `The earnings have been credited to your wallet.`,
      context.dashboardUrl,
      ``,
      `— The ${SITE_NAME} team`,
    ].join("\n"),
  };
}
