<template>
  <div
    class="relative w-full min-h-screen overflow-x-hidden flex flex-col select-none transition-all duration-1000 bg-black text-white/80"
    style="font-family: 'Cormorant Garamond', serif;"
  >
    <!-- Background Ambience -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
      <!-- Glow Gradients -->
      <div 
        class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 mix-blend-screen transition-all duration-1000"
        style="background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);"
      ></div>
      <div 
        class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 mix-blend-screen transition-all duration-1000"
        style="background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);"
      ></div>
    </div>

    <!-- Hero Section (First Viewport) -->
    <div class="hero-header relative flex w-full min-h-screen flex-col justify-between overflow-visible px-6 pt-4 pb-6 sm:px-10 sm:pt-6 sm:pb-10">
      <GradflowBackground class="hero-gradflow" preset="mystic" :config="gradflowConfig" />
      <div class="hero-gradient-fade" aria-hidden="true"></div>

      <!-- Header / Top Bar -->
        <header
          class="fixed left-0 right-0 top-0 z-[2147483647] flex w-full items-center justify-start px-6 pt-4 pb-4 text-[10px] tracking-[0.3em] sm:px-10 sm:pt-4 sm:pb-4 xl:px-8"
          :class="{ 'nav-open': isMegaMenuVisible, 'nav-scrolled': isNavScrolled }"
        >
        <div class="mx-auto flex w-full max-w-none items-center justify-start 2xl:max-w-[1280px]">
          <!-- Left Section: App Name -->
          <div class="flex items-center z-50">
            <router-link to="/" class="nav-logo" aria-label="J.L.JÖRMUNGANDR home">
              <div class="relative flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                <div class="absolute inset-0 border border-black/40 animate-[spin_10s_linear_infinite]"></div>
                <div class="absolute inset-1 border border-black/60 animate-[spin_6s_linear_infinite_reverse]"></div>
                <div class="h-1 w-1 rotate-45 bg-black animate-pulse"></div>
                <div class="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 border-l border-t border-black"></div>
                <div class="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border-b border-r border-black"></div>
              </div>
            </router-link>
          </div>

          <!-- Primary Navigation -->
          <nav class="ml-10 hidden items-center space-x-8 whitespace-nowrap font-serif text-[16px] tracking-[0.15rem] md:flex" style="font-family: 'Cormorant Garamond', serif;">
          <a href="#"
             @mouseenter="showMegaMenu('products')" @mouseleave="hideMegaMenu"
             class="nav-openai-font flex items-center transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">
            {{ t('landing.nav.products') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50 transition-transform duration-300" :class="{'rotate-180': isMegaMenuVisible && megaMenuType === 'products'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </a>
          <a href="#"
             @mouseenter="showMegaMenu('useCases')" @mouseleave="hideMegaMenu"
             class="nav-openai-font flex items-center transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">
            {{ t('landing.nav.useCases') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50 transition-transform duration-300" :class="{'rotate-180': isMegaMenuVisible && megaMenuType === 'useCases'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </a>
          <router-link to="/pricing" class="nav-openai-font transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/philosophy" class="nav-openai-font transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">{{ t('landing.nav.philosophy') }}</router-link>
          </nav>

          <router-link
            to="/announcement"
            class="nav-download-button ml-auto hidden md:flex items-center justify-center rounded-[25px] bg-black px-5 py-1.5 text-center transition-colors duration-200 hover:bg-neutral-900"
          >
            <span class="nav-openai-font">Попробовать</span>
            <svg class="ml-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 19L19 5M8 5h11v11" />
            </svg>
          </router-link>

          <!-- Right Section: Language Switcher -->
          <div class="hidden">
          <button 
            @click="setLocale('ru')"
            class="nav-openai-font nav-language-button transition-colors hover:text-white/50 cursor-pointer"
            :class="locale === 'ru' ? (isDark ? 'text-white font-bold' : 'text-[#2c2c2a] font-bold') : (isDark ? 'text-white/50' : 'text-[#2c2c2a]/50')"
          >
            ru
          </button>
          <span class="nav-openai-font nav-language-divider">/</span>
          <button 
            @click="setLocale('en')"
            class="nav-openai-font nav-language-button transition-colors hover:text-white/50 cursor-pointer"
            :class="locale === 'en' ? (isDark ? 'text-white font-bold' : 'text-[#2c2c2a] font-bold') : (isDark ? 'text-white/50' : 'text-[#2c2c2a]/50')"
          >
            en
          </button>
          </div>

          <MobileMenu class="ml-auto md:hidden" />
        </div>
      </header>

      <!-- Mega Menu Panel -->
      <div 
        @mouseenter="showMegaMenu"
        @mouseleave="hideMegaMenu"
        class="mega-menu-panel fixed top-14 left-0 z-40 w-full overflow-hidden transition-[opacity,transform] duration-500 sm:top-[56px]"
        :class="[
          isMegaMenuVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none',
          isMegaMenuVisible ? 'mega-menu-panel--open bg-black' : 'bg-transparent',
          isDark ? 'text-white' : 'text-[#2c2c2a]'
        ]"
      >
        <div class="max-w-7xl mx-auto px-6 sm:px-10 py-12 flex flex-col md:flex-row items-stretch gap-12">
          <!-- Left Side: Message -->
          <div class="flex-1 flex items-center md:pr-12">
            <transition name="fade-slide" mode="out-in">
              <h3 v-if="megaMenuType === 'products'" key="products-title" class="text-3xl lg:text-4xl font-light tracking-wide leading-snug" style="font-family: 'Cormorant Garamond', serif;">
                {{ t('landing.productsMenu.description') }}
              </h3>
              <h3 v-else key="usecases-title" class="text-3xl lg:text-4xl font-light tracking-wide leading-snug" style="font-family: 'Cormorant Garamond', serif;">
                {{ t('landing.useCasesMenu.description') }}
              </h3>
            </transition>
          </div>
          
          <!-- Divider -->
          <div class="hidden md:block w-[1px] opacity-20" :class="isDark ? 'bg-white' : 'bg-black'"></div>
          <div class="md:hidden h-[1px] w-full opacity-20" :class="isDark ? 'bg-white' : 'bg-black'"></div>
          
          <!-- Right Side: Content -->
          <div class="flex-1 md:pl-12 flex flex-col justify-center min-h-[128px]">
            <transition name="fade-slide" mode="out-in">
              <!-- Products Content -->
              <div v-if="megaMenuType === 'products'" key="products-list" class="flex flex-col space-y-8">
                <a href="/announcement" class="group flex items-center space-x-6 transition-all duration-300 hover:translate-x-2">
                  <div class="w-12 h-12 border flex items-center justify-center rounded-sm transition-colors duration-300 shrink-0" :class="isDark ? 'border-white/20 group-hover:border-white' : 'border-black/20 group-hover:border-black'">
                    <div class="w-3 h-3 rotate-45 border transition-colors duration-300" :class="isDark ? 'border-white' : 'border-black'"></div>
                  </div>
                  <div>
                    <div class="text-[16px] sm:text-[18px] tracking-[0.3em] mb-1 font-light uppercase" style="font-family: 'Cormorant Garamond', serif;">J.L.JÖRMUNGANDR</div>
                    <div class="text-[10px] font-mono tracking-widest opacity-50 uppercase">{{ t('landing.productsMenu.fullVersion') }}</div>
                  </div>
                </a>
                
                <a href="/announcement" class="group flex items-center space-x-6 transition-all duration-300 hover:translate-x-2">
                  <div class="w-12 h-12 border flex items-center justify-center rounded-sm transition-colors duration-300 shrink-0" :class="isDark ? 'border-white/20 group-hover:border-white' : 'border-black/20 group-hover:border-black'">
                    <div class="w-3 h-3 rotate-45 opacity-50 transition-colors duration-300" :class="isDark ? 'bg-white group-hover:bg-white' : 'bg-black group-hover:bg-black'"></div>
                  </div>
                  <div>
                    <div class="text-[16px] sm:text-[18px] tracking-[0.3em] mb-1 font-light uppercase opacity-70 group-hover:opacity-100 transition-opacity duration-300" style="font-family: 'Cormorant Garamond', serif;">J.L.JÖRMUNGANDR DEMO</div>
                    <div class="text-[10px] font-mono tracking-widest opacity-40 uppercase">{{ t('landing.productsMenu.freeDemo') }}</div>
                  </div>
                </a>
              </div>

              <!-- Use Cases Content -->
              <div v-else key="usecases-list" class="flex flex-col justify-center space-y-5">
                <router-link to="/use-cases?case=improve-trading-results" class="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div class="w-1.5 h-1.5 rotate-45 transition-colors duration-300 opacity-50 group-hover:opacity-100" :class="isDark ? 'bg-white' : 'bg-black'"></div>
                  <div class="text-[16px] sm:text-[18px] tracking-[0.1em] font-light opacity-80 group-hover:opacity-100 transition-opacity" style="font-family: 'Cormorant Garamond', serif;">
                    {{ t('landing.useCasesMenu.improveTradingResults') }}
                  </div>
                </router-link>
                <router-link to="/use-cases?case=create-trading-system" class="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div class="w-1.5 h-1.5 rotate-45 transition-colors duration-300 opacity-50 group-hover:opacity-100" :class="isDark ? 'bg-white' : 'bg-black'"></div>
                  <div class="text-[16px] sm:text-[18px] tracking-[0.1em] font-light opacity-80 group-hover:opacity-100 transition-opacity" style="font-family: 'Cormorant Garamond', serif;">
                    {{ t('landing.useCasesMenu.createTradingSystem') }}
                  </div>
                </router-link>
                <router-link to="/use-cases?case=content-creator" class="group flex items-center space-x-4 transition-all duration-300 hover:translate-x-2">
                  <div class="w-1.5 h-1.5 rotate-45 transition-colors duration-300 opacity-50 group-hover:opacity-100" :class="isDark ? 'bg-white' : 'bg-black'"></div>
                  <div class="text-[16px] sm:text-[18px] tracking-[0.1em] font-light opacity-80 group-hover:opacity-100 transition-opacity" style="font-family: 'Cormorant Garamond', serif;">
                    {{ t('landing.useCasesMenu.contentCreator') }}
                  </div>
                </router-link>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Animated Tagline Section -->
      <main class="flex-1 flex flex-col items-center justify-center py-10 my-auto z-50 relative min-h-[300px] transition-all duration-500"
            :class="isMegaMenuVisible ? 'opacity-0 blur-sm scale-95 pointer-events-none' : 'opacity-100 blur-0 scale-100'">
        
        <!-- MAIN CONTENT -->
        <div 
          v-show="heroAnimationState >= 2"
          class="flex flex-col items-center justify-center w-full space-y-6"
        >
          <div
            class="hero-signature mb-2 h-8 w-36 overflow-hidden opacity-0 transition-all duration-1000 ease-out sm:h-9 sm:w-44"
            :class="heroAnimationState >= 3 ? 'translate-y-0 opacity-80' : 'translate-y-4'"
            aria-hidden="true"
          >
            <img src="/assets/signature.svg" alt="" class="h-full w-full object-cover object-center" />
          </div>

          <div
            class="mb-0 text-center text-2xl sm:text-4xl lg:text-5xl font-light uppercase tracking-[0.4em] transition-all duration-1000 ease-out"
            :class="heroAnimationState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
            style="font-family: 'Cormorant Garamond', serif;"
          >
            J.L.JÖRMUNGANDR
          </div>

          <div
            class="!mt-8 w-4/5 max-w-[720px] transition-all duration-1000 ease-out"
            :class="heroAnimationState >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'"
          >
            <ExDivider variant="tactical" spacing="none" />
          </div>

          <div class="hero-tagline openai-typeface text-center leading-snug mb-12" :class="isDark ? 'text-white' : 'text-[#2c2c2a]'">
            {{ typedLine1 }}<span v-if="heroAnimationState === 2 && !typedLine2.length && typedLine1 !== t('landing.heroTitleLine1')" class="animate-pulse">|</span>
            <template v-if="t('landing.heroTitleLine2') && (typedLine2.length > 0 || heroAnimationState === 2)">
              <br>
              {{ typedLine2 }}<span v-if="heroAnimationState === 2 && typedLine1 === t('landing.heroTitleLine1')" class="animate-pulse">|</span>
            </template>
          </div>

          <!-- OS Specific Download Button (Desktop) -->
          <router-link
            to="/announcement"
            class="download-button hidden md:flex cursor-pointer items-center justify-center rounded-[25px] px-8 py-2 text-center transition-colors duration-200 group bg-black text-white shadow-md border border-white/10 hover:bg-neutral-950"
            :class="heroAnimationState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
          >
            <template v-if="os === 'mac'">
              <span class="nav-openai-font">{{ t('landing.downloadMac') }}</span>
            </template>
            <template v-else>
              <span class="nav-openai-font">{{ t('landing.downloadWindows') }}</span>
            </template>
          </router-link>

          <!-- Mobile Hint Button (Open on Computer) -->
          <div
            class="mobile-open-computer flex md:hidden items-center justify-center rounded-[25px] px-6 py-2.5 text-center transition-all duration-300 pointer-events-none select-none bg-black/10 border border-black/10 backdrop-blur-md dark:bg-white/10 dark:border-white/15"
            :class="heroAnimationState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          >
            <span class="nav-openai-font text-[13px] sm:text-[14px] font-normal tracking-tight opacity-70">
              {{ t('landing.openOnComputer') }}
            </span>
          </div>
        </div>
      </main>

      <!-- Main Content Area (Commented Out) -->
      <!--
      <main class="flex-1 flex flex-col items-center justify-center py-10 my-auto">
        <!- ── ENTRY PORTAL STATE ── ->
        <div class="flex flex-col items-center space-y-12 max-w-xl w-full text-center">
          
          <!- Animated Core Icon ->
          <div 
            class="group relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center cursor-pointer select-none shrink-0 transition-transform duration-700 hover:scale-105"
            @click="scrollToFeatures"
          >
            <!- Outer Ring ->
            <div 
              class="absolute inset-0 border-2 rounded-none transition-colors duration-1000"
              :class="isDark ? 'border-white/20 group-hover:border-black' : 'border-black/10 group-hover:border-black'"
              style="animation: spin 12s linear infinite;"
            ></div>
            <!- Inner Ring ->
            <div 
              class="absolute inset-4 border rounded-none transition-colors duration-1000"
              :class="isDark ? 'border-white/40 group-hover:border-black' : 'border-black/20 group-hover:border-black'"
              style="animation: spin 8s linear infinite reverse;"
            ></div>
            <!- Pulsing Diamond Core ->
            <div 
              class="w-3.5 h-3.5 rotate-45 animate-pulse transition-colors duration-1000"
              :class="isDark ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-[#2c2c2a] shadow-[0_0_8px_rgba(0,0,0,0.3)]'"
            ></div>
            <!- Corner Brackets ->
            <div class="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2 transition-colors duration-700" :class="isDark ? 'border-white group-hover:border-black' : 'border-slate-800 group-hover:border-black'"></div>
            <div class="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2 transition-colors duration-700" :class="isDark ? 'border-white group-hover:border-black' : 'border-slate-800 group-hover:border-black'"></div>
            <div class="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2 transition-colors duration-700" :class="isDark ? 'border-white group-hover:border-black' : 'border-slate-800 group-hover:border-black'"></div>
            <div class="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2 transition-colors duration-700" :class="isDark ? 'border-white group-hover:border-black' : 'border-slate-800 group-hover:border-black'"></div>
          </div>

          <!- Identity and Platform Description ->
          <div class="space-y-4 px-4">
            <h1 
              class="text-4xl sm:text-6xl tracking-[0.4em] uppercase font-light animate-glitch"
              :class="isDark ? 'text-white' : 'text-black/90'"
            >
              J.L.Jörmungandr
            </h1>
            <p 
              class="text-[9px] sm:text-[10px] font-mono tracking-[0.6em] uppercase opacity-40 transition-opacity hover:opacity-75"
              :class="isDark ? 'text-white' : 'text-black/90'"
            >
              Universal_Analytical_Platform
            </p>
          </div>

          <!- Description and Portal Actions ->
          <div class="w-full max-w-sm space-y-8 px-6">
            <p class="text-[12px] sm:text-[14px] leading-relaxed font-sans opacity-60 font-light italic">
              "Architect and simulate your trading strategies with unprecedented visual precision."
            </p>
            
            <div class="flex flex-col space-y-4">
              <button
                @click="scrollToFeatures"
                class="relative cursor-pointer overflow-hidden w-full py-4 text-[10px] font-mono tracking-[0.5em] uppercase font-bold border transition-all duration-300 group/btn"
                :class="isDark 
                  ? 'bg-white text-black border-white hover:bg-transparent hover:text-white' 
                  : 'bg-black/90 text-white border-[#2c2c2a] hover:bg-transparent hover:text-[#2c2c2a]'"
              >
                <span class="relative z-10">EXPLORE</span>
                <span 
                  class="absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out z-0"
                  :class="isDark ? 'bg-black' : 'bg-[#f8f9fa]'"
                ></span>
              </button>
            </div>
          </div>
        </div>
      </main>
      -->


    </div>

    <!-- Interactive application demonstration -->
    <section class="home-equity-demo relative z-10 w-full px-6 pt-10 pb-16 sm:px-10 sm:pt-14 lg:pt-16 lg:pb-24">
      <div class="mx-auto w-full max-w-[1240px] text-center">
        <div class="mb-10 sm:mb-14">
          <h2 class="text-sm sm:text-base lg:text-lg font-light tracking-[0.3em] uppercase text-white/80" style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;">
            {{ t('landing.videoShowcase.mt5Integration') }}
          </h2>
        </div>
        <VideoShowcase />
      </div>
    </section>

    <!-- Features Section -->
    <section 
      ref="featuresSection" 
      class="home-features relative z-10 w-full max-w-7xl mx-auto py-32 px-6 sm:px-10"
    >
      <!-- Section Header -->
      <div class="text-start space-y-6 max-w-4xl pb-16 lg:pb-24">
        <h2 
          class="text-2xl sm:text-3xl lg:text-4xl font-light leading-snug tracking-wide"
          :class="isDark ? 'text-white' : 'text-[#2c2c2a]'"
        >
          {{ t('landing.features.title') }}
        </h2>
      </div>

      <div class="features-grid" aria-label="Application features">
        <article class="feature-grid-card">
          <span class="feature-grid-card__index">01</span>
          <h3>{{ t('landing.features.genesis.title') }}</h3>
          <p>{{ t('landing.features.genesis.desc') }}</p>
        </article>

        <article class="feature-grid-card">
          <span class="feature-grid-card__index">02</span>
          <h3>{{ t('landing.features.tradesTree.title') }}</h3>
          <p>{{ t('landing.features.tradesTree.desc') }}</p>
        </article>

        <article class="feature-grid-card">
          <span class="feature-grid-card__index">03</span>
          <h3>{{ t('landing.features.equity.title') }}</h3>
          <p>{{ t('landing.features.equity.desc') }}</p>
        </article>

        <article class="feature-grid-card">
          <span class="feature-grid-card__index">04</span>
          <h3>{{ t('landing.features.forum.title') }}</h3>
          <p>{{ t('landing.features.forum.desc') }}</p>
        </article>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'
import GradflowBackground from './GradflowBackground.vue'
import ExDivider from '../shared/ui/ExDivider.vue'
import AppFooter from './AppFooter.vue'
import VideoShowcase from './VideoShowcase.vue'
import MobileMenu from './MobileMenu.vue'

const { t, locale, setLocale } = useI18n()

const gradflowConfig = {
  color1: { r: 2, g: 145, b: 135 },
  color2: { r: 165, g: 249, b: 193 },
  color3: { r: 153, g: 151, b: 231 },
  speed: 0.5,
  scale: 2,
  type: 'smoke',
  noise: 0.22,
}

const os = ref('unknown')

onMounted(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.indexOf('win') !== -1) {
    os.value = 'windows'
  } else if (userAgent.indexOf('mac') !== -1) {
    os.value = 'mac'
  } else {
    os.value = 'other'
  }

  runHeroAnimation()
})

const isMegaMenuVisible = ref(false)
let megaMenuTimeout = null
const megaMenuType = ref('products')
const isMobileMenuOpen = ref(false)
const mobileMenuSection = ref(null)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (!isMobileMenuOpen.value) mobileMenuSection.value = null
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  mobileMenuSection.value = null
}

const toggleMobileSection = (section) => {
  mobileMenuSection.value = mobileMenuSection.value === section ? null : section
}

const showMegaMenu = (type) => {
  if (megaMenuTimeout) clearTimeout(megaMenuTimeout)
  if (typeof type === 'string') {
    megaMenuType.value = type
  }
  isMegaMenuVisible.value = true
}

const hideMegaMenu = () => {
  megaMenuTimeout = setTimeout(() => {
    isMegaMenuVisible.value = false
  }, 150)
}

const isDark = ref(true)
const isNavScrolled = ref(false)
const featuresSection = ref(null)

const demoTrades = Array.from({ length: 30 }, (_, index) => {
  let seed = 173 + index * 97
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const side = index % 3 === 0 ? 'Short' : 'Long'
  const asset = ['EURUSD', 'BTCUSD', 'XAUUSD', 'NAS100', 'GBPUSD'][index % 5]
  const entryPrice = asset === 'BTCUSD' ? 58000 + random() * 8000 : asset === 'XAUUSD' ? 2280 + random() * 180 : 1 + random() * 180
  const pnl = Math.round((random() - 0.4) * 720)
  const date = new Date('2026-01-08T09:00:00Z')
  date.setDate(date.getDate() + index * 3)
  return {
    id: `demo-trade-${String(index + 1).padStart(2, '0')}`,
    strategyId: 'DEMO-001',
    asset,
    assetType: asset === 'BTCUSD' ? 'Crypto' : asset === 'XAUUSD' ? 'Metals' : asset === 'NAS100' ? 'Stocks' : 'Forex',
    side,
    status: 'closed',
    isClosed: true,
    entryPrice: Number(entryPrice.toFixed(4)),
    exitPrice: Number((entryPrice * (1 + (pnl >= 0 ? 1 : -1) * (0.002 + random() * 0.012))).toFixed(4)),
    date: date.toISOString(),
    result: Number((pnl / 100).toFixed(2)),
    resultUnit: '%',
    profitInCurrency: pnl,
    profitInPercent: Number((pnl / 100).toFixed(2)),
  }
})

// Animation logic
const heroAnimationState = ref(2)
const typedLine1 = ref('')
const typedLine2 = ref('')

const typeText = async (text, refVar, speed = 50) => {
  refVar.value = ''
  for (let i = 0; i < text.length; i++) {
    refVar.value += text[i]
    await new Promise(r => setTimeout(r, speed))
  }
}

const runHeroAnimation = async () => {
  heroAnimationState.value = 2
  typedLine1.value = ''
  typedLine2.value = ''

  heroAnimationState.value = 2
  await typeText(t('landing.heroTitleLine1'), typedLine1, 30)
  await new Promise(r => setTimeout(r, 200))
  await typeText(t('landing.heroTitleLine2'), typedLine2, 30)
  await new Promise(r => setTimeout(r, 400))
  
  // State 3: Final show logo & button
  heroAnimationState.value = 3
}

import { watch, onUnmounted } from 'vue'
watch(() => locale.value, () => {
  if (heroAnimationState.value >= 3) {
    typedLine1.value = t('landing.heroTitleLine1')
    typedLine2.value = t('landing.heroTitleLine2')
  }
})

// Removed dynamic body background sync to keep the scrollbar container background permanently dark

let scrollTimeout = null
const handleScroll = () => {
  isNavScrolled.value = window.scrollY > 8
  document.body.classList.add('is-scrolling')
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove('is-scrolling')
  }, 800) // hide after 800ms

}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})

