import "./styles.scss";
import {
  useEventSubscription,
} from "../../hooks/useEventManager";
import { StrategyDrawer } from "../StrategyList2/StrategyDrawer/index";
import { useState } from "react";
import { useOAuth } from "../../contexts/OAuthContext";
import {
  SessionSummaryData,
  SessionSummaryDataEvent,
  SessionSummaryDrawer,
} from "../SessionSummaryDrawer";


export function GlobalComponents() {

  const { logout } = useOAuth();

  const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] =
    useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [selectedBot, setSelectedBot] = useState<any>(null);

  const [sessionSummaryVisible, setSessionSummaryVisible] = useState(false);
  const [sessionSummaryData, setsessionSummaryData] = useState<SessionSummaryData | null>(null);

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
    console.log("SHOW_BOT_SUMMARY", [data]);
    const payload: SessionSummaryData = data.summary;
    setsessionSummaryData(payload);
    setSessionSummaryVisible(true);
  });

  useEventSubscription("BOT_HEARTBEAT", (data: SessionSummaryDataEvent) => {
    console.log("BOT_HEARTBEAT", [data]);
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
    </>
  );
}
