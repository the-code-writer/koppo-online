// Telegram Bot URL Examples for Token Messaging

// Initialize TelegramAuth
import { TelegramAuth } from './src/utils/TelegramAuth';

// Configure your bot
TelegramAuth.initialize('YOUR_BOT_TOKEN', 'YOUR_BOT_USERNAME');

// Example 1: Simple token message URL
const token = 'a1b2c3d4e5f6g7h8i9j0';
const simpleUrl = TelegramAuth.generateTokenMessageUrl(token);
console.log('Simple URL:', simpleUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?start=token_a1b2c3d4e5f6g7h8i9j0_1642123456

// Example 2: Token with specific user
const userId = 'user123';
const userUrl = TelegramAuth.generateTokenMessageUrl(token, userId);
console.log('User URL:', userUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?start=token_a1b2c3d4e5f6g7h8i9j0_user_user123_1642123456

// Example 3: Deep link for authentication
const authUrl = TelegramAuth.generateDeepLink(token, 'auth', userId);
console.log('Auth URL:', authUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?start=auth_eyJ0b2tlbiI6ImExYjJjM2Q0ZTVmNmc3aDhpOWowIiwiYWN0aW9uIjoiYXV0aCIsInVzZXJJZCI6InVzZXIxMjMiLCJ0aW1lc3RhbXAiOjE2NDIxMjM0NTZ9

// Example 4: Direct message with token
const message = 'Please use this token to connect your account';
const directUrl = TelegramAuth.generateDirectMessageUrl(token, message);
console.log('Direct URL:', directUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?text=Please%20use%20this%20token%20to%20connect%20your%20account&token=a1b2c3d4e5f6g7h8i9j0

// Example 5: Account linking URL
const linkUrl = TelegramAuth.generateDeepLink(token, 'link', userId);
console.log('Link URL:', linkUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?start=link_eyJ0b2tlbiI6ImExYjJjM2Q0ZTVmNmc3aDhpOWowIiwiYWN0aW9uIjoibGluayIsInVzZXJJZCI6InVzZXIxMjMiLCJ0aW1lc3RhbXAiOjE2NDIxMjM0NTZ9

// Example 6: Email verification URL
const verifyUrl = TelegramAuth.generateDeepLink(token, 'verify', userId);
console.log('Verify URL:', verifyUrl);
// Output: https://t.me/YOUR_BOT_USERNAME?start=verify_eyJ0b2tlbiI6ImExYjJjM2Q0ZTVmNmc3aDhpOWowIiwiYWN0aW9uIjoidmVyaWZ5IiwidXNlcklkIjoidXNlcjEyMyIsInRpbWVzdGFtcCI6MTY0MjEyMzQ1Nn0=

// Usage in React Component
const TelegramTokenSender = ({ token, userId }) => {
  const handleSendToken = () => {
    // Generate URL for token message
    const url = TelegramAuth.generateTokenMessageUrl(token, userId);
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Or copy to clipboard
    navigator.clipboard.writeText(url);
  };

  return (
    <button onClick={handleSendToken}>
      Send Token to Telegram
    </button>
  );
};

// Bot-side handling (Telegram Bot API example)
/*
// In your Telegram bot code (Node.js example):
bot.onText(/\/start (.+)/, async (msg, match) => {
  const startParam = match[1];
  
  if (startParam.startsWith('token_')) {
    // Extract token from start parameter
    const parts = startParam.split('_');
    const token = parts[1];
    const userId = parts[3] || 'unknown';
    
    // Send confirmation message
    await bot.sendMessage(msg.chat.id, 
      `✅ Token received: ${token.substring(0, 8)}...\n` +
      `👤 User ID: ${userId}\n` +
      `🔗 Use this token to connect your account.`
    );
    
    // You can also store the token in your database
    // await storeToken(token, userId, msg.chat.id);
  }
});

// For deep links with base64 encoded data:
bot.onText(/\/start (auth|link|verify)_(.+)/, async (msg, match) => {
  const action = match[1];
  const encodedData = match[2];
  
  try {
    const decoded = JSON.parse(atob(encodedData));
    const { token, userId, timestamp } = decoded;
    
    switch (action) {
      case 'auth':
        await handleAuthentication(msg.chat.id, token, userId);
        break;
      case 'link':
        await handleAccountLinking(msg.chat.id, token, userId);
        break;
      case 'verify':
        await handleVerification(msg.chat.id, token, userId);
        break;
    }
  } catch (error) {
    await bot.sendMessage(msg.chat.id, '❌ Invalid token format');
  }
});
*/
