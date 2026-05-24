use reqwest::header::USER_AGENT;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Manager;

pub struct BenchmarkState(pub Mutex<BenchmarkStateInner>);

pub struct BenchmarkStateInner {
    pub has_fetched: bool,
    pub cached_rate: f64,
    pub cached_risk_free: f64,
    pub cached_betas: HashMap<String, f64>,
}

impl Default for BenchmarkState {
    fn default() -> Self {
        Self(Mutex::new(BenchmarkStateInner {
            has_fetched: false,
            cached_rate: 25.21,
            cached_risk_free: 5.00,
            cached_betas: HashMap::new(),
        }))
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BenchmarkResponse {
    pub benchmark_rate: f64,
    pub beta: f64,
    pub risk_free_rate: f64,
    pub is_fallback: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct CacheData {
    benchmark_rate: f64,
    beta: f64,
    risk_free_rate: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct StrategyBenchmarkCache {
    beta: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct StrategyCacheData {
    benchmark_rate: f64,
    risk_free_rate: f64,
    strategies: HashMap<String, StrategyBenchmarkCache>,
}

#[derive(Deserialize, Debug)]
struct YahooChartResponse {
    chart: Option<ChartBody>,
}

#[derive(Deserialize, Debug)]
struct ChartBody {
    result: Option<Vec<ChartResult>>,
}

#[derive(Deserialize, Debug)]
struct ChartResult {
    meta: Option<ChartMeta>,
    timestamp: Option<Vec<i64>>,
    indicators: Option<ChartIndicators>,
}

#[derive(Deserialize, Debug)]
struct ChartMeta {
    #[serde(rename = "regularMarketPrice")]
    regular_market_price: Option<f64>,
    #[serde(rename = "chartPreviousClose")]
    chart_previous_close: Option<f64>,
}

#[derive(Deserialize, Debug)]
struct ChartIndicators {
    quote: Option<Vec<ChartQuote>>,
}

#[derive(Deserialize, Debug)]
struct ChartQuote {
    close: Option<Vec<Option<f64>>>,
}

#[tauri::command]
pub async fn get_benchmark_and_beta(
    strategy_returns: Vec<f64>,
    strategy_id: Option<String>,
    state: tauri::State<'_, BenchmarkState>,
    app: tauri::AppHandle,
) -> Result<BenchmarkResponse, String> {
    let strategy_key = strategy_id
        .as_deref()
        .map(str::trim)
        .filter(|id| !id.is_empty())
        .unwrap_or("MAIN_DIARY")
        .to_string();

    // 1. Check in-memory state lock for this concrete strategy.
    {
        let lock = state.0.lock().unwrap();
        if lock.has_fetched {
            if let Some(beta) = lock.cached_betas.get(&strategy_key) {
                log::info!("[benchmark] Using in-memory cached benchmark data for strategy {} -> rate: {:.2}%, beta: {:.2}, risk_free: {:.2}%", strategy_key, lock.cached_rate, beta, lock.cached_risk_free);
                return Ok(BenchmarkResponse {
                    benchmark_rate: lock.cached_rate,
                    beta: *beta,
                    risk_free_rate: lock.cached_risk_free,
                    is_fallback: false,
                });
            }
        }
    }

    let load_strategy_cache = |path: &std::path::PathBuf| -> Option<StrategyCacheData> {
        let json_str = std::fs::read_to_string(path).ok()?;
        if let Ok(cache) = serde_json::from_str::<StrategyCacheData>(&json_str) {
            return Some(cache);
        }
        if let Ok(legacy) = serde_json::from_str::<CacheData>(&json_str) {
            let mut strategies = HashMap::new();
            strategies.insert(
                "MAIN_DIARY".to_string(),
                StrategyBenchmarkCache { beta: legacy.beta },
            );
            return Some(StrategyCacheData {
                benchmark_rate: legacy.benchmark_rate,
                risk_free_rate: legacy.risk_free_rate,
                strategies,
            });
        }
        None
    };

    let save_strategy_cache =
        |path: &std::path::PathBuf, strategy: &str, rate: f64, beta: f64, risk_free: f64| {
            let mut cache = load_strategy_cache(path).unwrap_or(StrategyCacheData {
                benchmark_rate: rate,
                risk_free_rate: risk_free,
                strategies: HashMap::new(),
            });
            cache.benchmark_rate = rate;
            cache.risk_free_rate = risk_free;
            cache
                .strategies
                .insert(strategy.to_string(), StrategyBenchmarkCache { beta });

            if let Ok(json_str) = serde_json::to_string_pretty(&cache) {
                let _ = std::fs::write(path, json_str);
            }
        };

    let load_cached_strategy =
        |path: &std::path::PathBuf, strategy: &str| -> Option<BenchmarkResponse> {
            let cache = load_strategy_cache(path)?;
            cache
                .strategies
                .get(strategy)
                .map(|entry| BenchmarkResponse {
                    benchmark_rate: cache.benchmark_rate,
                    beta: entry.beta,
                    risk_free_rate: cache.risk_free_rate,
                    is_fallback: true,
                })
        };

    let cache_response_in_memory = |response: &BenchmarkResponse, strategy: &str| {
        let mut lock = state.0.lock().unwrap();
        lock.has_fetched = true;
        lock.cached_rate = response.benchmark_rate;
        lock.cached_risk_free = response.risk_free_rate;
        lock.cached_betas
            .insert(strategy.to_string(), response.beta);
    };

    // Helper to get cache file path
    let get_cache_path = || -> Result<std::path::PathBuf, String> {
        let doc_dir = app.path().document_dir().map_err(|e| e.to_string())?;
        let voes_dir = doc_dir.join("VoesData");
        std::fs::create_dir_all(&voes_dir).map_err(|e| e.to_string())?;
        Ok(voes_dir.join("benchmark_rust_cache.json"))
    };

    // 2. Reuse a local cache for strategies with too little data instead of overwriting
    // their previous beta with the baseline default.
    if strategy_returns.len() < 2 {
        if let Ok(cache_path) = get_cache_path() {
            if let Some(response) = load_cached_strategy(&cache_path, &strategy_key) {
                log::info!("[benchmark] Strategy {} has < 2 returns; using cached beta {:.2} from local JSON.", strategy_key, response.beta);
                cache_response_in_memory(&response, &strategy_key);
                return Ok(response);
            }
        }
    }

    // 3. Attempt live fetch from Yahoo Finance
    let bench_beta_res = fetch_live_benchmark_and_beta(&strategy_returns).await;
    let risk_free_res = fetch_live_risk_free_rate().await;

    match bench_beta_res {
        Ok((rate, beta)) => {
            let risk_free = risk_free_res.unwrap_or(5.00);
            log::info!("[benchmark] Successfully fetched live benchmark data for strategy {} -> rate: {:.2}%, beta: {:.2}, risk_free: {:.2}%", strategy_key, rate, beta, risk_free);

            if let Ok(cache_path) = get_cache_path() {
                save_strategy_cache(&cache_path, &strategy_key, rate, beta, risk_free);
            }

            let response = BenchmarkResponse {
                benchmark_rate: rate,
                beta,
                risk_free_rate: risk_free,
                is_fallback: false,
            };
            cache_response_in_memory(&response, &strategy_key);
            Ok(response)
        }
        Err(e) => {
            log::warn!("[benchmark] Live fetch failed for strategy {}: {}, attempting to load from local JSON cache...", strategy_key, e);

            if let Ok(cache_path) = get_cache_path() {
                if let Some(response) = load_cached_strategy(&cache_path, &strategy_key) {
                    log::info!("[benchmark] Successfully loaded cached benchmark data for strategy {} -> rate: {:.2}%, beta: {:.2}, risk_free: {:.2}%", strategy_key, response.benchmark_rate, response.beta, response.risk_free_rate);
                    cache_response_in_memory(&response, &strategy_key);
                    return Ok(response);
                }
            }

            log::warn!("[benchmark] Local JSON cache unavailable for strategy {}, falling back to baseline defaults.", strategy_key);
            let response = BenchmarkResponse {
                benchmark_rate: 25.21,
                beta: 0.85,
                risk_free_rate: 5.00,
                is_fallback: true,
            };
            cache_response_in_memory(&response, &strategy_key);
            Ok(response)
        }
    }
}

async fn fetch_live_benchmark_and_beta(strategy_returns: &[f64]) -> Result<(f64, f64), String> {
    let url = "https://query2.finance.yahoo.com/v8/finance/chart/^GSPC?interval=1d&range=1y";
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data = res
        .json::<YahooChartResponse>()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;

    let result = data
        .chart
        .and_then(|c| c.result)
        .and_then(|mut r| r.pop())
        .ok_or_else(|| "No chart result found".to_string())?;

    let mut benchmark_rate = 25.21;
    let mut current_price = None;
    let mut previous_price = None;

    if let Some(meta) = &result.meta {
        current_price = meta.regular_market_price;
        previous_price = meta.chart_previous_close;
    }

    let mut beta = 0.85;
    if let Some(indicators) = result.indicators {
        if let Some(mut quotes) = indicators.quote {
            if let Some(quote) = quotes.pop() {
                if let Some(closes) = quote.close {
                    let valid_prices: Vec<f64> = closes.into_iter().filter_map(|p| p).collect();
                    let timestamps = result.timestamp.unwrap_or_default();

                    log::info!(
                        "[benchmark_diagnostic] Parsed {} valid close prices from Yahoo Finance.",
                        valid_prices.len()
                    );
                    if !timestamps.is_empty() && timestamps.len() == valid_prices.len() {
                        log::info!(
                            "[benchmark_diagnostic] Time range: First TS={}, Last TS={}",
                            timestamps.first().unwrap(),
                            timestamps.last().unwrap()
                        );
                    }

                    if let Some(&last_close) = valid_prices.last() {
                        if current_price.is_none() {
                            current_price = Some(last_close);
                        }
                    }
                    if let Some(&first_close) = valid_prices.first() {
                        if previous_price.is_none() || previous_price == Some(0.0) {
                            previous_price = Some(first_close);
                        }
                    }

                    log::info!("[benchmark_diagnostic] Prices to compute benchmark rate -> Current: {:?}, Previous: {:?}", current_price, previous_price);

                    if let (Some(cur), Some(prev)) = (current_price, previous_price) {
                        if prev > 0.0 {
                            benchmark_rate = ((cur - prev) / prev) * 100.0;
                            log::info!("[benchmark_diagnostic] Calculated Benchmark Rate: (({} - {}) / {}) * 100 = {:.2}%", cur, prev, prev, benchmark_rate);
                        } else {
                            log::warn!("[benchmark_diagnostic] Previous price was <= 0.0, cannot calculate benchmark rate.");
                        }
                    }

                    if valid_prices.len() > 1 {
                        let mut market_returns = Vec::new();
                        for i in 1..valid_prices.len() {
                            let prev = valid_prices[i - 1];
                            let cur = valid_prices[i];
                            if prev > 0.0 {
                                market_returns.push((cur - prev) / prev);
                            }
                        }

                        let n_strat = strategy_returns.len();
                        log::info!("[benchmark_diagnostic] Strategy returns count: {}, Market returns count: {}", n_strat, market_returns.len());
                        if n_strat >= 2 && !market_returns.is_empty() {
                            let n_take = n_strat.min(market_returns.len());
                            let s_slice = &strategy_returns[n_strat - n_take..];
                            let m_slice = &market_returns[market_returns.len() - n_take..];

                            log::info!("[benchmark_diagnostic] Computing Beta using recent {} data points.", n_take);

                            let mean_s: f64 = s_slice.iter().sum::<f64>() / (n_take as f64);
                            let mean_m: f64 = m_slice.iter().sum::<f64>() / (n_take as f64);

                            let mut cov = 0.0;
                            let mut var_m = 0.0;
                            for i in 0..n_take {
                                let ds = s_slice[i] - mean_s;
                                let dm = m_slice[i] - mean_m;
                                cov += ds * dm;
                                var_m += dm * dm;
                            }

                            let denom = (n_take - 1) as f64;
                            log::info!("[benchmark_diagnostic] Sum Covariance: {}, Sum Variance (Market): {}", cov, var_m);

                            if denom > 0.0 && var_m > 0.0 {
                                let calc_beta = (cov / denom) / (var_m / denom);
                                log::info!(
                                    "[benchmark_diagnostic] Calculated raw beta: {}",
                                    calc_beta
                                );
                                if !calc_beta.is_nan() && calc_beta.is_finite() {
                                    beta = calc_beta.clamp(-3.0, 5.0);
                                    log::info!(
                                        "[benchmark_diagnostic] Final clamped Beta: {}",
                                        beta
                                    );
                                } else {
                                    log::warn!("[benchmark_diagnostic] Calculated beta was NaN or infinite.");
                                }
                            } else {
                                log::warn!("[benchmark_diagnostic] Denom ({}) or Market Variance ({}) <= 0.0, cannot calculate beta.", denom, var_m);
                            }
                        } else {
                            log::warn!("[benchmark_diagnostic] Not enough strategy returns (needs >= 2) or market returns to calculate beta. Using default 0.85");
                        }
                    } else {
                        log::warn!("[benchmark_diagnostic] Not enough valid prices (needs > 1) from Yahoo to calculate market returns.");
                    }
                } else {
                    log::warn!("[benchmark_diagnostic] `quote.close` was None.");
                }
            } else {
                log::warn!("[benchmark_diagnostic] `indicators.quote` was empty.");
            }
        } else {
            log::warn!("[benchmark_diagnostic] `indicators.quote` was None.");
        }
    } else {
        log::warn!("[benchmark_diagnostic] `result.indicators` was None.");
    }

    Ok((benchmark_rate, beta))
}

async fn fetch_live_risk_free_rate() -> Result<f64, String> {
    let url = "https://query2.finance.yahoo.com/v8/finance/chart/^IRX?interval=1d&range=5d";
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let data = res
        .json::<YahooChartResponse>()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;

    let result = data
        .chart
        .and_then(|c| c.result)
        .and_then(|mut r| r.pop())
        .ok_or_else(|| "No chart result found".to_string())?;

    if let Some(meta) = &result.meta {
        if let Some(price) = meta.regular_market_price {
            if price > 0.0 {
                log::info!(
                    "[benchmark_diagnostic] Fetched live Risk-Free Rate (^IRX): {:.2}%",
                    price
                );
                return Ok(price);
            }
        }
    }

    if let Some(indicators) = result.indicators {
        if let Some(mut quotes) = indicators.quote {
            if let Some(quote) = quotes.pop() {
                if let Some(closes) = quote.close {
                    let valid_prices: Vec<f64> = closes.into_iter().filter_map(|p| p).collect();
                    if let Some(&last_close) = valid_prices.last() {
                        if last_close > 0.0 {
                            log::info!("[benchmark_diagnostic] Fetched live Risk-Free Rate (^IRX) from last close: {:.2}%", last_close);
                            return Ok(last_close);
                        }
                    }
                }
            }
        }
    }

    Ok(5.00)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailyDataPoint {
    pub timestamp: i64,
    pub value: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HistoricalCurves {
    pub benchmark: Vec<DailyDataPoint>,
    pub risk_free: Vec<DailyDataPoint>,
}

#[tauri::command]
pub async fn get_historical_curves(
    strategy_id: String,
    start_ts: i64,
    end_ts: i64,
    app: tauri::AppHandle,
) -> Result<HistoricalCurves, String> {
    let strategy_key = strategy_id.trim();
    if strategy_key.is_empty() {
        return Err("Invalid strategy ID".to_string());
    }

    let doc_dir = app.path().document_dir().map_err(|e| e.to_string())?;
    let voes_dir = doc_dir.join("VoesData");
    std::fs::create_dir_all(&voes_dir).map_err(|e| e.to_string())?;
    let cache_path = voes_dir.join(format!("historical_curves_{}.json", strategy_key));

    // Try reading cache
    if let Ok(json_str) = std::fs::read_to_string(&cache_path) {
        if let Ok(cached) = serde_json::from_str::<HistoricalCurves>(&json_str) {
            let has_start = cached
                .benchmark
                .first()
                .map_or(false, |p| p.timestamp <= start_ts + 86400);
            let has_end = cached
                .benchmark
                .last()
                .map_or(false, |p| p.timestamp >= end_ts - 86400);
            if has_start && has_end {
                log::info!(
                    "[benchmark] Serving historical curves from cache for strategy {}",
                    strategy_key
                );
                return Ok(cached);
            }
        }
    }

    log::info!(
        "[benchmark] Fetching live historical curves for strategy {} from {} to {}",
        strategy_key,
        start_ts,
        end_ts
    );

    let fetch_curve = |symbol: String| async move {
        // Yahoo expects timestamps in seconds.
        let url = format!(
            "https://query2.finance.yahoo.com/v8/finance/chart/{}?period1={}&period2={}&interval=1d",
            symbol, start_ts - (7 * 86400), end_ts + (7 * 86400) // add padding
        );
        let client = reqwest::Client::new();
        let res = client
            .get(&url)
            .header(
                reqwest::header::USER_AGENT,
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            )
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let data = res
            .json::<YahooChartResponse>()
            .await
            .map_err(|e| format!("JSON parse failed: {}", e))?;

        let result = data
            .chart
            .and_then(|c| c.result)
            .and_then(|mut r| r.pop())
            .ok_or_else(|| "No chart result found".to_string())?;

        let mut points = Vec::new();
        if let (Some(timestamps), Some(indicators)) = (result.timestamp, result.indicators) {
            if let Some(mut quotes) = indicators.quote {
                if let Some(quote) = quotes.pop() {
                    if let Some(closes) = quote.close {
                        for (ts, price) in timestamps.into_iter().zip(closes.into_iter()) {
                            if let Some(p) = price {
                                points.push(DailyDataPoint {
                                    timestamp: ts,
                                    value: p,
                                });
                            }
                        }
                    }
                }
            }
        }
        Ok::<Vec<DailyDataPoint>, String>(points)
    };

    let benchmark_points = fetch_curve("^GSPC".to_string()).await.unwrap_or_default();
    let risk_free_points = fetch_curve("^IRX".to_string()).await.unwrap_or_default();

    let curves = HistoricalCurves {
        benchmark: benchmark_points,
        risk_free: risk_free_points,
    };

    // Save cache
    if let Ok(json_str) = serde_json::to_string_pretty(&curves) {
        let _ = std::fs::write(&cache_path, json_str);
    }

    Ok(curves)
}
