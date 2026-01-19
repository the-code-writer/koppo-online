/**
 * Authentication Diagnostic Tool
 * Use this to debug authentication issues
 */

export const runAuthDiagnostic = () => {
  console.log('🔍 === AUTHENTICATION DIAGNOSTIC ===');
  
  // 1. Check localStorage
  console.log('\n📦 LocalStorage Check (should be empty - using cookies instead):');
  try {
    const userData = localStorage.getItem('user_data');
    const tokensData = localStorage.getItem('tokens');
    const rememberedCreds = localStorage.getItem('rememberedCredentials');
    
    console.log('user_data exists:', !!userData, '❌ Should be false');
    console.log('tokens exists:', !!tokensData, '❌ Should be false');
    console.log('rememberedCredentials exists:', !!rememberedCreds, '✅ OK if present');
    
    if (userData || tokensData) {
      console.warn('⚠️ Found auth data in localStorage - this should be moved to cookies!');
    }
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('user_data valid:', !!parsed.email);
        console.log('user email:', parsed.email);
      } catch (e) {
        console.error('user_data parse error:', e);
      }
    }
    
    if (tokensData) {
      try {
        const parsed = JSON.parse(tokensData);
        console.log('tokens valid:', !!parsed.access?.token);
        console.log('access token length:', parsed.access?.token?.length);
      } catch (e) {
        console.error('tokens parse error:', e);
      }
    }
  } catch (error) {
    console.error('localStorage error:', error);
  }
  
  // 2. Check Cookies
  console.log('\n🍪 Cookie Check (primary storage location):');
  try {
    const cookies = document.cookie.split(';');
    console.log('Total cookies found:', cookies.length);
    
    const userCookie = cookies.find(c => c.trim().startsWith('user_data='));
    const tokensCookie = cookies.find(c => c.trim().startsWith('tokens='));
    
    console.log('user_data cookie exists:', !!userCookie, '✅ Should be true');
    console.log('tokens cookie exists:', !!tokensCookie, '✅ Should be true');
    
    if (!userCookie || !tokensCookie) {
      console.error('❌ Missing auth cookies - authentication will fail!');
    }
    
    if (userCookie) {
      const value = userCookie.split('=')[1];
      console.log('user_data cookie value length:', value?.length);
      console.log('user_data cookie preview:', value?.substring(0, 50) + '...');
    }
    
    if (tokensCookie) {
      const value = tokensCookie.split('=')[1];
      console.log('tokens cookie value length:', value?.length);
      console.log('tokens cookie preview:', value?.substring(0, 50) + '...');
    }
  } catch (error) {
    console.error('Cookie error:', error);
  }
  
  // 3. Check Browser Environment
  console.log('\n🌐 Browser Environment:');
  console.log('User Agent:', navigator.userAgent);
  console.log('Cookie Enabled:', navigator.cookieEnabled);
  console.log('LocalStorage Available:', typeof Storage !== 'undefined');
  console.log('HTTPS:', window.location.protocol === 'https:');
  console.log('Hostname:', window.location.hostname);
  console.log('Port:', window.location.port);
  
  // 4. Check Token Expiration
  console.log('\n⏰ Token Expiration Check:');
  try {
    const tokensCookie = document.cookie.split(';').find(c => c.trim().startsWith('tokens='));
    if (tokensCookie) {
      const value = tokensCookie.split('=')[1];
      // Try to decode (this is simplified)
      try {
        const decoded = atob(value);
        const tokens = JSON.parse(decoded);
        if (tokens.access?.token) {
          const payload = JSON.parse(atob(tokens.access.token.split('.')[1]));
          const exp = payload.exp;
          const now = Date.now() / 1000;
          const isExpired = exp < now;
          const timeUntilExpiry = exp - now;
          
          console.log('Token expires at:', new Date(exp * 1000).toISOString());
          console.log('Current time:', new Date(now * 1000).toISOString());
          console.log('Is expired:', isExpired);
          console.log('Time until expiry:', Math.floor(timeUntilExpiry / 60), 'minutes');
        }
      } catch (e) {
        console.log('Could not decode token (might be encrypted)');
      }
    }
  } catch (error) {
    console.error('Token check error:', error);
  }
  
  console.log('\n🔍 === END DIAGNOSTIC ===\n');
};

export const clearAllAuthData = () => {
  console.log('🧹 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('user_data');
  localStorage.removeItem('tokens');
  localStorage.removeItem('rememberedCredentials');
  
  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.startsWith('user_data') || name.startsWith('tokens')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
    }
  });
  
  console.log('✅ All auth data cleared');
};

// Make diagnostic available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authDiagnostic = runAuthDiagnostic;
  (window as any).clearAuthData = clearAllAuthData;
  console.log('🔧 Auth diagnostic tools available: run authDiagnostic() or clearAuthData() in console');
}
