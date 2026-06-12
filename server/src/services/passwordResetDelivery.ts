interface PasswordResetDelivery {
  email: string;
  resetUrl: string;
}

export async function deliverPasswordReset(email: string, token: string) {
  if (process.env.NODE_ENV !== 'production') return;

  const deliveryUrl = process.env.PASSWORD_RESET_DELIVERY_URL;
  const appUrl = process.env.APP_URL;
  if (!deliveryUrl || !appUrl) {
    throw new Error('Password reset delivery is not configured.');
  }

  const resetUrl = new URL('/auth', appUrl);
  resetUrl.searchParams.set('mode', 'reset');
  resetUrl.searchParams.set('token', token);

  const payload: PasswordResetDelivery = { email, resetUrl: resetUrl.toString() };
  const response = await fetch(deliveryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.PASSWORD_RESET_DELIVERY_TOKEN
        ? { Authorization: `Bearer ${process.env.PASSWORD_RESET_DELIVERY_TOKEN}` }
        : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Password reset delivery failed with status ${response.status}.`);
  }
}
