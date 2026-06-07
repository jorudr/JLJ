export type GenesisEmotionType = 'positive' | 'neutral' | 'negative'

export interface GenesisEmotionItem {
  label: string
  type: GenesisEmotionType
  description: string
}

export const GENESIS_EMOTION_LIBRARY: GenesisEmotionItem[] = [
  { label: 'FOMO', type: 'negative', description: 'Entering a trade late due to fear of missing a move, ignoring technical criteria.' },
  { label: 'Revenge', type: 'negative', description: 'Over-leveraging or over-trading to recover losses from a previous failed session.' },
  { label: 'Greed', type: 'negative', description: 'Holding positions past technical targets or over-leveraging for excessive profit.' },
  { label: 'Fear', type: 'negative', description: 'Hesitation to execute valid entries or exiting winning trades early due to loss aversion.' },
  { label: 'Tilt', type: 'negative', description: 'Total loss of emotional control leading to repeated violations of the core trading plan.' },
  { label: 'Anxiety', type: 'negative', description: 'Hyper-fixation on short-term price fluctuations causing cognitive stress.' },
  { label: 'Calmness', type: 'positive', description: 'Maintaining a stable physiological state regardless of market volatility.' },
  { label: 'Discipline', type: 'positive', description: 'Strict adherence to execution protocols and predefined risk management rules.' },
  { label: 'Focus', type: 'positive', description: 'High situational awareness and concentration on technical data streams.' },
  { label: 'Patience', type: 'positive', description: 'Waiting for high-probability setups without forcing low-quality entries.' },
  { label: 'Confidence', type: 'positive', description: 'Trust in the statistical edge of the strategy during execution.' },
  { label: 'Hope', type: 'neutral', description: 'Relying on luck or irrational bias to save a losing position instead of following stops.' },
  { label: 'Boredom', type: 'neutral', description: 'Lack of stimulus leading to low-quality trades to feel "active" in the market.' },
  { label: 'Fatigue', type: 'neutral', description: 'Reduced cognitive performance due to long session duration or biological exhaustion.' }
]
