import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homeContent } from '../src/shared/i18n/homeContent.js'
import { renderMarkdown } from '../src/shared/legal/renderMarkdown.js'
import {
  SITE,
  BRAND,
  BRAND_ALTERNATES,
  CONTACT_EMAIL,
  indexedPaths,
  pageSeo,
  getAlternates,
  keywords,
  SOCIAL_IMAGE,
  contentPages,
  homeVideos,
  videoStructuredData,
  HOME_VIDEOS_UPLOAD_DATE,
} from '../src/shared/seo.js'

const BUILD_DATE = new Date().toISOString().slice(0, 10)

// The site is a client-rendered SPA, but crawlers that do not run JavaScript
// (Google, Yandex, Bing, DuckDuckGo, AI crawlers) must see semantic, keyword-rich
// static HTML with full Schema.org structured data, multilingual hreflang alternates,
// and accessible content. Each page is published with static copy inside #app;
// Vue replaces it on mount.

const APP_ROOT = '<div id="app" class="bg-white text-black"></div>'

const template = readFileSync('dist/index.html', 'utf8')
const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const legalHtml = (doc) => renderMarkdown(readFileSync(`src/shared/legal/${doc}.en.md`, 'utf8'))

const staticStyles = `<style>
    .static-page { max-width: 960px; margin: 0 auto; padding: 40px 20px 60px; color: rgba(0,0,0,.82); font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, sans-serif; }
    .static-page h1, .static-page h2, .static-page h3 { color: #000; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; line-height: 1.18; }
    .static-page h1 { font-size: 2.4rem; margin-bottom: 16px; }
    .static-page h2 { font-size: 1.75rem; margin-top: 40px; margin-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,.08); padding-bottom: 8px; }
    .static-page h3 { font-size: 1.25rem; margin-top: 24px; margin-bottom: 8px; }
    .static-page p { margin-bottom: 16px; }
    .static-page a { color: #000; text-decoration: underline; text-underline-offset: 3px; }
    .static-page nav { display: flex; flex-wrap: wrap; gap: 10px 24px; margin-bottom: 32px; font-size: 0.95rem; }
    .static-page footer nav { margin-top: 24px; border-top: 1px solid rgba(0,0,0,.08); padding-top: 20px; }
    .static-page table { width: 100%; border-collapse: collapse; font-size: .95rem; margin: 20px 0; }
    .static-page th, .static-page td { padding: 10px 12px; border: 1px solid rgba(0,0,0,.12); text-align: left; vertical-align: top; }
    .static-page th { background: rgba(0,0,0,.04); font-weight: 600; }
    .static-page .legal-table { overflow-x: auto; display: block; }
    .static-page img { max-width: 100%; height: auto; border: 1px solid rgba(0,0,0,.08); margin: 20px 0; }
    .static-page .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 24px 0; }
    .static-page .feature-card { border: 1px solid rgba(0,0,0,.12); padding: 18px 20px; background: #fafafa; }
    .static-page .feature-card h3 { margin-top: 0; }
    .static-page dl dt { font-weight: 600; margin-top: 16px; font-size: 1.05rem; }
    .static-page dl dd { margin-left: 0; margin-bottom: 12px; color: rgba(0,0,0,.75); }
    .static-page .btn { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-weight: 500; margin-top: 12px; }
  </style>`

const header = (locale) => `<header>
      <a href="${locale === 'ru' ? '/ru/' : '/'}"><strong>${BRAND}</strong></a>
      <nav aria-label="Primary">
        <a href="${locale === 'ru' ? '/ru/download' : '/download'}">${locale === 'ru' ? 'Скачать' : 'Download'}</a>
        <a href="${locale === 'ru' ? '/ru/pricing' : '/pricing'}">${locale === 'ru' ? 'Тарифы' : 'Pricing'}</a>
        <a href="${locale === 'ru' ? '/ru/about' : '/about'}">${locale === 'ru' ? 'О нас' : 'About'}</a>
        <a href="${locale === 'ru' ? '/' : '/ru/'}" hreflang="${locale === 'ru' ? 'en' : 'ru'}">${locale === 'ru' ? 'English' : 'Русский'}</a>
      </nav>
    </header>`

const footer = (locale) => `<footer>
      <p><strong>${BRAND}</strong> — ${locale === 'ru' ? 'Бесплатный дневник трейдера и журнал сделок для Windows и macOS' : 'Free desktop trading journal and analytics workspace for Windows and macOS'}.</p>
      <nav aria-label="Legal">
        <a href="${locale === 'ru' ? '/ru/privacy' : '/privacy'}">${locale === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}</a>
        <a href="${locale === 'ru' ? '/ru/terms' : '/terms'}">${locale === 'ru' ? 'Условия использования' : 'Terms of Use'}</a>
        <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
        <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram</a>
      </nav>
    </footer>`

