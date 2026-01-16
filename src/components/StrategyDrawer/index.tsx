import { StrategyForm } from '../StrategyForm';
import { FormConfig } from '../../types/form';
import './styles.scss';
import { SlideDrawer } from '../SlideDrawer';

import { StrategyDrawerProps, SYMBOL_FIELD, STRATEGY_PARAMS } from '../../types/strategy';

interface ExtendedStrategyDrawerProps extends StrategyDrawerProps {
  editBot?: any; // Changed from Bot to any since bot functionality is removed
}

export function StrategyDrawer({ strategy, onClose, editBot }: ExtendedStrategyDrawerProps) {
  if (!strategy) return null;

  const strategyParams = STRATEGY_PARAMS[strategy.id];
  if (!strategyParams) {
    console.error(`Strategy params not found for ID: ${strategy.id}`);
    return null;
  }

  // Handle both tabbed and field-based configurations
  const config: FormConfig = strategyParams.tabs 
    ? { tabs: strategyParams.tabs }
    : { fields: strategyParams.fields ? [SYMBOL_FIELD, ...strategyParams.fields] : [SYMBOL_FIELD] };

  const drawerTitle = editBot ? `Edit ${editBot.name}` : strategy.title;

  return (
    <SlideDrawer
      isOpen={true}
      onClose={onClose}
      title={drawerTitle}
      width={480}
      placement="right"
      zIndex={1200}
      className="strategy-drawer"
    >
      <StrategyForm
        config={config}
        strategyType={strategy.title}
        strategyId={strategy.id}
        tradeType="Accumulators"
        onBack={onClose}
        editBot={editBot}
      />
    </SlideDrawer>
  );
}
