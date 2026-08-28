export interface PaymentOrderResponseDto {
  paymentId: string;
  /** Razorpay order id — passed straight to the checkout widget. */
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: string;
}

export interface PaymentVerifyResponseDto {
  status: string;
}