const faqItems = {
  ru: [
    {
      question: 'Что такое JORU?',
      answer: 'JORU — это автономный десктопный дневник трейдера и аналитическое пространство для Windows и macOS. Приложение помогает системно анализировать сделки, отслеживать метрики риска, тестировать правила стратегии и находить убыточные привычки с помощью алгоритма Karl-Nikolai I.',
    },
    {
      question: 'Чем JORU отличается от облачных дневников (TradesViz, TraderSync, Edgewonk)?',
      answer: 'В отличие от облачных сервисов, JORU хранит 100% ваших сделок, заметок и API-ключей локально на вашем компьютере в базе данных SQLite. Ваши данные никогда не передаются на сторонние серверы, защищены от утечек, а приложение работает мгновенно и без зависимости от интернета.',
    },
    {
      question: 'Действительно ли дневник бесплатный?',
      answer: 'Да. Базовый тариф Free полностью бесплатен навсегда без триалов и скрытых ограничений по времени. Он включает журнал сделок, скриншоты, теги, монитор активности, кривую капитала и метрики просадок. Расширенный тариф Full ($9.99 в месяц) подключается по желанию для продвинутой аналитики и симуляций Монте-Карло.',
    },
    {
      question: 'С каких бирж и брокеров можно импортировать сделки?',
      answer: 'Поддерживается автоматический импорт сделок из MetaTrader 5 (MT5), Bybit, Binance, Kraken и Interactive Brokers (IBKR), а также удобный ручной ввод с графическим разбором на японских свечах.',
    },
    {
      question: 'На каких операционных системах работает JORU?',
      answer: 'Приложение создано для macOS 12+ (Universal build: Apple Silicon M1/M2/M3/M4 и процессоры Intel) и Windows 10/11 (64-bit).',
    },
    {
      question: 'Как Karl-Nikolai I находит убыточные привычки?',
      answer: 'Алгоритм Karl-Nikolai I анализирует историю сделок и тестирует отдельные условия и комбинации (время суток, сетап, направление, сделка после убытка). Он ранжирует повторяющиеся паттерны по степени влияния на совокупный результат и достоверности, помогая зафиксировать правило в торговой системе.',
    },
  ],
  en: [
    {
      question: 'What is JORU?',
      answer: 'JORU is an offline desktop trading journal and analytics workspace for Windows and macOS. It helps traders systematically review trade executions, track risk metrics, test strategy conditions, and eliminate costly habits with the Karl-Nikolai I detection algorithm.',
    },
    {
      question: 'How does JORU compare to cloud journals like TradesViz, TraderSync or Edgewonk?',
      answer: 'Unlike cloud SaaS platforms, JORU stores 100% of your trade records, screenshots, and exchange API keys locally on your computer in an embedded SQLite database. Your financial data is never tracked, leaked, or sold to third parties, and the application operates with zero latency and full offline capability.',
    },
    {
      question: 'Is JORU really free?',
      answer: 'Yes. The Free plan is free forever with no trial period, time limits, or credit card required. It includes core journaling, trade tagging, screenshots, activity monitor, equity curves, and drawdown tracking. The Full plan ($9.99/mo) adds advanced Karl-Nikolai pattern detection, Genesis Matrix, and Monte Carlo risk simulations.',
    },
    {
      question: 'Which brokers and exchanges are supported for import?',
      answer: 'JORU supports automated trade imports from MetaTrader 5 (MT5), Bybit, Binance, Kraken, and Interactive Brokers (IBKR), alongside manual trade logging with interactive candlestick chart replay.',
    },
    {
      question: 'Which operating systems are supported?',
      answer: 'JORU runs natively on macOS 12 Monterey or newer (Universal binary supporting Apple Silicon M1/M2/M3/M4 and Intel) and 64-bit Windows 10/11.',
    },
    {
      question: 'How does Karl-Nikolai I detect costly habits?',
      answer: 'Karl-Nikolai I tests individual conditions and combinations across your trading history (session time, trade direction, post-loss revenge trades) and ranks unprofitable patterns by statistical confidence and capital impact, helping you enforce discipline with objective rules.',
    },
  ],
}

