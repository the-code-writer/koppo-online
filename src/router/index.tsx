/**
 * @file: router/index.tsx
 * @description: Application routing configuration using React Router,
 *               defining routes, navigation mappings, and route structure.
 *
 * @components:
 *   - routes: Array of route objects defining the application's routing structure
 *   - router: Configured browser router instance
 *   - pathToTab/tabToPath: Mapping objects for navigation state synchronization
 * @dependencies:
 *   - react-router-dom: For routing functionality
 *   - App: Main application component
 *   - pages: Page components for different routes
 * @usage:
 *   // In main.tsx
 *   import { RouterProvider } from 'react-router-dom';
 *   import { router } from './router';
 *
 *   ReactDOM.createRoot(document.getElementById('root')!).render(
 *     <RouterProvider router={router} />
 *   );
 *
 * @architecture: Centralized routing configuration with nested routes
 * @relationships:
 *   - Used by: main.tsx for router initialization
 *   - References: App component and page components
 *   - Referenced by: Navigation components for path mapping
 * @dataFlow: Defines how URL paths map to rendered components
 *
 * @ai-hints: The router uses a nested structure with App as the parent layout
 *            and child routes rendered through the Outlet component. The mapping
 *            objects (pathToTab/tabToPath) synchronize URL paths with UI state.
 */
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import { HomePage,DiscoverPage, BotsPage, PositionsPage, SettingsPage, LoginPage, EmailVerificationPage, ForgotPasswordPage, RegistrationPage, DeviceRegistrationPage, NotFoundPage } from '../pages';
import DerivCallbackPage from '../pages/DerivCallbackPage';

// Define routes
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'discover',
        element: <DiscoverPage />,
      },
      {
        path: 'bots',
        element: <BotsPage />,
      },
      {
        path: 'positions',
        element: <PositionsPage />,
      },
      {
        path: 'menu',
        element: <SettingsPage />,
      },
    ],
  },
  // New route for login page
  {
    path: '/login',
    element: <LoginPage />,
  },
  // New route for email verification
  {
    path: '/verify-email',
    element: <EmailVerificationPage />,
  },
  // New route for Deriv callback
  {
    path: '/callback',
    element: <DerivCallbackPage />,
  },
  // New route for forgot password
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  // New route for registration
  {
    path: '/register',
    element: <RegistrationPage />,
  },
  // New route for device-registration
  {
    path: '/device-registration',
    element: <DeviceRegistrationPage />,
  },
  // 404 catch-all route
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Create router
export const router = createBrowserRouter(routes);

// Map path to tab name
export const pathToTab: Record<string, string> = {
  '/': 'home',
  '/home': 'home',
  '/discover': 'discover',
  '/bots': 'bots',
  '/positions': 'positions',
  '/menu': 'menu',
  '/login': 'login',
  '/forgot-password': 'forgot-password',
  '/register': 'register',
};

// Map tab name to path
export const tabToPath: Record<string, string> = {
  'home': '/home',
  'discover': '/discover',
  'bots': '/bots',
  'positions': '/positions',
  'menu': '/menu',
  'login': '/login',
  'forgot-password': '/forgot-password',
  'register': '/register',
};
