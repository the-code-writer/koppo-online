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

  const strategyId = strategy._id;
  const strategyParams = STRATEGY_PARAMS[strategyId];
  if (!strategyParams) {
    console.error(`Strategy params not found for ID: ${strategyId}`);
    return null;
  }

  console.warn({strategy, strategyParams});

  // Handle both tabbed and field-based configurations
  const config: FormConfig = strategyParams.tabs 
    ? { tabs: strategyParams.tabs }
    : { fields: strategyParams.fields ? [SYMBOL_FIELD, ...strategyParams.fields] : [SYMBOL_FIELD] };

  const drawerTitle = editBot ? `Edit ${editBot.name}` : (strategy.botName || 'Unknown Strategy');

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
        strategyType={strategy.botName || 'Unknown Strategy'}
        strategyId={strategyId}
        tradeType={strategy.tradeType || 'Unknown Type'}
        onBack={onClose}
        editBot={editBot}
      />
    </SlideDrawer>
  );
}