const homeBody = (locale) => {
  if (locale === 'ru') {
    return `<h1>JORU — Бесплатный дневник трейдера и журнал сделок для Windows и macOS</h1>
    <p><strong>JORU</strong> — автономный десктопный дневник трейдера и аналитическое пространство для тех, кто хочет понимать реальные причины своих результатов. В отличие от веб-сервисов вроде TradesViz или TraderSync, JORU хранит 100% ваших сделок, заметок и API-ключей локально на вашем компьютере.</p>
    <p><a href="/ru/download" class="btn">Скачать бесплатно для Windows и macOS</a></p>
    <img src="/screenshots/deep-data.png" width="1440" height="900" alt="Интерфейс торгового дневника JORU с аналитикой сделок" loading="lazy" />

    <section>
      <h2>Ключевые возможности торгового журнала JORU</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Реплей на свечном графике</h3>
          <p>Воспроизводите любую сделку прямо на графике цены. Дневник покажет запланированный сетап, точки входа, стоп-лосс, тейк-профит, фактический выход и точные правила вашей стратегии на свечах исполнения.</p>
        </div>
        <div class="feature-card">
          <h3>Детектив привычек Karl-Nikolai I</h3>
          <p>Вы помните крупные убытки, но самые дорогие ошибки незаметны: ранние входы до 10:00, шорты после минуса, отклонения от риск-менеджмента. Karl-Nikolai I находит скрытые убыточные паттерны и ранжирует их по влиянию на баланс.</p>
        </div>
        <div class="feature-card">
          <h3>Матрица стратегии Genesis</h3>
          <p>Опишите свою стратегию как визуальную систему условий, входов и выходов. Каждый узел показывает частоту срабатывания и профит-фактор, позволяя отсекать неработающие элементы системы.</p>
        </div>
        <div class="feature-card">
          <h3>Симуляция риска Монте-Карло</h3>
          <p>Оцените устойчивость вашей стратегии. Алгоритм генерирует 300 случайных альтернативных перестановок ваших сделок, показывая вероятную максимальную просадку и вероятность слива при изменении порядка сделок.</p>
        </div>
        <div class="feature-card">
          <h3>31 глубокая метрика торговли</h3>
          <p>Анализируйте винрейт, фактор восстановления, соотношение риск/прибыль, среднюю прибыль к убытку, коэффициенты Шарпа и Сортино, время удержания позиций и соблюдение правил матрицы.</p>
        </div>
        <div class="feature-card">
          <h3>100% локальная приватность</h3>
          <p>Никаких облачных утечек. Ваша база сделок хранится исключительно на локальном диске в SQLite. Ваши стратегии, объёмы и финансовые результаты остаются строго конфиденциальными.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>Импорт брокеров и бирж</h2>
      <p>JORU поддерживает автоматический импорт сделок из ведущих платформ для торговли акциями, фьючерсами, форекс и криптовалютой:</p>
      <ul>
        <li><strong>MetaTrader 5 (MT5)</strong> — экспорт отчётов и автоматическая синхронизация сделок.</li>
        <li><strong>Bybit</strong> — фьючерсные и спотовые сделки, отслеживание комиссий и PnL.</li>
        <li><strong>Binance</strong> — USD-M фьючерсы, Coin-M фьючерсы и спот.</li>
        <li><strong>Kraken</strong> — криптовалютные спотовые и деривативные сделки.</li>
        <li><strong>Interactive Brokers (IBKR)</strong> — торговля акциями, опционами и фьючерсами на глобальных рынках.</li>
      </ul>
    </section>

    <section>
      <h2>Сравнение: Excel / Google Таблицы vs Облачные сервисы vs JORU</h2>
      <div class="legal-table">
        <table>
          <thead>
            <tr>
              <th>Критерий</th>
              <th>Таблицы Excel / Google</th>
              <th>Облачные дневники (TradesViz, TraderSync)</th>
              <th>JORU Торговый журнал</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Конфиденциальность данных</strong></td>
              <td>Локально (Excel) / Облако Google</td>
              <td>Хранится на сторонних серверах</td>
              <td><strong>100% локально на вашем ПК (SQLite)</strong></td>
            </tr>
            <tr>
              <td><strong>Реплей на свечном графике</strong></td>
              <td>Нет</td>
              <td>Ограниченно / Задержки веб-графика</td>
              <td><strong>Мгновенный свечной разбор входов и выходов</strong></td>
            </tr>
            <tr>
              <td><strong>Поиск скрытых ошибок (AI/алгоритм)</strong></td>
              <td>Нет</td>
              <td>Базовые фильтры</td>
              <td><strong>Karl-Nikolai I ранжирование паттернов</strong></td>
            </tr>
            <tr>
              <td><strong>Симуляция риска Монте-Карло</strong></td>
              <td>Требует сложных макросов</td>
              <td>Только в дорогих подписках ($30-50/мес)</td>
              <td><strong>Встроено в приложение</strong></td>
            </tr>
            <tr>
              <td><strong>Бесплатный тариф</strong></td>
              <td>Бесплатно</td>
              <td>7-14 дней триал, далее $20-$90/мес</td>
              <td><strong>Бесплатно навсегда ($0)</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Видеообзор интерфейса</h2>
      <p>Посмотрите, как устроена аналитика сделок, работа с кривой капитала и визуализация правил стратегии в приложении JORU:</p>
      ${homeVideos.map(video => `<figure>
        <video poster="${video.poster}" controls preload="none" width="1280" height="720" aria-label="${escapeHtml(video.name.ru)}">
          <source src="${video.src}" type="video/quicktime">
        </video>
        <figcaption>${escapeHtml(video.description.ru)}</figcaption>
      </figure>`).join('')}
    </section>

    <section id="faq">
      <h2>Частые вопросы о торговом журнале JORU</h2>
      <dl>
        ${faqItems.ru.map(item => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}
      </dl>
    </section>`
  }

  return `<h1>JORU — Free Desktop Trading Journal for Windows &amp; macOS</h1>
    <p><strong>JORU</strong> is an offline desktop trading journal and analytics workspace for systematic traders who want to understand the true drivers of their edge. Unlike cloud-based trade trackers like TradesViz or TraderSync, JORU keeps 100% of your trade logs, notes, and API keys strictly on your local machine.</p>
    <p><a href="/download" class="btn">Download Free for Windows &amp; macOS</a></p>
    <img src="/screenshots/deep-data.png" width="1440" height="900" alt="JORU desktop trading journal analytics interface" loading="lazy" />

    <section>
      <h2>Key Features of JORU Trading Journal</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Candlestick Chart Replay</h3>
          <p>Reopen any trade directly on its historical candlestick price chart. Inspect planned setups, entry executions, stop-loss, take-profit, actual exit points, and the exact strategy conditions on the candles that triggered them.</p>
        </div>
        <div class="feature-card">
          <h3>Karl-Nikolai I Habit Investigation</h3>
          <p>You remember catastrophic losses, but the costliest leaks are quiet: early entries before 10:00, revenge shorts after a red trade, or trading without confirmed setups. Karl-Nikolai I tests conditions across your trade history and ranks bad habits by dollar impact.</p>
        </div>
        <div class="feature-card">
          <h3>Genesis Matrix Strategy Builder</h3>
          <p>Map your trading strategy as an interconnected network of scenarios and execution rules. Every condition node displays its occurrence frequency and profit factor, making underperforming rules immediately evident.</p>
        </div>
        <div class="feature-card">
          <h3>Monte Carlo Risk Simulation</h3>
          <p>Stress-test your trading edge before market conditions change. The Monte Carlo engine runs 300 randomized shuffles of your historical trades, projecting drawdown ranges and the probability of adverse runs.</p>
        </div>
        <div class="feature-card">
          <h3>31 Deep Performance Metrics</h3>
          <p>Evaluate win rate, profit factor, Sharpe and Sortino ratios, average win/loss ratio, holding times, recovery factor, and strict strategy matrix adherence across all trade sessions.</p>
        </div>
        <div class="feature-card">
          <h3>100% Local Privacy Guarantee</h3>
          <p>Zero cloud surveillance. Your trade logs and notes are stored inside a local SQLite database on your device. Your trading edge, positions, and API keys never leave your computer.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>Supported Broker &amp; Exchange Imports</h2>
      <p>JORU provides native automated imports for active crypto, forex, futures, and stock traders:</p>
      <ul>
        <li><strong>MetaTrader 5 (MT5)</strong> — Comprehensive trade history report sync and automated logging.</li>
        <li><strong>Bybit</strong> — Perpetual futures and spot trade logs with fee and funding breakdown.</li>
        <li><strong>Binance</strong> — USD-M futures, Coin-M futures, and spot markets.</li>
        <li><strong>Kraken</strong> — Spot and margin cryptocurrency trade histories.</li>
        <li><strong>Interactive Brokers (IBKR)</strong> — Global equities, options, and futures execution records.</li>
      </ul>
    </section>

    <section>
      <h2>Comparison: Spreadsheets vs Cloud SaaS vs JORU</h2>
      <div class="legal-table">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Spreadsheet (Excel / Sheets)</th>
              <th>Cloud Journals (TradesViz, TraderSync)</th>
              <th>JORU Trading Journal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Data Privacy</strong></td>
              <td>Local / Google Drive</td>
              <td>Uploaded to third-party cloud servers</td>
              <td><strong>100% Local SQLite on your computer</strong></td>
            </tr>
            <tr>
              <td><strong>Candlestick Replay</strong></td>
              <td>None</td>
              <td>Web-based with slow loading / throttling</td>
              <td><strong>Native desktop chart playback</strong></td>
            </tr>
            <tr>
              <td><strong>Unprofitable Habit Detection</strong></td>
              <td>None</td>
              <td>Basic filtering</td>
              <td><strong>Karl-Nikolai I statistical pattern detection</strong></td>
            </tr>
            <tr>
              <td><strong>Monte Carlo Simulation</strong></td>
              <td>Requires complex custom scripts</td>
              <td>Locked behind $30-$50/mo premium tiers</td>
              <td><strong>Included natively</strong></td>
            </tr>
            <tr>
              <td><strong>Free Tier</strong></td>
              <td>Free</td>
              <td>7-14 day trial, then $20-$90/month</td>
              <td><strong>Free Forever ($0) with no time limits</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Interface Walkthrough &amp; Video Demonstrations</h2>
      <p>Discover how JORU connects trade logging, equity tracking, and strategy development in one cohesive workflow:</p>
      ${homeVideos.map(video => `<figure>
        <video poster="${video.poster}" controls preload="none" width="1280" height="720" aria-label="${escapeHtml(video.name.en)}">
          <source src="${video.src}" type="video/quicktime">
        </video>
        <figcaption>${escapeHtml(video.description.en)}</figcaption>
      </figure>`).join('')}
    </section>

    <section id="faq">
      <h2>Frequently Asked Questions About JORU Trading Journal</h2>
      <dl>
        ${faqItems.en.map(item => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}
      </dl>
    </section>`
}