// Animation logic removed

const toggleTheme = () => {
  isDark.value = !isDark.value
}

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap');

/* Keep the foreground readable over the light Gradflow hero. */
.hero-header > header *:not(.mobile-menu-root):not(.mobile-menu-root *):not(.mobile-menu):not(.mobile-menu *),
.hero-header > main *,
.hero-header > .absolute:not(.gradflow-background):not(.mobile-menu) * {
  color: #050505;
}

.hero-header > header {
  background-color: transparent;
  transition: background-color 200ms ease;
}

.hero-header > header .nav-openai-font,
.hero-header > header .nav-language-divider {
  color: #050505 !important;
  opacity: 1 !important;
}

.hero-header > header .nav-language-button {
  opacity: 0.28 !important;
  transition: opacity 180ms ease;
}

.hero-header > header .nav-language-button.font-bold {
  opacity: 0.96 !important;
}

.hero-header > header .nav-openai-font svg {
  color: #050505 !important;
  opacity: 1 !important;
  stroke: #050505 !important;
}

.hero-header > header .nav-openai-font svg path {
  stroke: #050505 !important;
}

.hero-header > header .nav-download-button,
.hero-header > header .nav-download-button * {
  color: #fff !important;
}

.hero-header > header .nav-download-button .nav-openai-font {
  font-weight: 300 !important;
}

