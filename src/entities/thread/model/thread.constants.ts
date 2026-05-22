export type Section = {
  id: string
  name: string
  shortLabel: string
  desc: string
  fillClass?: string
  textClass?: string
}

export const mainSections: Section[] = [
  { id: 'fa', shortLabel: 'FUNDAMENTALS', name: 'Fundamental Analysis', desc: 'Macroeconomics, Earnings, Financials, Policies & Geopolitics', fillClass: 'fill-black/5 dark:fill-white/5 hover:fill-black/10 dark:hover:fill-white/10', textClass: 'text-[#050505] dark:text-[#eee]' },
  { id: 'cd', shortLabel: 'DISCUSSIONS', name: 'Common Questions & Discussions', desc: 'General topics, Q&A, Trading psychology, Day-to-day chat', fillClass: 'fill-black/5 dark:fill-white/5 hover:fill-black/10 dark:hover:fill-white/10', textClass: 'text-[#050505] dark:text-[#eee]' },
  { id: 'ta', shortLabel: 'TECHNICALS', name: 'Technical Analysis', desc: 'Price Action, Indicators, Smart Money Concepts, Waves & Structures', fillClass: 'fill-black/5 dark:fill-white/5 hover:fill-black/10 dark:hover:fill-white/10', textClass: 'text-[#050505] dark:text-[#eee]' }
]

export const categories: Record<string, { id: string, name: string, desc: string }[]> = {
  fa: [
    { id: 'macroeconomics', name: 'Macroeconomics', desc: 'Interest rates, inflation, labor markets, overall economy' },
    { id: 'earnings', name: 'Earnings Reports', desc: 'Company financials, guidance, call analysis' },
    { id: 'geopolitics', name: 'Geopolitics', desc: 'Wars, trade tariffs, international relations' }
  ],
  cd: [
    { id: 'qa', name: 'Q&A', desc: 'Ask specific questions, get targeted answers from experienced traders' },
    { id: 'general', name: 'General Discussions', desc: 'Broad topic chats, market thoughts, psychology' },
    { id: 'news', name: 'News & Events', desc: 'Reactions to breaking news and live events' }
  ],
  ta: [
    { id: 'price-action', name: 'Price Action', desc: 'Candlesticks, support/resistance, market structures' },
    { id: 'smart-money-concept', name: 'Smart Money Concept', desc: 'Liquidity, order blocks, imbalances (SMC)' },
    { id: 'elliots-waves', name: 'Elliot’s Waves', desc: 'Wave theory, impulsive & corrective structures' },
    { id: 'indicators', name: 'Indicators & Algos', desc: 'RSI, moving averages, custom algorithms, volume profiles' },
    { id: 'volume-analysis', name: 'Volume Profile', desc: 'Market profile, point of control, value areas' },
    { id: 'order-flow', name: 'Order Flow', desc: 'Level 2, tape reading, footprints, DOM analysis' },
    { id: 'backtesting', name: 'Backtesting Models', desc: 'Monte Carlo simulations, walk-forward analysis' },
    { id: 'algos-automated', name: 'Automated Algos', desc: 'Python bots, MQL5, automated execution logic' },
    { id: 'harmonics', name: 'Harmonic Patterns', desc: 'Gartley, Butterfly, Bat, Crab patterns' },
    { id: 'seasonal-tendencies', name: 'Seasonal Tendencies', desc: 'Monthly bias, intra-week cycles, market seasonality' },
    { id: 'confluence-metrics', name: 'Confluence Metrics', desc: 'Multi-timeframe alignment, scoring systems' },
    { id: 'risk-models', name: 'Risk Management', desc: 'Position sizing, Kelly criterion, drawdown protection' },
    { id: 'volatility-regimes', name: 'Volatility Regimes', desc: 'VIX correlation, ATR cycles, regime shifting' },
    { id: 'intermarket-ta', name: 'Intermarket Analysis', desc: 'Correlations between DXY, Gold, and Indexes' }
  ]
}