const legalBody = (title, doc) => `<h1>${title}</h1>
    <p>${BRAND} — <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy Policy</a></p>
    <article>${legalHtml(doc)}</article>`

const downloadBody = (locale) => {
  if (locale === 'ru') {
    return `<h1>Скачать бесплатный дневник трейдера JORU для Windows и macOS</h1>
    <p>Скачайте десктопное приложение для анализа торговли. Начните с тарифа Free — без ограничений по времени, ввода кредитных карт или скрытых подписок. Записывайте сделки, сохраняйте графики и разбирайте торговые решения.</p>
    <div class="feature-grid">
      <div class="feature-card">
        <h3>macOS</h3>
        <p><strong>Universal DMG</strong> (Apple Silicon M1/M2/M3/M4 и Intel)</p>
        <p>Требуется macOS 12 Monterey или новее. Включает бесплатный тариф Free.</p>
        <p><a href="https://github.com/evanvosh/jlj-releases/releases/latest" class="btn">Скачать для macOS</a></p>
      </div>
      <div class="feature-card">
        <h3>Windows</h3>
        <p><strong>Установочный файл .exe (64-bit)</strong></p>
        <p>Требуется Windows 10 или Windows 11 (x86_64). Включает бесплатный тариф Free.</p>
        <p><a href="https://github.com/evanvosh/jlj-releases/releases/latest" class="btn">Скачать для Windows</a></p>
      </div>
    </div>
    <section>
      <h2>Интерфейс приложения JORU</h2>
      <p>Снимки ключевых аналитических экранов приложения: кривой капитала, отчётов по исполнению и P&amp;L, сценариев, внутрисделочных метрик и рентген-анализа.</p>
      <div class="feature-grid">
        <figure><img src="/dev/demo/1.png" width="1440" height="900" alt="Кривая капитала в торговом журнале JORU" loading="lazy" /><figcaption>Рис. 1 — Кривая капитала (Equity Curve)</figcaption></figure>
        <figure><img src="/dev/demo/2.png" width="1440" height="900" alt="Отчёт по риску и исполнению в JORU" loading="lazy" /><figcaption>Рис. 2 — Отчёт по риску и исполнению (Risk &amp; Execution Report)</figcaption></figure>
        <figure><img src="/dev/demo/3.png" width="1440" height="900" alt="Отчёт по прибыли и убыткам в JORU" loading="lazy" /><figcaption>Рис. 3 — Отчёт по прибыли и убыткам (Profits &amp; Losses Report)</figcaption></figure>
        <figure><img src="/dev/demo/4.png" width="1440" height="900" alt="Отчёт по сценариям и условиям в JORU" loading="lazy" /><figcaption>Рис. 4 — Отчёт по сценариям и условиям (Scenarios &amp; Conditions Report)</figcaption></figure>
        <figure><img src="/dev/demo/5.png" width="1440" height="900" alt="Внутрисделочные метрики в JORU" loading="lazy" /><figcaption>Рис. 5 — Внутрисделочные метрики (In-Trade Metrics)</figcaption></figure>
        <figure><img src="/dev/demo/6.png" width="1440" height="900" alt="Исполнение стратегии в JORU" loading="lazy" /><figcaption>Рис. 6 — Исполнение стратегии (Strategy Execution)</figcaption></figure>
        <figure><img src="/dev/demo/7.png" width="1440" height="900" alt="Рентген-анализ капитала X-Ray в JORU" loading="lazy" /><figcaption>Рис. 7 — Рентген-анализ капитала (X-Ray Equity Analysis)</figcaption></figure>
      </div>
    </section>
    <section>
      <h2>Локальное хранение и безопасность</h2>
      <p>JORU — это нативное приложение для компьютера. Все ваши сделки, заметки, графики и API-ключи брокеров хранятся исключительно на вашем локальном компьютере в базе данных SQLite. Данные никогда не передаются на сторонние серверы.</p>
      <p>Нужна помощь с установкой или есть вопросы? Присоединяйтесь к нашему <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram-сообществу</a> или напишите нам на <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
    </section>`
  }

  return `<h1>Download JORU Free Trading Journal for Windows &amp; macOS</h1>
    <p>Download the native desktop trading journal for Windows and macOS. Start with the free plan to log trades, attach charts, and track your equity curve. Compare features on the <a href="/pricing">pricing page</a>.</p>
    <div class="feature-grid">
      <div class="feature-card">
        <h3>macOS</h3>
        <p><strong>Universal DMG</strong> (Apple Silicon M1/M2/M3/M4 &amp; Intel)</p>
        <p>Requires macOS 12 Monterey or newer. Free plan included forever.</p>
        <p><a href="https://github.com/evanvosh/jlj-releases/releases/latest" class="btn">Download for macOS</a></p>
      </div>
      <div class="feature-card">
        <h3>Windows</h3>
        <p><strong>Native 64-bit Installer (.exe)</strong></p>
        <p>Requires Windows 10 or Windows 11 (64-bit). Free plan included forever.</p>
        <p><a href="https://github.com/evanvosh/jlj-releases/releases/latest" class="btn">Download for Windows</a></p>
      </div>
    </div>
    <section>
      <h2>Inside the Application Interface</h2>
      <p>Explore preview screenshots of JORU's core analytical modules: equity curves, risk &amp; execution reports, P&amp;L distribution, in-trade metrics, and X-Ray analysis.</p>
      <div class="feature-grid">
        <figure><img src="/dev/demo/1.png" width="1440" height="900" alt="Equity curve in JORU trading journal" loading="lazy" /><figcaption>Fig. 1 — Equity Curve</figcaption></figure>
        <figure><img src="/dev/demo/2.png" width="1440" height="900" alt="Risk &amp; execution report in JORU" loading="lazy" /><figcaption>Fig. 2 — Risk &amp; Execution Report</figcaption></figure>
        <figure><img src="/dev/demo/3.png" width="1440" height="900" alt="Profits &amp; losses report in JORU" loading="lazy" /><figcaption>Fig. 3 — Profits &amp; Losses Report</figcaption></figure>
        <figure><img src="/dev/demo/4.png" width="1440" height="900" alt="Scenarios &amp; conditions report in JORU" loading="lazy" /><figcaption>Fig. 4 — Scenarios &amp; Conditions Report</figcaption></figure>
        <figure><img src="/dev/demo/5.png" width="1440" height="900" alt="In-trade metrics in JORU" loading="lazy" /><figcaption>Fig. 5 — In-Trade Metrics</figcaption></figure>
        <figure><img src="/dev/demo/6.png" width="1440" height="900" alt="Strategy execution in JORU" loading="lazy" /><figcaption>Fig. 6 — Strategy Execution</figcaption></figure>
        <figure><img src="/dev/demo/7.png" width="1440" height="900" alt="X-Ray equity analysis in JORU" loading="lazy" /><figcaption>Fig. 7 — X-Ray Equity Analysis</figcaption></figure>
      </div>
    </section>
    <section>
      <h2>Offline Architecture &amp; Data Privacy</h2>
      <p>JORU is built as an offline-first desktop tool. Your trade history, notes, balance records, and broker API credentials remain stored on your machine in an embedded SQLite database. No third-party tracking, no cloud data leaks.</p>
      <p>For installation help or updates, join our <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram community</a> or email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
    </section>`
}

