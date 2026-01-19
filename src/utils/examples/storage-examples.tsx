import React, { useState } from 'react';
import { useLocalStorage } from '../use-local-storage';
import { useSession, useTemporarySession, useSecureSession } from '../use-session';
import { 
    useCookies, 
    usePersistentCookies, 
    useSecureCookies, 
    useAuthCookies 
} from '../use-cookies';

export const StorageExamples: React.FC = () => {
    // LocalStorage examples
    const [userPrefs, setUserPrefs] = useLocalStorage('user_preferences', {
        defaultValue: { theme: 'dark', language: 'en' }
    });

    // Session storage examples
    const [sessionData, setSessionData] = useSession('current_session', {
        defaultValue: { userId: '', page: 'home' },
        clearOnUnload: true
    });

    const [tempData, setTempData] = useTemporarySession('temp_form', 60000); // 1 minute

    const [secureData, setSecureData] = useSecureSession('secure_token', 'my-secret-key', {
        defaultValue: null,
        validator: (value) => typeof value === 'string' && value.length > 10
    });

    // Cookie examples
    const [authCookie, setAuthCookie] = useAuthCookies('auth_token', {
        defaultValue: null,
        validator: (value) => value && typeof value === 'object' && 'token' in value
    });

    const [persistentCookie, setPersistentCookie] = usePersistentCookies('user_settings', 30, {
        defaultValue: { notifications: true }
    });

    const [secureCookie, setSecureCookie] = useSecureCookies('sensitive_data', 'encryption-key', {
        defaultValue: null
    });

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Storage Utilities Examples</h1>
            
            {/* LocalStorage Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>LocalStorage (useLocalStorage)</h2>
                <div>
                    <p>Current preferences: {JSON.stringify(userPrefs)}</p>
                    <button onClick={() => setUserPrefs({ ...userPrefs, theme: userPrefs.theme === 'dark' ? 'light' : 'dark' })}>
                        Toggle Theme
                    </button>
                    <button onClick={() => setUserPrefs({ theme: 'dark', language: 'es' })}>
                        Set to Spanish
                    </button>
                </div>
            </section>

            {/* Session Storage Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Session Storage (useSession)</h2>
                <div>
                    <p>Current session: {JSON.stringify(sessionData)}</p>
                    <button onClick={() => setSessionData({ ...sessionData, page: 'dashboard' })}>
                        Go to Dashboard
                    </button>
                    <button onClick={() => setSessionData(null)}>
                        Clear Session
                    </button>
                </div>
            </section>

            {/* Temporary Session Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Temporary Session (useTemporarySession)</h2>
                <div>
                    <p>Temp data (expires in 1 min): {JSON.stringify(tempData)}</p>
                    <button onClick={() => setTempData({ formData: 'test', timestamp: Date.now() })}>
                        Set Temp Data
                    </button>
                    <button onClick={() => setTempData(null)}>
                        Clear Temp Data
                    </button>
                </div>
            </section>

            {/* Secure Session Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Secure Session (useSecureSession)</h2>
                <div>
                    <p>Secure token: {secureData ? '***' + secureData.slice(-4) : 'None'}</p>
                    <button onClick={() => setSecureData('secure-token-' + Math.random().toString(36).substr(2, 20))}>
                        Set Secure Token
                    </button>
                    <button onClick={() => setSecureData(null)}>
                        Clear Secure Token
                    </button>
                </div>
            </section>

            {/* Auth Cookies Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Auth Cookies (useAuthCookies)</h2>
                <div>
                    <p>Auth token: {authCookie ? '***' + JSON.stringify(authCookie).slice(-4) : 'None'}</p>
                    <button onClick={() => setAuthCookie({ 
                        token: 'jwt-token-' + Math.random().toString(36).substr(2, 20),
                        expires: Date.now() + 86400000
                    })}>
                        Set Auth Token
                    </button>
                    <button onClick={() => setAuthCookie(null)}>
                        Clear Auth Token
                    </button>
                </div>
            </section>

            {/* Persistent Cookies Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Persistent Cookies (usePersistentCookies)</h2>
                <div>
                    <p>User settings: {JSON.stringify(persistentCookie)}</p>
                    <button onClick={() => setPersistentCookie({ 
                        ...persistentCookie, 
                        notifications: !persistentCookie?.notifications 
                    })}>
                        Toggle Notifications
                    </button>
                </div>
            </section>

            {/* Secure Cookies Section */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Secure Cookies (useSecureCookies)</h2>
                <div>
                    <p>Sensitive data: {secureCookie ? 'Encrypted' : 'None'}</p>
                    <button onClick={() => setSecureCookie({ 
                        secret: 'sensitive-data-' + Math.random().toString(36).substr(2, 10),
                        level: 'high'
                    })}>
                        Set Secure Data
                    </button>
                    <button onClick={() => setSecureCookie(null)}>
                        Clear Secure Data
                    </button>
                </div>
            </section>

            {/* Security Features Demo */}
            <section style={{ marginBottom: '30px' }}>
                <h2>Security Features</h2>
                <div>
                    <p>✅ Encryption for sensitive data</p>
                    <p>✅ Input validation and sanitization</p>
                    <p>✅ Auto-expiration for temporary data</p>
                    <p>✅ Secure cookie flags (Secure, SameSite=Strict)</p>
                    <p>✅ Automatic cleanup on page unload</p>
                    <p>✅ Cross-tab synchronization</p>
                    <p>✅ Debounced updates for performance</p>
                </div>
            </section>
        </div>
    );
};

export default StorageExamples;