.hero-header > header .nav-logo {
  filter: none;
}

.hero-header > header:hover,
.hero-header > header.nav-open {
  background-color: #000;
}

.hero-header > header:hover .nav-openai-font,
.hero-header > header:hover .nav-language-divider,
.hero-header > header.nav-open .nav-openai-font,
.hero-header > header.nav-open .nav-language-divider {
  color: #f5f5f0 !important;
}

.hero-header > header:hover .nav-openai-font svg,
.hero-header > header.nav-open .nav-openai-font svg {
  color: #f5f5f0 !important;
  stroke: #f5f5f0 !important;
}

.hero-header > header:hover .nav-openai-font svg path,
.hero-header > header.nav-open .nav-openai-font svg path {
  stroke: #f5f5f0 !important;
}

.hero-header > header:hover .nav-download-button,
.hero-header > header:hover .nav-download-button *,
.hero-header > header.nav-open .nav-download-button,
.hero-header > header.nav-open .nav-download-button * {
  color: #000 !important;
}

.hero-header > header:hover .nav-download-button,
.hero-header > header.nav-open .nav-download-button {
  background-color: #fff !important;
}

.hero-header > header:hover .nav-logo,
.hero-header > header.nav-open .nav-logo {
  filter: invert(1);
}

.hero-header > header.nav-scrolled {
  background-color: #000 !important;
  isolation: isolate;
  z-index: 2147483647;
}

