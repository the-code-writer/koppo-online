import './styles.scss';
import { LiveActivityFeed } from './LiveActivityFeed';
import { WeeklyPerformance } from './WeeklyPerformance';
import { MarketSentiment } from './MarketSentiment';
import { LeaderboardTraders } from './LeaderboardTraders';
import { LeaderboardBots } from './LeaderboardBots';
import { QuickStats } from './QuickStats';
import { HomeHeader } from './HomeHeader';
import { PortfolioCard } from './PortfolioCard';

export function HomeScreen2() {

  return (
    <div className="home-screen-2">
      <HomeHeader />
      <PortfolioCard />
      <QuickStats />
      <LeaderboardBots />
      <LeaderboardTraders />
      <LiveActivityFeed />
      <MarketSentiment />
      <WeeklyPerformance />
    </div>
  );
}
