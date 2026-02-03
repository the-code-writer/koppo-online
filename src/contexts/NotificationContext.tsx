/**
 * @file: NotificationContext.tsx
 * @description: React context provider for notification system with custom bullet/emoji support.
 *               Provides enhanced notification functionality with flexible styling options.
 *
 * @components:
 *   - NotificationContext: React context for notification state
 *   - NotificationProvider: Provider component that manages notification API
 *   - useNotification: Custom hook for consuming notification context
 * @dependencies:
 *   - React: createContext, useContext, useState, ReactNode
 *   - antd: notification, Button, Space, Flex
 * @usage:
 *   // Use notification in components
 *   const { openNotification } = useNotification();
 *   openNotification('Title', 'Message', { type: 'error' });
 *
 * @architecture: Context Provider pattern with Ant Design notification integration
 * @relationships:
 *   - Used by: Any component needing notification functionality
 *   - Depends on: Ant Design notification API
 */
import {
    createContext,
    useContext,
    ReactNode
} from 'react';
import { notification, message, Button, Space, Flex, ConfigProvider } from 'antd';

// Types for notification options
export interface NotificationButton {
    label: string;
    callback: () => void;
}

export interface NotificationOptions {
    button?: NotificationButton | null;
    icon?: ReactNode | null;
    type?: 'error' | 'warn' | 'info' | 'success' | 
           'emoji-error' | 'emoji-info' | 'emoji-warn' | 'emoji-success' |
           'bullet-error' | 'bullet-info' | 'bullet-warn' | 'bullet-success' |
           'message-error' | 'message-info' | 'message-warn' | 'message-success' |
           null;
    duration?: number;
    placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
    showProgressBar?: boolean;
    progressColor?: string;
}

// Notification Context value interface
interface NotificationContextValue {
    openNotification: (title: string, description: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [api, contextHolder] = notification.useNotification();

    const openNotification = (title: string, description: string, options: NotificationOptions = {}) => {
        // Handle message types - use message API instead of notification
        if (options.type && options.type.startsWith('message-')) {
            const messageType = options.type.replace('message-', '') as 'error' | 'info' | 'warn' | 'success';
            
            // Use message API for message-* types
            message[messageType]({
                content: description,
                duration: options.duration || 3,
                key: `msg${Date.now()}`,
            });
            return;
        }

        const key = `open${Date.now()}`;
        
        // Create action buttons if provided
        const btn = options.button ? (
            <Space>
                <Button type="link" size="small" onClick={() => api.destroy(key)}>
                    Close
                </Button>
                <Button type="primary" size="small" onClick={options.button.callback}>
                    {options.button.label}
                </Button>
            </Space>
        ) : null;

        // Get bullet/emoji type
        const getBulletType = () => {
            switch (options.type) {
                case "emoji-error":
                    return <>⛔</>;
                case "emoji-info":
                    return <>ℹ️</>;
                case "emoji-warn":
                    return <>⚠️</>;
                case "emoji-success":
                    return <>✅</>;
                case "bullet-error":
                    return <>🔴</>;
                case "bullet-warn":
                    return <>🟡</>;
                case "bullet-success":
                    return <>🟢</>;
                case "bullet-info":
                    return <>🔵</>;
                default:
                    return null;
            }
        };

        // Get icon based on type
        const getIcon = () => {
            if (options.icon) {
                return <>{options.icon}</>;
            } else if (options.type === 'error' || options.type === 'warn' || options.type === 'info' || options.type === 'success') {
                // Return undefined to use Ant Design's default icons for these types
                return undefined;
            } else if (options.type && (options.type.startsWith('bullet-') || options.type.startsWith('emoji-'))) {
                // For bullet/emoji types, we handle the icon in the title, so return null
                return null;
            } else {
                // For null or other types, return null for iconless notification
                return null;
            }
        };

        // Get title with bullet if applicable
        const getTitle = () => {
            const bullet = getBulletType();
            if (bullet) {
                return <Flex align="center"><span>{bullet}</span>&nbsp;&nbsp;<strong>{title}</strong></Flex>;
            }
            return title;
        };

        // Prepare notification config
        const notificationConfig: any = {
            title: getTitle(),
            description: description,
            icon: getIcon(),
            duration: options.duration || 0,
            placement: options.placement || 'top',
            type: (options.type === 'error' || options.type === 'warn' || options.type === 'info' || options.type === 'success') ? options.type : undefined,
            btn,
            key,
            onClose: () => api.destroy(key),
        };

        // Add progress bar if enabled
        if (options.showProgressBar) {
            notificationConfig.showProgress = true;
            // Use default duration if not specified when showing progress bar
            if (notificationConfig.duration === 0) {
                notificationConfig.duration = 10; // Default 10 seconds for progress bar
            }
        }

        // Open the notification
        api.open(notificationConfig);
    };

    const contextValue: NotificationContextValue = {
        openNotification,
    };

    // Default progress bar color theme
    const defaultProgressColor = 'linear-gradient(135deg,#6253e1, #04befe)';

    return (
        <ConfigProvider
            theme={{
                components: {
                    Notification: {
                        progressBg: defaultProgressColor,
                    },
                },
            }}
        >
            <NotificationContext.Provider value={contextValue}>
                {contextHolder}
                {children}
            </NotificationContext.Provider>
        </ConfigProvider>
    );
}

export function useNotification(): NotificationContextValue {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