.hero-header > header.nav-scrolled .nav-openai-font,
.hero-header > header.nav-scrolled .nav-language-divider {
  color: #f5f5f0 !important;
}

.hero-header > header.nav-scrolled .nav-openai-font svg {
  color: #f5f5f0 !important;
  stroke: #f5f5f0 !important;
}

.hero-header > header.nav-scrolled .nav-openai-font svg path {
  stroke: #f5f5f0 !important;
}

.hero-header > header.nav-scrolled .nav-download-button,
.hero-header > header.nav-scrolled .nav-download-button * {
  color: #000 !important;
}

.hero-header > header.nav-scrolled .nav-download-button {
  background-color: #fff !important;
}

.hero-header > header.nav-scrolled .nav-logo {
  filter: invert(1);
}

.hero-header > header:hover :deep(.mobile-menu__trigger span),
.hero-header > header.nav-open :deep(.mobile-menu__trigger span),
.hero-header > header.nav-scrolled :deep(.mobile-menu__trigger span) {
  background-color: #f5f5f0 !important;
}

.hero-header > header:hover .nav-download-button .nav-openai-font,
.hero-header > header.nav-open .nav-download-button .nav-openai-font,
.hero-header > header.nav-scrolled .nav-download-button .nav-openai-font {
  color: #000 !important;
}

