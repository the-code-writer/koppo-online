import { StrategyForm } from '../StrategyForm';
import { FormConfig } from '../../types/form';
import './styles.scss';
import { SlideDrawer } from '../SlideDrawer';

import { StrategyDrawerProps, SYMBOL_FIELD, STRATEGY_PARAMS } from '../../types/strategy';

interface ExtendedStrategyDrawerProps extends StrategyDrawerProps {
  strategy: any;
  isOpen: boolean;
  onClose: any;
  editBot?: any; // Changed from Bot to any since bot functionality is removed
}

export function StrategyDrawer({ strategy, isOpen, onClose, editBot }: ExtendedStrategyDrawerProps) {
  if (!strategy) return null;

  const strategyParams = STRATEGY_PARAMS[strategy._id];
  if (!strategyParams) {
    console.error(`Strategy params not found for ID: ${strategy.id}`);
    return null;
  }

  console.warn({strategy, strategyParams});

  // Handle both tabbed and field-based configurations
  const config: FormConfig = strategyParams.tabs 
    ? { tabs: strategyParams.tabs }
    : { fields: strategyParams.fields ? [SYMBOL_FIELD, ...strategyParams.fields] : [SYMBOL_FIELD] };

  const drawerTitle = editBot ? `Edit ${editBot.name}` : strategy.configuration.general.botName;

  return (
    <SlideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={drawerTitle}
      width={480}
      placement="right"
      zIndex={1200}
      className="strategy-drawer"
    >
      <StrategyForm
        config={config}
        strategyType={strategy.configuration.general.botName}
        strategyId={strategy._id}
        tradeType={strategy.configuration.general.tradeType}
        onBack={onClose}
        editBot={editBot}
      />
    </SlideDrawer>
  );
}
