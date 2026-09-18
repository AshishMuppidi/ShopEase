import axiosClient from './axiosClient'

/**
 * Simulated payment flow (NO real gateway).
 *   1) create a payment intent for an existing PENDING order
 *   2) confirm it with an outcome (SUCCESS default, or FAILURE)
 * The /confirm endpoint is the additive server-side completion added for this
 * frontend; it mirrors the webhook resolution but is auth + owner checked.
 */
export const paymentApi = {
  createIntent: async (orderId, idempotencyKey) =>
    (await axiosClient.post('/payments/intent', { orderId, idempotencyKey })).data,

  confirm: async (orderId, outcome = 'SUCCESS') =>
    (await axiosClient.post('/payments/confirm', { orderId, outcome })).data,
}