.hero-gradflow {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 140vh;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.92) 42%,
    rgba(0, 0, 0, 0.78) 54%,
    rgba(0, 0, 0, 0.58) 66%,
    rgba(0, 0, 0, 0.36) 78%,
    rgba(0, 0, 0, 0.16) 88%,
    rgba(0, 0, 0, 0.03) 96%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.92) 42%,
    rgba(0, 0, 0, 0.78) 54%,
    rgba(0, 0, 0, 0.58) 66%,
    rgba(0, 0, 0, 0.36) 78%,
    rgba(0, 0, 0, 0.16) 88%,
    rgba(0, 0, 0, 0.03) 96%,
    transparent 100%
  );
}

.hero-header {
  padding-top: 56px;
}

.hero-gradient-fade {
  position: absolute;
  top: 25vh;
  right: 0;
  left: 0;
  height: 115vh;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.02) 8%,
    rgba(0, 0, 0, 0.06) 16%,
    rgba(0, 0, 0, 0.13) 24%,
    rgba(0, 0, 0, 0.23) 32%,
    rgba(0, 0, 0, 0.36) 41%,
    rgba(0, 0, 0, 0.51) 50%,
    rgba(0, 0, 0, 0.67) 60%,
    rgba(0, 0, 0, 0.81) 71%,
    rgba(0, 0, 0, 0.92) 82%,
    rgba(0, 0, 0, 0.98) 92%,
    #000000 100%
  );
}

