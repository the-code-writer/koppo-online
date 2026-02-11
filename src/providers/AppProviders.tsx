/**
 * @file: AppProviders.tsx
 * @description: Centralized provider composition that establishes the context hierarchy
 *               for the entire application, managing theme, auth, data, and UI state.
 *
 * @components:
 *   - AppProviders: Main provider composition component
 *   - ThemeConfigProvider: Ant Design theme configuration wrapper
 * @dependencies:
 *   - React: ReactNode type
 *   - antd: ConfigProvider and theme utilities
 *   - Multiple context providers: Auth, Theme, SSE, Navigation, etc.
 * @usage:
 *   // In main.tsx
 *   <AppProviders>
 *     <RouterProvider router={router} />
 *   </AppProviders>
 *
 * @architecture: Nested provider pattern with specific provider order
 * @relationships:
 *   - Used by: main.tsx as a wrapper for the entire application
 *   - Composes: Multiple context providers in a specific hierarchy
 * @dataFlow: Establishes context hierarchy where inner providers can access
 *            data from outer providers (e.g., TradeProvider can access AuthProvider)
 *
 * @ai-hints: The order of providers is important - providers that depend on other
 *            contexts must be nested inside those providers. For example, providers
 *            that need position data should be nested inside PositionsProvider.
 */
import { ReactNode } from "react";
import { ConfigProvider, theme } from "antd";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { NavigationProvider } from "../contexts/NavigationContext";
import { FirebaseGlobalProvider } from "../contexts/FirebaseGlobalContext";
import { LocalStorageProvider } from "../utils/use-local-storage";
import { CookieProvider } from "../contexts/CookieContext";
import { OAuthProvider } from "../contexts/OAuthContext";
import { AppStorageProvider } from "../contexts/AppStorageContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { DiscoveryProvider } from "../contexts/DiscoveryContext";

interface AppProvidersProps {
  children: ReactNode;
}

function ThemeConfigProvider({ children }: { children: ReactNode }) {
  const { theme: currentTheme } = useTheme();

  const antdTheme = {
    algorithm:
      currentTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#3b82f6",
      borderRadius: 4,
    },
  };

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocalStorageProvider>
      <CookieProvider>
        <AppStorageProvider>
          <NotificationProvider>
            <OAuthProvider>
              <DiscoveryProvider>
                <ThemeProvider>
                  <ThemeConfigProvider>
                    <NavigationProvider>
                      <FirebaseGlobalProvider>
                        {children}
                      </FirebaseGlobalProvider>
                    </NavigationProvider>
                  </ThemeConfigProvider>
                </ThemeProvider>
              </DiscoveryProvider>
            </OAuthProvider>
          </NotificationProvider>
        </AppStorageProvider>
      </CookieProvider>
    </LocalStorageProvider>
  );
}
