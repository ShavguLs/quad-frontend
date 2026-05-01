import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

const mockEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

import { api, clearCsrfToken, __resetHasApiForTesting, __setHasApiForTesting } from '../api';

const createJsonResponse = (payload: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(typeof payload === 'string' ? payload : JSON.stringify(payload)),
  headers: new Headers({ 'content-type': 'application/json' }),
} as Response);

describe('Wallet API', () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(createJsonResponse({}));
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearCsrfToken();
    __resetHasApiForTesting();
  });

  it('initiates a deposit and returns checkout data', async () => {
    fetchSpy.mockResolvedValueOnce(createJsonResponse({ csrfToken: 'csrf-token' }));
    fetchSpy.mockResolvedValueOnce(createJsonResponse({
      message: 'Deposit initiated',
      orderId: 'order-1',
      checkoutUrl: 'https://keepz.test/pay/order-1',
      status: 'PENDING',
    }));

    const result = await api.deposit(25);

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/wallet/deposit/'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(result.checkoutUrl).toBe('https://keepz.test/pay/order-1');
    expect(result.orderId).toBe('order-1');
  });

  it('fetches deposit status for reconciliation', async () => {
    fetchSpy.mockResolvedValueOnce(createJsonResponse({
      orderId: 'order-2',
      status: 'COMPLETED',
      providerStatus: 'SUCCESS',
      credited: true,
      amount: '₾45.00',
    }));

    const result = await api.getDepositStatus('order-2');

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/wallet/deposit/status/?order_id=order-2'),
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(result.credited).toBe(true);
    expect(result.providerStatus).toBe('SUCCESS');
  });

  it('checks out a cart with book ids', async () => {
    fetchSpy.mockResolvedValueOnce(createJsonResponse({ csrfToken: 'csrf-token' }));
    fetchSpy.mockResolvedValueOnce(createJsonResponse({
      status: 'COMPLETED',
      orders: [],
    }));

    const result = await api.checkoutCart({ bookIds: [1, 2] });

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/orders/checkout/'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ books: [1, 2] }),
      }),
    );
    expect(result.status).toBe('COMPLETED');
  });

  it('exposes Keepz checkout URL when cart payment is required', async () => {
    fetchSpy.mockResolvedValueOnce(createJsonResponse({ csrfToken: 'csrf-token' }));
    fetchSpy.mockResolvedValueOnce(createJsonResponse({
      status: 'PAYMENT_REQUIRED',
      orderId: 'checkout-1',
      checkoutUrl: 'https://keepz.test/pay/checkout-1',
      amountDue: '₾30.00',
    }));

    const result = await api.checkoutCart({ bookIds: [3] });

    expect(result.status).toBe('PAYMENT_REQUIRED');
    expect(result.checkoutUrl).toBe('https://keepz.test/pay/checkout-1');
  });

  it('fetches cart checkout status by Keepz order id', async () => {
    fetchSpy.mockResolvedValueOnce(createJsonResponse({
      orderId: 'checkout-2',
      status: 'COMPLETED',
      providerStatus: 'SUCCESS',
      orders: [],
    }));

    const result = await api.getCartCheckoutStatus('checkout-2');

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/orders/checkout/status/?order_id=checkout-2'),
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(result.providerStatus).toBe('SUCCESS');
  });

  it('fails fast when backend access is disabled', async () => {
    __setHasApiForTesting(false);

    await expect(api.deposit(10)).rejects.toThrow('BACKEND_NOT_CONFIGURED');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