.hero-header > main .download-button,
.hero-header > main .download-button * {
  color: #fff !important;
}

.hero-header > main .download-button .nav-openai-font {
  font-weight: 300 !important;
}

.nav-openai-font {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif !important;
  font-size: 0.95rem;
  font-weight: 400 !important;
  letter-spacing: -0.01em;
}

.openai-typeface {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif !important;
  font-size: 0.95rem;
  font-weight: 400 !important;
  letter-spacing: -0.01em;
}

.hero-tagline {
  font-size: 1.2rem;
}

.nav-language-button {
  opacity: 0.32;
  transition: opacity 180ms ease;
}

.nav-language-button.is-active {
  opacity: 0.96;
}

@media (min-width: 768px) {
  .hero-header > header nav:has(.nav-openai-font:hover) .nav-openai-font {
    opacity: 0.38 !important;
  }

  .hero-header > header nav:has(.nav-openai-font:hover) .nav-openai-font:hover {
    opacity: 1 !important;
  }
}

.nav-logo {
  display: inline-flex;
  align-items: center;
}

.mega-menu-panel--open,
.mega-menu-panel--open * {
  color: #f5f5f0 !important;
}

@media (min-width: 768px) {
  .hero-header {
    padding-top: 72px;
  }

  .hero-header > header.nav-open {
    background-color: #000;
  }

  .hero-header > header.nav-open .nav-openai-font {
    color: #f5f5f0 !important;
    opacity: 1 !important;
    transition: none !important;
  }

  .hero-header > header.nav-open .nav-logo {
    filter: invert(1);
  }
}