const pricingBody = (locale) => {
  if (locale === 'ru') {
    return `<h1>Тарифы дневника трейдера JORU: Free навсегда и Full</h1>
    <p>Начните с бесплатного тарифа Free без ограничений по времени. Переходите на Full, когда понадобятся углублённый детектив привычек Karl-Nikolai I, визуальная матрица Genesis и симуляции Монте-Карло.</p>
    <div class="legal-table">
      <table>
        <thead><tr><th>Возможность</th><th>Тариф Free ($0)</th><th>Тариф Full ($9.99 / мес)</th></tr></thead>
        <tbody>
          <tr><td>Стоимость</td><td><strong>Бесплатно навсегда</strong></td><td>$9.99 / месяц (через Patreon)</td></tr>
          <tr><td>Журнал сделок и реплей на свечах</td><td>Включено</td><td>Включено</td></tr>
          <tr><td>Скриншоты, теги и торговые заметки</td><td>Включено</td><td>Включено</td></tr>
          <tr><td>Метрики капитала, просадки и винрейт</td><td>Включено</td><td>Включено</td></tr>
          <tr><td>Форум сообщества и торговые события</td><td>Включено</td><td>Включено</td></tr>
          <tr><td>Автоматический импорт брокеров (MT5, Bybit, Binance, IBKR)</td><td>Базовый</td><td><strong>Полный автоматический</strong></td></tr>
          <tr><td>Детектив скрытых привычек Karl-Nikolai I</td><td>—</td><td><strong>Включено</strong></td></tr>
          <tr><td>Матрица торговой стратегии Genesis Matrix</td><td>—</td><td><strong>Включено</strong></td></tr>
          <tr><td>Симуляция риска методом Монте-Карло</td><td>—</td><td><strong>Включено</strong></td></tr>
          <tr><td>31 углублённая метрика и торговые отчёты</td><td>—</td><td><strong>Включено</strong></td></tr>
        </tbody>
      </table>
    </div>
    <p><a href="/ru/download" class="btn">Скачать бесплатно</a></p>
    <p>Подписка оформляется безопасно через Patreon и может быть отменена в любой момент. Ознакомьтесь с <a href="/ru/terms">Условиями использования</a> и <a href="/ru/privacy">Политикой конфиденциальности</a>.</p>`
  }

  return `<h1>JORU Trading Journal Plans &amp; Pricing</h1>
    <p>Start with the free plan with no time limits or trial expiration. Upgrade to Full whenever you need advanced pattern detection, Genesis Matrix strategy modeling, and Monte Carlo risk simulations.</p>
    <div class="legal-table">
      <table>
        <thead><tr><th>Feature</th><th>Free Plan ($0)</th><th>Full Plan ($9.99 / mo)</th></tr></thead>
        <tbody>
          <tr><td>Price</td><td><strong>Free Forever ($0)</strong></td><td>$9.99 / month (via Patreon)</td></tr>
          <tr><td>Trade Logging &amp; Candlestick Replay</td><td>Included</td><td>Included</td></tr>
          <tr><td>Screenshots, Notes &amp; Custom Tags</td><td>Included</td><td>Included</td></tr>
          <tr><td>Equity Curve, Drawdown &amp; Win Rate</td><td>Included</td><td>Included</td></tr>
          <tr><td>Community Forum &amp; Trading Events</td><td>Included</td><td>Included</td></tr>
          <tr><td>Broker Imports (MT5, Bybit, Binance, IBKR)</td><td>Basic</td><td><strong>Full Automated</strong></td></tr>
          <tr><td>Karl-Nikolai I Habit &amp; Pattern Detector</td><td>—</td><td><strong>Included</strong></td></tr>
          <tr><td>Genesis Matrix Visual Strategy Builder</td><td>—</td><td><strong>Included</strong></td></tr>
          <tr><td>Monte Carlo Risk Simulation (300 paths)</td><td>—</td><td><strong>Included</strong></td></tr>
          <tr><td>31 Deep Performance Metrics &amp; Reports</td><td>—</td><td><strong>Included</strong></td></tr>
        </tbody>
      </table>
    </div>
    <p><a href="/download" class="btn">Download Free Plan</a></p>
    <p>Subscriptions are securely managed through Patreon and can be cancelled at any time. Review our <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.</p>`
}

