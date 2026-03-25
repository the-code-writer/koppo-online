import "./styles.scss";
import {
  useEventSubscription,
} from "../../hooks/useEventManager";
import { StrategyDrawer } from "../StrategyList2/StrategyDrawer/index";
import { useState } from "react";
import { useOAuth } from "../../contexts/OAuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import {
  SessionSummaryData,
  SessionSummaryDataEvent,
  SessionSummaryDrawer,
} from "../SessionSummaryDrawer";
import { TransactionSummaryDrawer } from "../Composite/TransactionSummaryDrawer";
import { BotRealtimePerformanceData } from "../../services/tradingBotAPIService";
import { DollarCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { formatCurrency } from "../../utils/snippets";


export function GlobalComponents() {

  const { logout } = useOAuth();
  const { openNotification } = useNotification();

  const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] =
    useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [selectedBot, setSelectedBot] = useState<any>(null);

  const [sessionSummaryVisible, setSessionSummaryVisible] = useState(false);
  const [sessionSummaryData, setsessionSummaryData] = useState<SessionSummaryData | null>(null);

  const [transactionDrawerVisible, setTransactionDrawerVisible] = useState(false);
  const [transactionSummaryData, setTransactionSummaryData] = useState<any | null>(null);

  useEventSubscription("CREATE_BOT", (data: any) => {
    console.log("CREATE BOT ACTION RECEIVED", data);
    setSelectedStrategy(data.strategy);
    setSelectedBot(null); // Clear any selected bot for create mode
    setIsStrategyDrawerOpen(true);
  });

  useEventSubscription("EDIT_BOT", (data: any) => {
    console.log("EDIT BOT ACTION RECEIVED", data);
    setSelectedStrategy({strategyId: data.bot.strategyId});
    setSelectedBot(data.bot); // Set the bot for edit mode
    setIsStrategyDrawerOpen(true);
  });

  useEventSubscription("LOGOUT", () => {
    logout();
  });

  useEventSubscription("SHOW_BOT_SUMMARY", (data: SessionSummaryDataEvent) => {
    const payload: SessionSummaryData = data.summary;
    setsessionSummaryData(payload);
    setSessionSummaryVisible(true);
  });

  useEventSubscription("UPDATE_BOT_REALTIME_STATS", (data: BotRealtimePerformanceData) => {
    console.log("UPDATE_BOT_REALTIME_STATS>>>>>>>", data);
    const notification:any = data.notification;
    openNotification(`${notification.botName} ${notification.status} ${formatCurrency(notification.profit)}`, `${notification.longCode}`, {
      icon: <DollarCircleOutlined style={{ color: notification.status === 'won'?'#00af06':'#fa1f14' }} />,
      duration: 12
    });
  });

  useEventSubscription("SHOW_TRADE_CONTRACT_DETAILS", (data: any) => {
    console.log("SHOW_TRADE_CONTRACT_DETAILS", data.transaction);
    setTransactionSummaryData(data.transaction);
    setTransactionDrawerVisible(true);
  });

  return (
    <>
      <StrategyDrawer
        isOpen={isStrategyDrawerOpen}
        strategy={selectedStrategy}
        editBot={selectedBot}
        onClose={() => {
          setIsStrategyDrawerOpen(false);
          setSelectedStrategy(null);
          setSelectedBot(null);
        }}
      />

      <SessionSummaryDrawer
        visible={sessionSummaryVisible}
        onClose={() => setSessionSummaryVisible(false)}
        data={sessionSummaryData}
      />

      <TransactionSummaryDrawer 
        onClose={() => setTransactionDrawerVisible(false)}
        drawerVisible={transactionDrawerVisible} 
        transactionSummaryData={transactionSummaryData} 
        />
    </>
  );
}