/* Digital Grid Backgrounds */
.grid-dark {
  background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
  background-size: 24px 24px;
}
.grid-light {
  background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

@keyframes sweep { 
  from { transform: rotate(-35deg) translateX(-100%); } 
  to { transform: rotate(-35deg) translateX(500%); } 
}
.animate-sweep {
  animation: sweep 10s linear infinite;
}

/* Animations */

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
.animate-scan {
  animation: scan 6s linear infinite;
}

@keyframes glitch-interval {
  0%, 2%, 98%, 100% { 
    transform: translate(0); 
    text-shadow: none; 
    opacity: 1; 
  }
  0.4% { 
    transform: translate(-3px, 1px) skewX(2deg); 
    opacity: 0.95; 
    text-shadow: 2px 0px rgba(14, 165, 233, 0.6), -2px 0px rgba(139, 92, 246, 0.6); 
  }
  0.8% { 
    transform: translate(2px, -1px) skewX(-2deg); 
    opacity: 0.98; 
    text-shadow: -2px 0px rgba(14, 165, 233, 0.6), 2px 0px rgba(139, 92, 246, 0.6); 
  }
  1.2% { 
    transform: translate(-1px, 2px) skewX(1deg); 
    opacity: 0.95; 
  }
  1.6% { 
    transform: translate(1px, -2px) skewX(-1deg); 
    opacity: 0.98; 
  }
}
.animate-glitch {
  animation: glitch-interval 8s infinite;
}

/* Transition Animations */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(4px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  filter: blur(4px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.mobile-menu-trigger {
  display: flex;
  width: 28px;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

@media (min-width: 768px) {
  .mobile-menu-trigger {
    display: none;
  }
}

.mobile-menu-trigger span {
  display: block;
  width: 100%;
  height: 1px;
  background: currentColor;
}

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow-y: auto;
  background: #000;
  color: white;
}

.mobile-menu__panel {
  display: flex;
  width: min(100%, 560px);
  min-height: 100%;
  margin: 0 auto;
  padding: 24px;
  flex-direction: column;
}

.mobile-menu__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
}

.mobile-menu__close {
  color: white;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 200;
  line-height: 1;
}

.mobile-menu__nav {
  display: flex;
  margin-top: 64px;
  flex-direction: column;
}

.mobile-menu__group,
.mobile-menu__link {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.mobile-menu__parent,
.mobile-menu__link {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  color: white;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.55rem;
  font-weight: 300;
  letter-spacing: 0.03em;
  text-align: left;
}

.mobile-menu__parent svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.52);
  transition: transform 180ms ease;
}

.mobile-menu__parent svg.is-expanded {
  transform: rotate(180deg);
}

.mobile-menu__children {
  display: flex;
  padding: 0 0 18px 18px;
  flex-direction: column;
  gap: 18px;
}

.mobile-menu__children a {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: rgba(255, 255, 255, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  line-height: 1.35;
}

.mobile-menu__children small {
  color: rgba(255, 255, 255, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mobile-menu__locale {
  display: flex;
  margin-top: auto;
  padding-top: 48px;
  align-items: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.35);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
}

.mobile-menu__locale button {
  color: rgba(255, 255, 255, 0.45);
}

.mobile-menu__locale button.is-active {
  color: white;
  font-weight: 700;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.feature-grid-card {
  display: grid;
  min-height: 218px;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 13px;
  align-content: start;
  padding: clamp(38px, 5vh, 64px) clamp(20px, 3vw, 40px) clamp(38px, 5vh, 64px) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.feature-grid-card:nth-child(odd) {
  padding-right: clamp(28px, 4vw, 64px);
  border-right: 1px solid rgba(255, 255, 255, 0.14);
}

.feature-grid-card:nth-child(even) {
  padding-left: clamp(28px, 4vw, 64px);
}

.feature-grid-card__index {
  display: block;
  padding-top: 7px;
  color: rgba(255, 255, 255, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.feature-grid-card h3 {
  color: white;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2rem, 3.2vw, 3.25rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 0.95;
}

.feature-grid-card p {
  grid-column: 2;
  max-width: 420px;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.58);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

@media (max-width: 767px) {
  .home-features {
    padding-right: 24px;
    padding-left: 24px;
    padding-top: 88px;
    padding-bottom: 88px;
    row-gap: 96px;
  }

  .home-features h2,
  .home-features h3,
  .home-features p {
    width: 100%;
    max-width: none;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-grid-card {
    min-height: 0;
    display: grid;
    padding: 30px 32px 34px 0;
    border-right: 0;
  }

  .feature-grid-card:nth-child(odd),
  .feature-grid-card:nth-child(even) {
    padding-right: 36px;
    padding-left: 0;
  }

  .feature-grid-card p {
    margin-top: 10px;
    font-size: 12px;
  }

}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