const aboutBody = (locale) => {
  if (locale === 'ru') {
    return `<h1>О проекте JORU — Аналитическое пространство и дневник трейдера</h1>
    <p><strong>JORU</strong> (также известный как ${BRAND_ALTERNATES.join(' и ')}) — это десктопный торговый журнал и рабочее пространство для трейдеров, которые стремятся построить системную торговлю на основе собственных данных, а не эмоций.</p>
    <p>Проект разработан независимым разработчиком Иваном Воробьём (Ivan Vorobei, Подгорица, Черногория). Цель JORU — предоставить трейдерам бескомпромиссный инструмент анализа, который превосходит стандартные электронные таблицы и защищает финансовую тайну лучше облачных веб-сервисов.</p>
    <section>
      <h2>Философия 100% приватности</h2>
      <p>В мире финансовой торговли данные о сделках — это ваше главное преимущество. Облачные журналы сделок хранят ваши ордера, объёмы, PnL и API-ключи на удалённых серверах, где они подвержены риску утечек и агрегации данных брокерами или сторонними компаниями.</p>
      <p>JORU построен по принципу <strong>offline-first</strong>: вся база данных SQLite хранится локально на вашем компьютере. Google Sign-In используется исключительно для подтверждения лицензии и авторизации в форуме; ваши сделки никогда не отправляются в облако.</p>
      <p>Вопросы или предложения: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> или в официальном <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram-сообществе</a>.</p>
    </section>`
  }

  return `<h1>About JORU — Private Desktop Trading Journal &amp; Analytics</h1>
    <p><strong>JORU</strong> (also known as ${BRAND_ALTERNATES.join(' and ')}) is a desktop trading journal and analytical workspace designed for traders who treat trading as an empirical discipline.</p>
    <p>Developed by Ivan Vorobei, an independent software engineer based in Podgorica, Montenegro. JORU was built out of frustration with clunky spreadsheets and invasive cloud SaaS journals that store sensitive financial history on third-party servers.</p>
    <section>
      <h2>The Offline-First Privacy Guarantee</h2>
      <p>Your trading history, sizing, and edge are confidential proprietary information. Cloud trade trackers store your executions, drawdown records, and API credentials on remote databases subject to breaches and data mining.</p>
      <p>JORU runs 100% offline using a local embedded SQLite database on your computer. Google Sign-In is only utilized to verify account status and forum participation; your trade data never leaves your disk.</p>
      <p>Questions or feedback: reach out at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or join the <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram community</a>.</p>
    </section>`
}

const pages = [
  { file: 'index.html', path: '/', body: homeBody('en'), locale: 'en' },
  { file: 'ru/index.html', path: '/ru/', body: homeBody('ru'), locale: 'ru' },
  { file: 'privacy.html', path: '/privacy', body: legalBody('Privacy Policy — JORU', 'privacy') },
  { file: 'ru/privacy.html', path: '/ru/privacy', body: legalBody('Политика конфиденциальности — JORU', 'privacy'), locale: 'ru' },
  { file: 'terms.html', path: '/terms', body: legalBody('Terms of Use — JORU', 'terms') },
  { file: 'ru/terms.html', path: '/ru/terms', body: legalBody('Условия использования — JORU', 'terms'), locale: 'ru' },
  { file: 'download.html', path: '/download', body: downloadBody('en'), locale: 'en' },
  { file: 'ru/download.html', path: '/ru/download', body: downloadBody('ru'), locale: 'ru' },
  { file: 'pricing.html', path: '/pricing', body: pricingBody('en'), locale: 'en' },
  { file: 'ru/pricing.html', path: '/ru/pricing', body: pricingBody('ru'), locale: 'ru' },
  { file: 'about.html', path: '/about', body: aboutBody('en'), locale: 'en' },
  { file: 'ru/about.html', path: '/ru/about', body: aboutBody('ru'), locale: 'ru' },
  { file: 'philosophy.html', path: '/about', body: aboutBody('en'), locale: 'en' },
  { file: 'ru/philosophy.html', path: '/ru/about', body: aboutBody('ru'), locale: 'ru' },
  { file: 'announcement.html', path: '/download', body: downloadBody('en'), locale: 'en' },
  { file: '404.html', path: null, body: `<h1>Page not found</h1><p>Return to the <a href="/">trading journal home page</a>.</p>` },
]

const setMeta = (html, pattern, content) => {
  if (!pattern.test(html)) throw new Error(`static-pages: ${pattern} not found in dist/index.html`)
  return html.replace(pattern, (_, before, after) => `${before}${escapeHtml(content)}${after}`)
}

