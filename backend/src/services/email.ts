import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const getOrderConfirmationTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #1a1a1a; color: #c4a35a; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; }
    .content { padding: 30px; }
    .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .order-info h2 { margin-top: 0; color: #1a1a1a; font-size: 18px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .items-table th { background: #f5f5f5; font-weight: 600; }
    .total-row { font-weight: bold; font-size: 18px; }
    .address-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .footer { background: #1a1a1a; color: #999; padding: 20px; text-align: center; font-size: 12px; }
    .btn { display: inline-block; background: #c4a35a; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ZAMANẺ PS</h1>
    </div>
    <div class="content">
      <h2 style="color: #c4a35a;">Thank you for your order!</h2>
      <p>Hi ${order.shippingAddress?.firstName || 'Valued Customer'},</p>
      <p>We've received your order and it's being processed. Here are your order details:</p>
      
      <div class="order-info">
        <h2>Order #${order.orderNumber}</h2>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${Number(item.total).toFixed(2)} ILS</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2">Subtotal</td>
            <td>${Number(order.subtotal).toFixed(2)} ILS</td>
          </tr>
          ${Number(order.discountAmount) > 0 ? `
            <tr>
              <td colspan="2">Discount</td>
              <td>-${Number(order.discountAmount).toFixed(2)} ILS</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="2">Shipping</td>
            <td>${Number(order.shippingCost) === 0 ? 'FREE' : `${Number(order.shippingCost).toFixed(2)} ILS`}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td>${Number(order.total).toFixed(2)} ILS</td>
          </tr>
        </tbody>
      </table>

      ${order.shippingAddress ? `
        <h3>Shipping Address</h3>
        <div class="address-box">
          <p style="margin: 0;">
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} ${order.shippingAddress.postalCode || ''}<br>
            ${order.shippingAddress.country}<br>
            ${order.shippingAddress.phone}
          </p>
        </div>
      ` : ''}

      <p style="margin-top: 20px;">You can track your order status at any time:</p>
      <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="btn">Track Order</a>

      <p style="margin-top: 30px; color: #666;">
        If you have any questions, please reply to this email or contact us at ${process.env.STORE_EMAIL || 'support@zamaneps.com'}.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Zamanẻ ps. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;

// Send order confirmation email
export const sendOrderConfirmation = async (order: any) => {
  try {
    await transporter.sendMail({
      from: `"Zamanẻ ps" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: getOrderConfirmationTemplate(order),
    });
    console.log(`Order confirmation sent to ${order.email}`);
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
  }
};

// Send order status update
export const sendOrderStatusUpdate = async (email: string, order: any) => {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed and is being prepared.',
    PROCESSING: 'Your order is being processed.',
    SHIPPED: `Your order has been shipped! Tracking number: ${order.trackingNumber || 'N/A'}`,
    DELIVERED: 'Your order has been delivered. Enjoy!',
    CANCELLED: 'Your order has been cancelled.',
    REFUNDED: 'Your order has been refunded.',
  };

  try {
    await transporter.sendMail({
      from: `"Zamanẻ ps" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Order Update #${order.orderNumber} - ${order.status}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Order Update</h1>
          <p>Order #${order.orderNumber}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p>${statusMessages[order.status] || ''}</p>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" style="display: inline-block; background: #c4a35a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order</a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send status update:', error);
  }
};

// Send password reset email
export const sendPasswordReset = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: `"Zamanẻ ps" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Password Reset</h1>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #c4a35a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p style="margin-top: 20px; color: #666;">This link expires in 1 hour.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset:', error);
    throw error;
  }
};
