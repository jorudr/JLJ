export interface LogEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  attachedTradeIds?: string[];
}

export const mockLogEntries: LogEntry[] = [
  {
    id: 'log1',
    title: 'Market Analysis - London Open',
    content: 'Observing heavy liquidity sweep at 1.0850. Potential long entry on retracement.',
    date: new Date('2026-04-01T08:00:00'),
    attachedTradeIds: ['t1', 't4']
  },
  {
    id: 'log2',
    title: 'Risk Management Update',
    content: 'Reduced position sizing on XAUUSD due to high volatility during NFP.',
    date: new Date('2026-04-05T14:30:00'),
    attachedTradeIds: ['t7', 't10']
  },
  {
    id: 'log3',
    title: 'Strategy Refinement',
    content: 'Adjusting SMC sweep criteria to include H1 candle closures for better confirmation.',
    date: new Date('2026-04-10T10:00:00'),
    attachedTradeIds: ['t1', 't2', 't5']
  }
];