const render = ({ path, body, locale = 'en' }) => {
  const seo = pageSeo(path || '', locale)
  const { title, description, keywords: pageKeywords, alternates } = seo
  let html = template
  html = html.replace('<html lang="en"', `<html lang="${locale}"`)
  html = setMeta(html, /(<title>)[^<]*(<\/title>)/, title)
  html = setMeta(html, /(<meta name="description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta name="keywords" content=")[^"]*(")/, pageKeywords || '')
  html = setMeta(html, /(<meta property="og:title" content=")[^"]*(")/, title)
  html = setMeta(html, /(<meta property="og:description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta property="og:image" content=")[^"]*(")/, SOCIAL_IMAGE)
  html = setMeta(html, /(<meta property="og:locale" content=")[^"]*(")/, locale === 'ru' ? 'ru_RU' : 'en_US')
  html = setMeta(html, /(<meta property="og:locale:alternate" content=")[^"]*(")/, locale === 'ru' ? 'en_US' : 'ru_RU')
  html = setMeta(html, /(<meta name="twitter:title" content=")[^"]*(")/, title)
  html = setMeta(html, /(<meta name="twitter:description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta name="twitter:image" content=")[^"]*(")/, SOCIAL_IMAGE)

  // Remove existing template hreflang alternate tags
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '')

  if (path) {
    html = setMeta(html, /(<link rel="canonical" href=")[^"]*(")/, `${SITE}${path}`)
    html = setMeta(html, /(<meta property="og:url" content=")[^"]*(")/, `${SITE}${path}`)

    // Inject accurate hreflang alternates for every indexed route
    if (alternates) {
      const altLinks = Object.entries(alternates)
        .map(([lang, url]) => `<link rel="alternate" hreflang="${lang}" href="${url}">`)
        .join('\n  ')
      html = html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n  ${altLinks}`)
    }
  } else {
    html = html
      .replace(/\s*<link rel="canonical"[^>]*>/, '')
      .replace(/\s*<meta property="og:url"[^>]*>/, '')
      .replace(/(<meta name="robots" content=")[^"]*(")/, '$1noindex$2')
  }

  if (!html.includes(APP_ROOT)) throw new Error('static-pages: #app root not found in dist/index.html')

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    alternateName: BRAND_ALTERNATES,
    url: `${SITE}/`,
    logo: `${SITE}/herb-white.svg`,
    email: CONTACT_EMAIL,
    founder: { '@type': 'Person', name: 'Ivan Vorobei' },
    sameAs: ['https://t.me/gandr_trade'],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    alternateName: 'JORU Trading Journal',
    url: `${SITE}/`,
    inLanguage: ['en', 'ru'],
  }

  const schemas = [organizationSchema, websiteSchema]

  if (path === '/' || path === '/ru/') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: BRAND,
      alternateName: BRAND_ALTERNATES,
      url: `${SITE}${path}`,
      description: locale === 'ru'
        ? 'JORU — автономный десктопный дневник трейдера и журнал сделок для Windows и macOS. Автоматический импорт сделок с бирж, реплей на свечном графике, 132 риск-метрики, матрица Genesis и симуляция Монте-Карло. 100% приватность.'
        : 'JORU is an offline desktop trading journal and analytics workspace for Windows and macOS. Automated broker imports, candlestick replay, 132 risk metrics, Genesis Matrix and Monte Carlo simulations. 100% private local storage.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Windows 10, Windows 11, macOS 12+ (Apple Silicon & Intel)',
      softwareVersion: '1.0.0',
      screenshot: SOCIAL_IMAGE,
      featureList: locale === 'ru' ? [
        'Импорт сделок: MetaTrader 5, Bybit, Binance, Kraken, Interactive Brokers',
        'Воспроизведение сделок на свечном графике с точками входа, стоп-лоссами и тейк-профитами',
        'Интеллектуальный поиск убыточных привычек Karl-Nikolai I',
        'Матрица торговой стратегии Genesis с узлами условий и профит-фактором',
        'Симуляция риска методом Монте-Карло (300 альтернативных путей капитала)',
        '31 глубокая метрика в 5 группах: следование стратегии, поведение, риск, исполнение',
        '100% локальное хранение данных в базе SQLite на компьютере'
      ] : [
        'Broker & exchange imports: MetaTrader 5, Bybit, Binance, Kraken, Interactive Brokers',
        'Candlestick chart replay with planned vs actual executions, stop-loss and take-profit points',
        'Karl-Nikolai I habit investigation algorithm to pinpoint hidden unprofitable patterns',
        'Genesis Matrix visual strategy builder tracking condition frequencies and profit factors',
        'Monte Carlo risk simulation running 300 reshuffled alternative equity curves',
        '31 in-depth metrics across 5 groups: matrix adherence, behavior, execution and risk',
        '100% offline local SQLite storage — trades and API keys never leave your machine'
      ],
      offers: [
        {
          '@type': 'Offer',
          name: locale === 'ru' ? 'Тариф Free (Бесплатный)' : 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          url: `${SITE}/pricing`,
          description: locale === 'ru' ? 'Бесплатный дневник сделок без ограничения по времени.' : 'Free trading journal with no time limit.'
        },
        {
          '@type': 'Offer',
          name: locale === 'ru' ? 'Тариф Full' : 'Full Plan',
          price: '9.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          url: `${SITE}/pricing`,
          description: locale === 'ru' ? 'Расширенная аналитика, детектив паттернов Karl-Nikolai, симуляция Монте-Карло.' : 'Advanced analytics, Karl-Nikolai pattern detector, Monte Carlo simulation.'
        }
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '58',
        bestRating: '5',
        worstRating: '1'
      }
    })

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems[locale].map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })

    schemas.push(...videoStructuredData(locale))
  }

  if (path) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: locale === 'ru' ? 'Главная' : 'Home', item: locale === 'ru' ? `${SITE}/ru/` : `${SITE}/` },
        ...(path !== '/' && path !== '/ru/' ? [{ '@type': 'ListItem', position: 2, name: title, item: `${SITE}${path}` }] : []),
      ],
    })
  }

  html = html.replace('</head>', `  ${schemas.map(schema => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`).join('\n  ')}\n</head>`)
  return html
    .replace('</head>', `  ${staticStyles}\n</head>`)
    .replace(APP_ROOT, `<div id="app" class="bg-white text-black">
  <div class="static-page">
    ${header(locale)}
    <main>
    ${body}
    </main>
    ${footer(locale)}
  </div>
</div>`)
}

// Render and write all static pages
for (const page of pages) {
  if (page.file.includes('/')) mkdirSync(`dist/${page.file.slice(0, page.file.lastIndexOf('/'))}`, { recursive: true })
  writeFileSync(`dist/${page.file}`, render(page))
}

// Generate robots.txt with Host directive (standard for Yandex) and clean crawling rules
writeFileSync('dist/robots.txt', `User-agent: *
Allow: /
Disallow: /dev/
Disallow: /dev1/

Host: ${SITE}
Sitemap: ${SITE}/sitemap.xml
`)

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const videoSitemapEntry = (locale) => homeVideos.map(video => `    <video:video>
      <video:thumbnail_loc>${SITE}${video.poster}</video:thumbnail_loc>
      <video:title>${escapeXml(video.name[locale] || video.name.en)}</video:title>
      <video:description>${escapeXml(video.description[locale] || video.description.en)}</video:description>
      <video:content_loc>${SITE}${video.src}</video:content_loc>
      <video:publication_date>${HOME_VIDEOS_UPLOAD_DATE}T00:00:00+00:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`).join('\n')

// Multilingual sitemap with xhtml:link alternates according to Google Search Central specifications
const sitemapUrls = indexedPaths.map(path => {
  const locale = path.startsWith('/ru') ? 'ru' : 'en'
  const isHome = path === '/' || path === '/ru/'
  const alternates = getAlternates(path) || { en: `${SITE}${path}`, ru: `${SITE}/ru${path}`, 'x-default': `${SITE}${path}` }
  const priority = isHome ? '1.0' : (path.includes('download') || path.includes('pricing') ? '0.9' : '0.8')
  const changefreq = isHome ? 'daily' : 'weekly'

  return `  <url>
    <loc>${SITE}${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${alternates.en}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${alternates.ru}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${alternates['x-default']}" />
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${isHome ? `\n${videoSitemapEntry(locale)}` : ''}
  </url>`
}).join('\n')

writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${sitemapUrls}
</urlset>
`)

// AI search engine documentation (llmstxt.org specification)
writeFileSync('dist/llms.txt', `# JORU — Desktop Trading Journal & Trade Analytics Workspace

> JORU is a private, offline-first desktop trading journal for Windows and macOS. It features automated broker imports (MetaTrader 5, Bybit, Binance, Kraken, Interactive Brokers), candlestick chart replay, the Karl-Nikolai I habit detection algorithm, Genesis Matrix strategy modeling, and Monte Carlo risk simulations.

## Quick Facts

- **Platforms**: Windows 10 & 11 (64-bit), macOS 12+ (Universal: Apple Silicon & Intel)
- **Pricing**: Free plan ($0 forever, no time limits); Full plan ($9.99/month via Patreon)
- **Data Privacy**: 100% offline local SQLite storage; trade data, notes, and exchange API keys never leave your machine
- **Supported Markets**: Crypto, Forex, Equities, Futures, Options

## Core Capabilities

1. **Candlestick Replay**: Visual replay of trade executions directly on historical price candles with planned vs. actual entry, stop-loss, take-profit, and exit conditions.
2. **Karl-Nikolai I Pattern Detector**: Tests condition pairs in trade history to discover quiet, costly habits (e.g. trading before 10:00, revenge trading) and ranks them by dollar impact.
3. **Genesis Matrix**: Node-based strategy visualizer mapping every condition's frequency and profit factor.
4. **Monte Carlo Engine**: Runs 300 reshuffled alternative equity curves to assess drawdown risk.
5. **31 Performance Metrics**: Sharpe, Sortino, Profit Factor, Win Rate, Expectancy, Recovery Factor, and matrix adherence.

## Key Links

- [Home Page](${SITE}/): Overview & interactive demonstration
- [Download](${SITE}/download): Free downloads for Windows and macOS
- [Pricing](${SITE}/pricing): Free forever vs Full tier comparison
- [About & Privacy](${SITE}/about): Offline architecture & data ownership
- [Full LLM Context](${SITE}/llms-full.txt): Deep technical & product documentation

## Contact & Community

- Email: ${CONTACT_EMAIL}
- Telegram: https://t.me/gandr_trade
`)

writeFileSync('dist/llms-full.txt', `# JORU Trading Journal — Full System Reference & Documentation

## Product Overview

JORU (also known as J. L. JÖRMUNGANDR) is a high-performance desktop trading journal application engineered for professional and systematic traders.

### Key Competitive Differentiators

Unlike cloud SaaS trade trackers (such as TradesViz, TraderSync, Tradervue, and Edgewonk Web):
1. **Complete Data Sovereignty**: All trade logs, screenshots, strategy notes, and API keys reside solely on the user's local disk in an embedded SQLite database. No financial data is ever transmitted, aggregated, or exposed to third-party data breaches.
2. **Zero Latency Performance**: Written as a native desktop application, filtering tens of thousands of trades and generating instant candlestick charts happens locally with zero web loading lag.
3. **Transparent Pricing**: A robust Free tier with zero time limits or artificial constraints, and a Full tier for $9.99/mo without hidden tiers.

## Feature Breakdown

### 1. Candlestick Trade Replay
- Displays the precise candles surrounding trade execution.
- Overlays planned setup parameters (Order Entry, Initial Stop Loss, Target Take Profit) against actual executions.
- Flags slippage, late fills, and execution discrepancies.

### 2. Karl-Nikolai I Habit & Pattern Detector
- Multi-variable anomaly detection algorithm that examines correlation across execution conditions.
- Examples of detected patterns:
  - "Short positions opened before 10:00 AM NY time decrease total expectancy by 18%."
  - "Trades taken within 15 minutes of a max-loss trade suffer a 72% loss rate."
- Allows traders to transform detected leaks into enforced rules with real-time compliance tracking.

### 3. Genesis Matrix Strategy Modeling
- Visual graph representation of trading setups.
- Nodes represent entry triggers, market contexts, and exit conditions.
- Real-time computation of condition frequency and profit factor per node.
- Version control for strategies: compare v1 vs v2 by Sharpe ratio, profit factor, and average R-multiple.

### 4. Monte Carlo Risk Simulator
- Generates 300 randomized path sequences from historical trade outcomes.
- Models worst-case drawdown probabilities at 95% and 99% confidence intervals.
- Calculates probability of account ruin and median expected outcome over subsequent trade sequences.

### 5. 31 Granular Performance Metrics
- **Matrix Adherence**: Rule adherence score, discretionary deviation rate.
- **Behavioral**: Revenge trade ratio, early exit penalty, overtrading coefficient.
- **Execution & Risk**: Profit Factor, Sharpe Ratio, Sortino Ratio, Calmar Ratio, Expectancy, Average R-multiple, Max Drawdown duration.
- **In-Trade Analysis**: Maximum Favorable Excursion (MFE), Maximum Adverse Excursion (MAE), Time in Trade.

### 6. Automated Broker Imports
- MetaTrader 5 (MT5): Direct statement import.
- Bybit: Futures & Spot automated API / CSV sync.
- Binance: USD-M, Coin-M, and Spot trade synchronization.
- Kraken: Exchange history integration.
- Interactive Brokers (IBKR): Flex query import.

## Supported Platforms
- **macOS**: macOS 12 (Monterey) or higher. Native Universal binary for Apple Silicon (M1, M2, M3, M4) and Intel x86_64.
- **Windows**: Windows 10 and Windows 11 (64-bit).

## Licensing & Pricing
- **Free Plan**: Free forever. Core journal, candlestick replay, screenshot attachments, tagging, equity and drawdown charts.
- **Full Plan**: $9.99/month. Unlocks Karl-Nikolai I pattern detector, Genesis Matrix strategy builder, Monte Carlo risk engine, and automated broker sync.
`)
