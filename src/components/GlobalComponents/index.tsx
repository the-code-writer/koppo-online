import './styles.scss';
import { useEventPublisher, useEventSubscription } from '../../hooks/useEventManager';
import { StrategyDrawer } from '../StrategyDrawer/index';
import { useEffect, useState } from 'react';
import { envConfig } from '../../config/env.config';
import Pusher from 'pusher-js';
import { notification } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { useOAuth } from '../../contexts/OAuthContext';

const pusher = new Pusher(envConfig.VITE_PUSHER_KEY, {
  cluster: envConfig.VITE_PUSHER_CLUSTER,
});

const channel = pusher.subscribe('client-koppo-channel');

export function GlobalComponents() {

  const [api, contextHolder] = notification.useNotification();

  const { publish } = useEventPublisher();

  const { logout } = useOAuth();

  const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  useEventSubscription('CREATE_BOT', (data: any) => {
    console.log("CREATE BOT AXN RECEIVED", data)
    setSelectedStrategy(data.strategy);
    setIsStrategyDrawerOpen(true);
  });

  useEventSubscription('LOGOUT', () => {
    logout();
  });

  const openNotification = (title: string, description: string) => {
    api.open({
      title: title || 'Koppo Notification',
      description: description || 'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
      icon: <SmileOutlined style={{ color: '#108ee9' }} />,
    });
  }

  useEffect(()=>{

  channel.bind('client-koppo-event', function (data: any) {
    console.log("CLIENT-KOPPO-EVENT RECEIVED", data);
    publish('client-koppo-event', data);
    openNotification(data.title, data.description);
  });

  },[])

  return (
    <>
      {contextHolder}
      <StrategyDrawer
        isOpen={isStrategyDrawerOpen}
        strategy={selectedStrategy}
        onClose={() => setIsStrategyDrawerOpen(false)}
      />

    </>
  );
}
