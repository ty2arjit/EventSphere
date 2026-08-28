import type { PaymentOrderView } from '../../application/CreatePaymentOrderService';
import type { PaymentOrderResponseDto } from '../dto/PaymentDtos';

export function toPaymentOrderResponse(view: PaymentOrderView): PaymentOrderResponseDto {
  return {
    paymentId: view.paymentId,
    orderId: view.providerOrderId,
    amount: view.amount,
    currency: view.currency,
    keyId: view.keyId,
    status: view.status,
  };
}
