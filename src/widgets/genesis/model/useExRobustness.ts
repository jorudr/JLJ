import { computed, type Ref } from 'vue'
import { useThemeStore } from '~/features/store/useTheme'

export function useExRobustness(
  diagnosticStats: Ref<any>,
  strategyMetrics: Ref<any>,
  getFilteredTrades: () => any[]
) {
  const themeStore = useThemeStore()
  const colors = computed(() => ({
    text: themeStore.settings.isDark ? '#ffffff' : '#000000',
    border: themeStore.settings.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    accent: themeStore.settings.isDark ? '#ffffff' : '#000000'
  }))

  const getRobustnessExplanation = (stats: any) => {
    const skew = stats.skewness || 0
    const kurt = stats.kurtosis || 0
    const isFatTailed = stats.preferredModel === "Student's t" || kurt > 1.5
    const distribution = isFatTailed ? 'Many unusually large trades' : 'Normal-like'
    const sampleSize = stats.pnls?.length || 0
    const unmanagedRatio = sampleSize > 0 ? (stats.unmanagedRiskCount || 0) / sampleSize : 0
    const hasNoRiskModel = unmanagedRatio >= 0.5 || (stats.stopLossCoveragePct || 0) < 50
    const hasTailOutliers = (stats.tailOutlierCount || 0) > 0 || (stats.largestTailSigma || 0) >= 3

    if (hasNoRiskModel && (isFatTailed || hasTailOutliers)) {
      return {
        distribution,
        verdict: 'Large trades without enough risk control',
        diagnosis: 'Several trades are much larger than the typical trade, and many trades do not have stop-loss or take-profit data. This means the average result can look good only because of a few unusual trades, while the downside is not clearly limited.',
        action: 'Add stop-loss data first. Keep position size small. Check whether the strategy is still profitable if the single best trade is ignored before increasing size.',
        tone: '#fb7185'
      }
    }

    if (skew < -0.5) {
      return {
        distribution,
        verdict: 'Losses are larger than wins',
        diagnosis: 'The losing side is heavier than the winning side. The strategy may be taking many small wins, but one bad loss can erase a lot of progress.',
        action: 'Review the biggest losing trades. Tighten stops or exits. Use smaller position size until the worst realistic loss is acceptable.',
        tone: '#fb7185'
      }
    }

    if (isFatTailed && skew > 0.5) {
      return {
        distribution,
        verdict: 'Result depends on a few big winners',
        diagnosis: 'The biggest winning trades help the strategy a lot, but results are not yet smooth. The strategy may look strong because of rare large wins, not because most trades are consistently good.',
        action: 'Check the result again after ignoring the single best winning trade. Keep risk per trade fixed. Wait for more trades before increasing size.',
        tone: stats.mean < 0 ? '#fb7185' : '#fbbf24'
      }
    }

    if (skew > 0.5) {
      return {
        distribution,
        verdict: 'Big winners are helping the strategy',
        diagnosis: 'Large winning trades are doing most of the work. This can be normal for trend-following or breakout systems, where several small losses are paid for by a few strong wins.',
        action: 'Keep risk per trade steady. Let winning trades reach their plan. Judge the strategy on many trades, not on one strong winner.',
        tone: stats.mean < 0 ? '#fb7185' : '#34d399'
      }
    }

    if (isFatTailed) {
      return {
        distribution,
        verdict: 'Unusually large trades are present',
        diagnosis: 'The trade results include more unusually large wins or losses than a calm strategy would normally have. These trades should be treated as part of the strategy, not ignored as random noise.',
        action: 'Keep extra cash aside. Avoid leverage. Test what happens during the worst losing streak and size trades for that case.',
        tone: '#fbbf24'
      }
    }

    return {
      distribution,
      verdict: 'Stable trade result pattern',
      diagnosis: 'The trade results look relatively balanced. There are fewer unusually large wins or losses, so the strategy is easier to judge from the average trade.',
      action: 'Keep the current rules. Do not over-tune the strategy. Recheck after more trades.',
      tone: colors.value.accent
    }
  }

  const robustnessExplanation = computed(() => getRobustnessExplanation(diagnosticStats.value))

  const robustnessExplanationVariables = computed(() => {
    const stats = diagnosticStats.value
    return [
      { name: 'Preferred Distribution', val: stats.preferredModel || 'Normal' },
      { name: 'Mean Trade Result', val: `$${stats.mean.toFixed(2)}` },
      { name: 'Standard Deviation', val: `$${stats.std.toFixed(2)}` },
      { name: 'Win/Loss Imbalance', val: `${stats.skewness >= 0 ? '+' : ''}${stats.skewness.toFixed(2)}` },
      { name: 'Large Trade Frequency', val: `${stats.kurtosis >= 0 ? '+' : ''}${stats.kurtosis.toFixed(2)}` },
      { name: 'PnL Range', val: `$${stats.minPnl.toFixed(0)} / $${stats.maxPnl.toFixed(0)}` },
      { name: 'Unusually Large Trades', val: `${stats.tailOutlierCount}` },
      { name: 'Largest Trade Distance', val: `${stats.largestTailSigma.toFixed(2)}σ` },
      { name: 'Stop-Loss Coverage', val: `${stats.stopLossCoveragePct.toFixed(0)}%` },
      { name: 'Take-Profit Coverage', val: `${stats.takeProfitCoveragePct.toFixed(0)}%` },
      { name: 'Unmanaged Trades', val: `${stats.unmanagedRiskCount}` },
      { name: 'Sample Size', val: `${stats.pnls.length} trades` }
    ]
  })

  const robustnessDistributionFits = computed(() => {
    const stats = diagnosticStats.value
    const normalWins = stats.preferredModel !== "Student's t"
    return [
      {
        name: 'Normal',
        isBest: normalWins,
        aic: stats.normalParams.aic.toFixed(2),
        bic: stats.normalParams.bic.toFixed(2),
        params: [
          { name: 'Mean', val: `$${stats.normalParams.mean.toFixed(2)}` },
          { name: 'Sigma', val: `$${stats.normalParams.std.toFixed(2)}` },
          { name: 'Log Likelihood', val: stats.normalParams.logL.toFixed(2) }
        ]
      },
      {
        name: 'Large-trade model',
        isBest: !normalWins,
        aic: stats.tParams.aic.toFixed(2),
        bic: stats.tParams.bic.toFixed(2),
        params: [
          { name: 'Mean', val: `$${stats.tParams.mean.toFixed(2)}` },
          { name: 'Typical Swing Size', val: `$${stats.tParams.scale.toFixed(2)}` },
          { name: 'Large Trade Sensitivity', val: stats.tParams.nu.toFixed(2) },
          { name: 'Log Likelihood', val: stats.tParams.logL.toFixed(2) }
        ]
      }
    ]
  })

  const robustnessDistributionComparison = computed(() => {
    const stats = diagnosticStats.value
    const deltaBic = stats.normalParams.bic - stats.tParams.bic
    if (stats.pnls.length < 5) {
      return 'There are still too few trades for a confident model choice. Treat this as an early warning, not a final conclusion.'
    }
    if (deltaBic > 2) {
      return `The data fits a model with more unusually large trades better than a calm normal model by ${deltaBic.toFixed(2)} BIC points. Manage this strategy with extra reserve cash and do not rely only on the average trade.`
    }
    if (deltaBic < -2) {
      return `The calm normal model fits better by ${Math.abs(deltaBic).toFixed(2)} BIC points. Results look more stable for now, but still check loss size and sample size before increasing risk.`
    }
    return 'The model scores are close. The result is not clear yet, so keep both views visible and continue checking for unusually large trades.'
  })

  const robustnessNormalityTests = computed(() => {
    const stats = diagnosticStats.value
    const n = stats.pnls.length
    const jarqueBera = n > 0 ? (n / 6) * (Math.pow(stats.skewness, 2) + Math.pow(stats.kurtosis, 2) / 4) : 0
    const jbPass = jarqueBera < 5.99
    const skewPass = Math.abs(stats.skewness) < 0.5
    const kurtPass = Math.abs(stats.kurtosis) < 1.5
    const qqPass = stats.qqPoints && stats.qqPoints.length > 0 && Math.abs(stats.skewness) < 0.75 && stats.kurtosis < 2
    const outlierPass = (stats.tailOutlierCount || 0) === 0 && (stats.largestTailSigma || 0) < 3
    const riskPass = (stats.stopLossCoveragePct || 0) >= 90

    return [
      {
        name: 'Balanced Result Shape Check',
        result: `${jarqueBera.toFixed(2)} ${jbPass ? 'PASS' : 'REJECT'}`,
        note: 'Checks whether the trade results look balanced enough to use a simple normal curve as a reference.',
        pass: jbPass
      },
      {
        name: 'Win/Loss Balance Check',
        result: `${stats.skewness >= 0 ? '+' : ''}${stats.skewness.toFixed(2)} ${skewPass ? 'PASS' : 'WATCH'}`,
        note: 'Warns when losses are much larger than wins or wins are doing most of the work.',
        pass: skewPass
      },
      {
        name: 'Large Trade Frequency Check',
        result: `${stats.kurtosis >= 0 ? '+' : ''}${stats.kurtosis.toFixed(2)} ${kurtPass ? 'PASS' : 'LARGE_TRADES'}`,
        note: 'Shows whether unusually large wins or losses appear more often than expected.',
        pass: kurtPass
      },
      {
        name: 'QQ-Plot Alignment Check',
        result: qqPass ? 'ALIGNED' : 'TAIL_DEVIATION',
        note: 'Checks whether real trades follow the expected curve or bend away at the largest wins and losses.',
        pass: qqPass
      },
      {
        name: 'Unusually Large Trade Check',
        result: `${stats.tailOutlierCount || 0} ${outlierPass ? 'PASS' : 'CHECK_BIG_TRADES'}`,
        note: 'Counts trades that are much larger than the usual range of this strategy.',
        pass: outlierPass
      },
      {
        name: 'Risk Management Coverage Check',
        result: `${(stats.stopLossCoveragePct || 0).toFixed(0)}% ${riskPass ? 'PASS' : 'NO_RISK_MODEL'}`,
        note: 'Checks whether enough trades have stop-loss data, especially when a few large trades can change the whole result.',
        pass: riskPass
      }
    ]
  })

  const robustnessHypothesisSummary = computed(() => {
    const tests = robustnessNormalityTests.value
    const failed = tests.filter(t => !t.pass)
    if (failed.length === 0) {
      return 'Hypothesis verdict: no major warning is visible yet. The normal curve view is usable, but keep checking whether future trades become unusually large.'
    }

    const stats = diagnosticStats.value
    const hasNormalityFailure = failed.some(t => t.name === 'Balanced Result Shape Check')
    const hasRiskModelFailure = failed.some(t => t.name === 'Risk Management Coverage Check')
    const hasTailFailure = failed.some(t =>
      t.name === 'Large Trade Frequency Check' ||
      t.name === 'Unusually Large Trade Check' ||
      t.name === 'QQ-Plot Alignment Check'
    )
    const hasShapeFailure = failed.some(t => t.name === 'Win/Loss Balance Check')

    if (hasRiskModelFailure && hasTailFailure && hasShapeFailure) {
      return `Hypothesis verdict: fragile profile. Loss/win imbalance, unusually large trades, and weak risk controls are all active. The average PnL can be misleading. Stop-loss coverage is ${stats.stopLossCoveragePct.toFixed(0)}%.`
    }

    if (hasRiskModelFailure && hasTailFailure) {
      return `Hypothesis verdict: large-trade risk is not controlled. Some trades are much bigger than usual and risk coverage is weak, so improve controls before trusting the average trade. Stop-loss coverage is ${stats.stopLossCoveragePct.toFixed(0)}%.`
    }

    if (hasRiskModelFailure && hasShapeFailure) {
      return `Hypothesis verdict: uneven results and weak controls. Wins and losses are not balanced, and the risk model is too thin to trust the edge. Stop-loss coverage is ${stats.stopLossCoveragePct.toFixed(0)}%.`
    }

    if (hasRiskModelFailure) {
      return `Hypothesis verdict: risk model missing. Results may look acceptable, but confidence is limited until stop-loss coverage improves from ${stats.stopLossCoveragePct.toFixed(0)}%.`
    }

    if (hasTailFailure && hasShapeFailure) {
      return 'Hypothesis verdict: unstable result shape. Some trades are unusually large and wins/losses are not balanced, so do not judge the strategy only by average return.'
    }

    if (hasTailFailure) {
      return 'Hypothesis verdict: a few unusually large trades are shaping the result. Check whether the strategy still works if the best trade or worst trade is removed.'
    }

    if (hasShapeFailure) {
      return 'Hypothesis verdict: uneven wins and losses. The edge may depend too much on either big winners or avoiding big losers, so validate this before increasing size.'
    }

    if (hasNormalityFailure) {
      return 'Hypothesis verdict: the simple normal curve is not a strong fit. Use it as a visual reference only and confirm the edge with more trades.'
    }

    return 'Hypothesis verdict: mixed warning. The sample is not clear enough for high confidence, so treat the edge as unconfirmed.'
  })

  const robustnessBootstrapSummary = computed(() => {
    const bs = diagnosticStats.value.bootstrapCI
    return [
      { name: 'Simulations', val: '500' },
      { name: 'Mean Estimate', val: `$${bs.mean.toFixed(2)}` },
      { name: 'Std Error', val: `$${bs.stdErr.toFixed(2)}` },
      { name: '95% CI Lower', val: `$${bs.lower.toFixed(2)}` },
      { name: '95% CI Upper', val: `$${bs.upper.toFixed(2)}` },
      { name: 'CI Width', val: `$${(bs.upper - bs.lower).toFixed(2)}` }
    ]
  })

  const robustnessBootstrapInterpretation = computed(() => {
    const bs = diagnosticStats.value.bootstrapCI
    if (bs.lower > 0) {
      return 'The resampling range stays above zero. The edge still looks positive after many re-checks, but position size should still respect the large-trade warnings.'
    }
    if (bs.upper < 0) {
      return 'The resampling range stays below zero. The strategy currently looks negative after repeated checks and should be reworked.'
    }
    return 'The resampling range crosses zero. The edge is not stable yet; collect more trades or reduce risk until the range stays positive.'
  })

  const robustnessReturnHeatmap = computed(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentTrades = getFilteredTrades()
    const cells = new Map<string, { month: string; weekday: string; pnl: number; count: number }>()
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    currentTrades.forEach(t => {
      const dRaw = t.dateExit || t.date
      const d = dRaw instanceof Date ? dRaw : new Date(dRaw)
      if (Number.isNaN(d.getTime())) return
      const pnlVal = t.profitInCurrency ?? t.result ?? (t as any).pnl ?? 0
      const raw = typeof pnlVal === 'string' ? parseFloat(pnlVal) : Number(pnlVal)
      const key = `${d.getMonth()}-${d.getDay()}`
      const existing = cells.get(key) || { month: monthNames[d.getMonth()] || 'N/A', weekday: weekdays[d.getDay()] || 'N/A', pnl: 0, count: 0 }
      existing.pnl += Number.isFinite(raw) ? raw : 0
      existing.count += 1
      cells.set(key, existing)
    })

    return Array.from(cells.values())
  })

  const robustnessUiLayerSummary = computed(() => {
    const m = strategyMetrics.value
    const stats = diagnosticStats.value
    return [
      { name: 'Rolling Sharpe', val: `${m.rollingSharpe.toFixed(2)}` },
      { name: 'Rolling Sigma', val: `${m.stdDevPct.toFixed(2)}%` },
      { name: 'Rolling Drawdown', val: `${m.rollingDrawdown.toFixed(1)}%` },
      { name: 'Rolling Win Rate', val: `${m.rollingWinRate.toFixed(1)}%` },
      { name: 'Result Pattern Strength', val: `${m.distributionRobustness.toFixed(1)}` },
      { name: 'Big Trade Impact', val: `${m.outlierImpactRatio.toFixed(1)}%` },
      { name: 'Risk Coverage', val: `${stats.stopLossCoveragePct.toFixed(0)}% SL / ${stats.takeProfitCoveragePct.toFixed(0)}% TP` },
      { name: 'Heatmap Cells', val: `${robustnessReturnHeatmap.value.length}` }
    ]
  })

  const robustnessVisualizationStatus = computed(() => {
    return [
      { name: 'Histogram Overlay Selector', val: 'Calm / large-trade overlay available' },
      { name: 'Trade Result Curve Check', val: `${diagnosticStats.value.qqPoints?.length || 0} points` },
      { name: 'Rolling Metrics', val: 'Sharpe, sigma, drawdown, win rate' },
      { name: 'Calendar Heatmap', val: 'Weekday / month return matrix' }
    ]
  })

  const robustnessExplanationSequence = computed(() => {
    const stats = diagnosticStats.value
    const normalBic = stats.normalParams?.bic ?? 0
    const tBic = stats.tParams?.bic ?? 0
    const modelReason = stats.preferredModel === "Student's t"
      ? `The large-trade model score (${tBic.toFixed(2)}) is better than the calm normal score (${normalBic.toFixed(2)}), so unusually large trades deserve priority.`
      : `The calm normal score (${normalBic.toFixed(2)}) is competitive with the large-trade score (${tBic.toFixed(2)}), so the profile is treated as calmer unless win/loss imbalance or large trades disagree.`

    return [
      `1. Fit check: ${modelReason}`,
      `2. Curve range: the diagnostic view covers $${stats.curveDomain.min.toFixed(0)} to $${stats.curveDomain.max.toFixed(0)}, while real trades range from $${stats.minPnl.toFixed(0)} to $${stats.maxPnl.toFixed(0)}.`,
      `3. Dispersion check: standard deviation is $${stats.std.toFixed(2)}, so compare the average trade against the normal swing size of this strategy.`,
      `4. Shape check: win/loss imbalance is ${stats.skewness >= 0 ? '+' : ''}${stats.skewness.toFixed(2)} and large-trade frequency is ${stats.kurtosis >= 0 ? '+' : ''}${stats.kurtosis.toFixed(2)}.`,
      `5. Risk check: stop-loss coverage is ${stats.stopLossCoveragePct.toFixed(0)}%, take-profit coverage is ${stats.takeProfitCoveragePct.toFixed(0)}%, and ${stats.unmanagedRiskCount} trades are unmanaged.`,
      `6. Verdict: ${robustnessExplanation.value.verdict}.`,
      `7. Action: ${robustnessExplanation.value.action}`
    ].join('\n')
  })

  return {
    robustnessExplanation,
    robustnessExplanationVariables,
    robustnessDistributionFits,
    robustnessDistributionComparison,
    robustnessNormalityTests,
    robustnessHypothesisSummary,
    robustnessBootstrapSummary,
    robustnessBootstrapInterpretation,
    robustnessUiLayerSummary,
    robustnessVisualizationStatus,
    robustnessReturnHeatmap,
    robustnessExplanationSequence
  }
}
