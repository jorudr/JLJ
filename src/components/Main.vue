<template>
  <div
    class="relative w-full min-h-screen overflow-x-hidden flex flex-col select-none transition-all duration-1000"
    :class="isDark ? 'theme-dark bg-[#070708] text-white/80' : 'theme-light bg-[#FFFFFF] text-[#2c2c2a]'"
    style="font-family: 'Cormorant Garamond', serif;"
  >
    <!-- Background Ambience -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <!-- Ethereal Background (Light Theme) -->
      <div class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
           :style="{ 
             backgroundImage: 'url(\'/assets/white_ethereal_bg.png\')',
             filter: 'blur(20px) brightness(1.1) contrast(0.9)',
             opacity: !isDark ? 0.2 : 0
           }"></div>

      <!-- Glow Gradients -->
      <div 
        class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 mix-blend-screen transition-all duration-1000"
        :style="{ background: isDark ? 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)' }"
      ></div>
      <div 
        class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 mix-blend-screen transition-all duration-1000"
        :style="{ background: isDark ? 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)' }"
      ></div>
      
      <!-- Digital Grid -->
      <div 
        class="absolute inset-0 opacity-10 transition-opacity duration-1000"
        :class="isDark ? 'grid-dark' : 'grid-light'"
      ></div>

      <!-- Dot Grid (app1.1 style) -->
      <div class="absolute inset-0 pointer-events-none transition-opacity duration-1000" 
           :style="{ backgroundImage: 'radial-gradient(#2c2c2a 0.5px, transparent 0.5px)', backgroundSize: '30px 30px', opacity: !isDark ? 0.05 : 0 }"></div>

      <!-- Light Sweep (only in light mode) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000" :style="{ opacity: !isDark ? 1 : 0 }">
        <div class="absolute top-[-100%] left-[-50%] w-[20%] h-[300%] origin-center animate-sweep"
             style="background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);"></div>
      </div>

      <!-- Cinematic Vignette -->
      <div class="absolute inset-0 pointer-events-none transition-opacity duration-1000"
           :style="{ background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%)', opacity: !isDark ? 1 : 0 }"></div>
    </div>



    <!-- Geometric Background Elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-1000" :class="isDark ? 'opacity-40' : 'opacity-60'">
        <!-- Tesseract / 3D Wireframe -->
        <div class="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border" :class="isDark ? 'border-white/10' : 'border-black/20'">
           <div class="absolute inset-12 rotate-45 border" :class="isDark ? 'border-white/5' : 'border-black/15'"></div>
           <div class="absolute inset-24 -rotate-12 border" :class="isDark ? 'border-white/5' : 'border-black/15'"></div>
           <div class="absolute inset-36 rotate-12 border" :class="isDark ? 'border-white/5' : 'border-black/15'"></div>
        </div>

        <!-- Floating Squares / Tesseracts -->
        <div class="absolute top-[5%] left-1/4 -translate-x-1/2 w-32 h-32 rotate-12 border" :class="isDark ? 'border-white/20' : 'border-black/30'"></div>
        <div class="absolute top-[25%] right-1/4 translate-x-1/2 w-48 h-48 -rotate-45 border" :class="isDark ? 'border-white/10' : 'border-black/20'"></div>

        <!-- Geometric Pulse Circles -->
        <div class="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] rounded-full border" :class="isDark ? 'border-white/[0.03]' : 'border-black/10'"></div>
        <div class="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border" :class="isDark ? 'border-white/[0.02]' : 'border-black/5'"></div>
        
        <!-- Tactical Grid Accents -->
        <div class="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,currentColor_1px,transparent_1px)] bg-[length:64px_64px]"></div>
    </div>

    <!-- Hero Section (First Viewport) -->
    <div class="w-full min-h-screen flex flex-col justify-between px-6 pt-4 pb-6 sm:px-10 sm:pt-6 sm:pb-10 relative z-10">
      <!-- Header / Top Bar -->
      <header class="w-full flex justify-between items-center text-[10px] tracking-[0.3em] relative">
        <!-- Left Section: App Name & Navigation -->
        <div class="flex items-center space-x-8 md:space-x-12 z-50">
          <!-- App Name & Logo -->
          <div class="flex items-center space-x-6 cursor-pointer">
            <div class="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
              <div class="absolute inset-0 border animate-[spin_10s_linear_infinite]" :class="isDark ? 'border-white/40' : 'border-[#2c2c2a]/40'"></div>
              <div class="absolute inset-1 border animate-[spin_6s_linear_infinite_reverse]" :class="isDark ? 'border-white/60' : 'border-[#2c2c2a]/60'"></div>
              <div class="w-1 h-1 rotate-45 animate-pulse" :class="isDark ? 'bg-white' : 'bg-[#2c2c2a]'"></div>
              <div class="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l" :class="isDark ? 'border-white' : 'border-[#2c2c2a]'"></div>
              <div class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r" :class="isDark ? 'border-white' : 'border-[#2c2c2a]'"></div>
            </div>
            <span 
              class="text-[12px] sm:text-[14px] tracking-[0.5em] font-light uppercase"
              :class="isDark ? 'text-white' : 'text-[#2c2c2a]'"
              style="font-family: 'Cormorant Garamond', serif;"
            >
              J.L.JÖRMUNGANDR
            </span>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center font-serif space-x-8 text-[16px] tracking-[0.15rem]"   style="font-family: 'Cormorant Garamond', serif;">
            <a href="#" class="flex items-center transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">
              {{ t('landing.nav.products') }}
              <svg class="w-3.5 h-3.5 ml-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </a>
            <a href="#" class="flex items-center transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">
              {{ t('landing.nav.useCases') }}
              <svg class="w-3.5 h-3.5 ml-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </a>
            <a href="#" class="transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">{{ t('landing.nav.pricing') }}</a>
            <a href="#" class="transition-colors hover:opacity-50" :class="isDark ? 'text-white/80' : 'text-[#2c2c2a]/80'">{{ t('landing.nav.philosophy') }}</a>
          </nav>
        </div>

        <!-- Right Section: Language Switcher -->
        <div class="flex items-center space-x-4 z-50">
          <button 
            @click="setLocale('en')"
            class="transition-colors hover:text-white/50 cursor-pointer"
            :class="locale === 'en' ? (isDark ? 'text-white font-bold' : 'text-[#2c2c2a] font-bold') : (isDark ? 'text-white/50' : 'text-[#2c2c2a]/50')"
          >
            EN
          </button>
          <span :class="isDark ? 'text-white/30' : 'text-[#2c2c2a]/30'">/</span>
          <button 
            @click="setLocale('ru')"
            class="transition-colors hover:text-white/50 cursor-pointer"
            :class="locale === 'ru' ? (isDark ? 'text-white font-bold' : 'text-[#2c2c2a] font-bold') : (isDark ? 'text-white/50' : 'text-[#2c2c2a]/50')"
          >
            RU
          </button>
        </div>
      </header>

      <!-- Animated Tagline Section -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 py-10 my-auto z-50 relative min-h-[300px]">
        
        <!-- INTRO TYPING -->
        <div 
          v-if="heroAnimationState < 2"
          class="absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none"
          :class="[
            heroAnimationState === 1 ? 'opacity-0' : 'opacity-100',
            isDark ? 'text-white' : 'text-[#2c2c2a]'
          ]"
        >
          <span class="text-[20px] sm:text-[28px] tracking-[0.5em] font-light uppercase" style="font-family: 'Cormorant Garamond', serif;">
            {{ typedIntro }}<span class="animate-pulse">|</span>
          </span>
        </div>

        <!-- MAIN CONTENT -->
        <div 
          v-show="heroAnimationState >= 2"
          class="flex flex-col items-center justify-center w-full"
        >
          <!-- Core Icon & Name -->
          <div 
            class="flex items-center space-x-8 mb-8 scale-[0.8] origin-center transition-all duration-1000 ease-out"
            :class="heroAnimationState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          >
            <div class="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              <div class="absolute inset-0 border-2 animate-[spin_10s_linear_infinite]" :class="isDark ? 'border-white/40' : 'border-[#2c2c2a]/40'"></div>
              <div class="absolute inset-1.5 sm:inset-2 border animate-[spin_6s_linear_infinite_reverse]" :class="isDark ? 'border-white/60' : 'border-[#2c2c2a]/60'"></div>
              <div class="w-1 h-1 sm:w-1.5 sm:h-1.5 rotate-45 animate-pulse" :class="isDark ? 'bg-white' : 'bg-[#2c2c2a]'"></div>
              <div class="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-t-2 border-l-2" :class="isDark ? 'border-white' : 'border-[#2c2c2a]'"></div>
              <div class="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 border-b-2 border-r-2" :class="isDark ? 'border-white' : 'border-[#2c2c2a]'"></div>
            </div>
            <span 
              class="text-[18px] sm:text-[22px] tracking-[0.4em] font-light uppercase"
              :class="isDark ? 'text-white' : 'text-[#2c2c2a]'"
              style="font-family: 'Cormorant Garamond', serif;"
            >
              J.L.JÖRMUNGANDR
            </span>
          </div>

          <div class="text-2xl sm:text-4xl lg:text-5xl font-thin tracking-wide text-center leading-snug mb-12" :class="isDark ? 'text-white' : 'text-[#2c2c2a]'">
            {{ typedLine1 }}<span v-if="heroAnimationState === 2 && !typedLine2.length && typedLine1 !== t('landing.heroTitleLine1')" class="animate-pulse">|</span>
            <br v-if="typedLine2.length > 0 || (heroAnimationState === 2 && typedLine1 === t('landing.heroTitleLine1'))">
            {{ typedLine2 }}<span v-if="heroAnimationState === 2 && typedLine1 === t('landing.heroTitleLine1')" class="animate-pulse">|</span>
          </div>

          <!-- OS Specific Download Button -->
          <button 
            @click="scrollToDownload"
            class="flex cursor-pointer items-center space-x-3 px-8 py-3.5 transition-all duration-1000 hover:scale-105 group bg-white text-black shadow-md border border-black/5 hover:bg-slate-50"
            :class="heroAnimationState >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
          >
            <template v-if="os === 'mac'">
              <svg class="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span class="text-xs tracking-[0.3em] font-mono mt-0.5">{{ t('landing.downloadMac') }}</span>
            </template>
            <template v-else>
              <svg class="w-5 h-5" viewBox="0 0 448 512" fill="currentColor">
                <path d="M0 93.6l183.6-25.3v177.4H0V93.6zm203.6-28L448 32v213.6H203.6V65.6zM0 274.5h183.6V443L0 417.6V274.5zm203.6 0H448v213.6L203.6 448V274.5z"/>
              </svg>
              <span class="text-xs tracking-[0.3em] font-mono mt-0.5">{{ t('landing.downloadWindows') }}</span>
            </template>
          </button>
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
                  :class="isDark ? 'bg-[#070708]' : 'bg-[#f8f9fa]'"
                ></span>
              </button>
            </div>
          </div>
        </div>
      </main>
      -->


    </div>

    <!-- Video Preview Section -->
    <section class="relative z-10 w-full max-w-7xl mx-auto py-16 px-6 sm:px-10 flex justify-center items-center pointer-events-none">
      <div ref="videoContainer" class="w-full max-w-6xl rounded-2xl overflow-hidden border" :class="isDark ? 'border-white/10' : 'border-black/5'" :style="{ transform: `scale(${videoScale})`, transition: 'transform 0.1s ease-out' }">
        <video 
          src="/assets/preview.mov" 
          autoplay 
          loop 
          muted 
          playsinline 
          class="w-full h-auto object-cover opacity-90"
        ></video>
      </div>
    </section>

    <!-- Philosophy Section (Light Theme Trigger) -->
    <section ref="emptySection" class="relative z-10 w-full max-w-7xl mx-auto min-h-[70vh] py-32 px-6 sm:px-10 flex flex-col justify-center">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <!-- Left: Asset & Name -->
        <div class="flex flex-col items-center md:items-start opacity-80 transition-opacity hover:opacity-100">
          <img src="/assets/eves.svg" alt="J.L.JORMUNGANDR Concept" class="w-full max-w-md h-auto object-contain" />
          <div class="h-[1px] w-full bg-current opacity-20 my-10"></div>
          <div class="flex items-center flex-wrap gap-4">
            <span 
              class="text-[14px] sm:text-[18px] tracking-[0.5em] font-light uppercase"
              :class="isDark ? 'text-white' : 'text-[#2c2c2a]'"
              style="font-family: 'Cormorant Garamond', serif;"
            >
              J.L.JÖRMUNGANDR
            </span>
            <span class="text-[10px] sm:text-[12px] font-mono tracking-widest opacity-40">
              // plastic moth
            </span>
          </div>
        </div>
        
        <!-- Right: Statement -->
        <div class="flex items-center">
          <p class="text-2xl sm:text-3xl lg:text-4xl font-light leading-relaxed tracking-wide italic" :class="isDark ? 'text-white' : 'text-[#2c2c2a]'" style="font-family: 'Cormorant Garamond', serif;">
            "{{ typedPhilosophyText }}"<span v-if="!hasTypedPhilosophy || typedPhilosophyText.length < t('landing.aboutStatement').length" class="animate-pulse">|</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section 
      ref="featuresSection" 
      class="relative z-10 w-full max-w-7xl mx-auto py-32 px-6 sm:px-10 space-y-40"
    >
      <!-- Section Header -->
      <div class="text-center space-y-6">
        <h2 
          class="text-4xl sm:text-5xl lg:text-6xl tracking-[0.3em] uppercase font-light"
          :class="isDark ? 'text-white' : 'text-[#2c2c2a]'"
        >
          {{ t('landing.features.title') }}
        </h2>
        <div class="h-px w-32 bg-current mx-auto opacity-30"></div>
        <p class="text-xs lg:text-sm font-mono tracking-[0.4em] uppercase opacity-50">{{ t('landing.features.subtitle') }}</p>
      </div>

      <!-- Feature 1: Genesis Matrix -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div class="space-y-8 order-2 md:order-1">
          
          <h3 class="text-3xl lg:text-4xl font-light tracking-wide uppercase">{{ t('landing.features.genesis.title') }}</h3>
          <p class="text-[16px] lg:text-[18px] leading-relaxed opacity-70 font-light">
            {{ t('landing.features.genesis.desc') }}
          </p>
          <ul class="space-y-3 font-mono text-[13px] lg:text-[15px] opacity-60">
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-sky-500"></span>
              <span>{{ t('landing.features.genesis.point1') }}</span>
            </li>
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-sky-500"></span>
              <span>{{ t('landing.features.genesis.point2') }}</span>
            </li>
          </ul>
        </div>
        <div class="order-1 md:order-2 relative group overflow-hidden border transition-all duration-500" :class="isDark ? 'border-white/10 hover:border-sky-500/30' : 'border-slate-200 hover:border-sky-600/30'">
          <img 
            src="/screenshots/genesis-matrix.png" 
            alt="Genesis Matrix" 
            class="w-full h-auto object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700"
          />
        </div>
      </div>

      <!-- Feature 2: Detailed Analysis / Virtual Log -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div class="relative group overflow-hidden border transition-all duration-500" :class="isDark ? 'border-white/10 hover:border-purple-500/30' : 'border-slate-200 hover:border-purple-600/30'">
          <img 
            src="/screenshots/detailed-analysis.png" 
            alt="Detailed Analysis" 
            class="w-full h-auto object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700"
          />
        </div>
        <div class="space-y-8">
          
          <h3 class="text-3xl lg:text-4xl font-light tracking-wide uppercase">{{ t('landing.features.virtualLog.title') }}</h3>
          <p class="text-[16px] lg:text-[18px] leading-relaxed opacity-70 font-light">
            {{ t('landing.features.virtualLog.desc') }}
          </p>
          <ul class="space-y-3 font-mono text-[13px] lg:text-[15px] opacity-60">
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-purple-500"></span>
              <span>{{ t('landing.features.virtualLog.point1') }}</span>
            </li>
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-purple-500"></span>
              <span>{{ t('landing.features.virtualLog.point2') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Feature 3: Advanced Equity Analysis -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div class="space-y-8 order-2 md:order-1">
         
          <h3 class="text-3xl lg:text-4xl font-light tracking-wide uppercase">{{ t('landing.features.equity.title') }}</h3>
          <p class="text-[16px] lg:text-[18px] leading-relaxed opacity-70 font-light">
            {{ t('landing.features.equity.desc') }}
          </p>
          <ul class="space-y-3 font-mono text-[13px] lg:text-[15px] opacity-60">
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-emerald-500"></span>
              <span>{{ t('landing.features.equity.point1') }}</span>
            </li>
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-emerald-500"></span>
              <span>{{ t('landing.features.equity.point2') }}</span>
            </li>
          </ul>
        </div>
        <div class="order-1 md:order-2 relative group overflow-hidden border transition-all duration-500" :class="isDark ? 'border-white/10 hover:border-emerald-500/30' : 'border-slate-200 hover:border-emerald-600/30'">
          <img 
            src="/screenshots/3d-equity.png" 
            alt="3D Equity" 
            class="w-full h-auto object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700"
          />
        </div>
      </div>

      <!-- Feature 4: Isometric Engine Core (3D Cube) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div class="relative group overflow-hidden border transition-all duration-500" :class="isDark ? 'border-white/10 hover:border-rose-500/30' : 'border-slate-200 hover:border-rose-600/30'">
          <img 
            src="/screenshots/3d-cube.png" 
            alt="3D Cube" 
            class="w-full h-auto object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700"
          />
        </div>
        <div class="space-y-8">
         
          <h3 class="text-3xl lg:text-4xl font-light tracking-wide uppercase">{{ t('landing.features.engine.title') }}</h3>
          <p class="text-[16px] lg:text-[18px] leading-relaxed opacity-70 font-light">
            {{ t('landing.features.engine.desc') }}
          </p>
          <ul class="space-y-3 font-mono text-[13px] lg:text-[15px] opacity-60">
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-rose-500"></span>
              <span>{{ t('landing.features.engine.point1') }}</span>
            </li>
            <li class="flex items-center space-x-3">
              <span class="w-2 h-2 rotate-45 bg-rose-500"></span>
              <span>{{ t('landing.features.engine.point2') }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Download Section -->
    <section ref="downloadSection" class="relative z-10 w-full flex flex-col items-center justify-center py-32 px-6 sm:px-10 border-t" :class="isDark ? 'border-white/5 bg-transparent' : 'border-slate-200 bg-transparent'">
      <div class="text-3xl sm:text-5xl font-thin tracking-wide text-center leading-snug mb-12" :class="isDark ? 'text-white' : 'text-[#2c2c2a]'">
        {{ t('landing.footer.experience') }}
        <div class="flex items-center justify-center space-x-4 mt-6">
          <span class="text-xs sm:text-sm tracking-[0.3em] font-mono opacity-50 uppercase">{{ t('landing.footer.with') }}</span>
          <span class="text-xl sm:text-2xl font-light tracking-[0.2em]" style="font-family: 'Cormorant Garamond', serif;">
            J.L.JÖRMUNGANDR
          </span>
        </div>
      </div>
      <div class="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16 md:gap-8">
        <!-- Left Section: Patreon -->
        <div class="flex flex-col items-center md:items-start gap-4">
          <span class="text-xs tracking-[0.2em] font-mono opacity-50 uppercase">Get the full app</span>
          <a 
            href="https://patreon.com/jlgandr?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
            target="_blank"
            class="flex cursor-pointer items-center space-x-3 px-8 py-4 transition-all duration-300 hover:scale-105 group text-white shadow-md"
            style="background-color: #FF424D;"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M512 194.8c0 101.3-82.4 183.8-183.8 183.8-101.7 0-184.4-82.4-184.4-183.8 0-101.6 82.7-184.3 184.4-184.3C429.6 10.5 512 93.2 512 194.8zM0 501.5h98.6v-491H0v491z"/>
            </svg>
            <span class="text-xs tracking-[0.3em] font-mono mt-0.5">BUY ON PATREON</span>
          </a>
        </div>

        <!-- Divider for mobile -->
        <div class="block md:hidden w-16 h-[1px]" :class="isDark ? 'bg-white/10' : 'bg-black/10'"></div>

        <!-- Right Section: Downloads -->
        <div class="flex flex-col items-center md:items-end gap-4">
          <span class="text-xs tracking-[0.2em] font-mono opacity-50 uppercase">Download free demo</span>
          <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <!-- macOS Download Button -->
            <a 
              href="https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_universal.dmg"
              download
              class="flex cursor-pointer items-center space-x-3 px-8 py-4 transition-all duration-300 hover:scale-105 group bg-white text-black shadow-md border border-black/5 hover:bg-slate-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span class="text-xs tracking-[0.3em] font-mono mt-0.5">{{ t('landing.downloadMac') }}</span>
            </a>

            <!-- Windows Download Button -->
            <a 
              href="https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_x64-setup.exe"
              download
              class="flex cursor-pointer items-center space-x-3 px-8 py-4 transition-all duration-300 hover:scale-105 group bg-white text-black shadow-md border border-black/5 hover:bg-slate-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 448 512" fill="currentColor">
                <path d="M0 93.6l183.6-25.3v177.4H0V93.6zm203.6-28L448 32v213.6H203.6V65.6zM0 274.5h183.6V443L0 417.6V274.5zm203.6 0H448v213.6L203.6 448V274.5z"/>
              </svg>
              <span class="text-xs tracking-[0.3em] font-mono mt-0.5">{{ t('landing.downloadWindows') }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Telemetry Footer -->
    <footer class="relative z-10 w-full flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono tracking-[0.2em] opacity-40 uppercase pt-6 pb-12 px-6 sm:px-10 border-t" :class="isDark ? 'border-white/5' : 'border-slate-200'">
      <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
        <span>{{ t('landing.footer.company') }}</span> 
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t, locale, setLocale } = useI18n()

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

  if (emptySection.value) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isDark.value = !entry.isIntersecting
        
        if (entry.isIntersecting && !hasTypedPhilosophy.value) {
          hasTypedPhilosophy.value = true
          typeText(t('landing.aboutStatement'), typedPhilosophyText, 30)
        }
      })
    }, {
      rootMargin: "-25% 0px -25% 0px"
    })
    observer.observe(emptySection.value)
  }

  runHeroAnimation()
})

const isDark = ref(true)
const featuresSection = ref(null)
const downloadSection = ref(null)
const emptySection = ref(null)
const videoContainer = ref(null)

const videoScale = ref(0.6)
const hasTypedPhilosophy = ref(false)
const typedPhilosophyText = ref('')

// Animation logic
const heroAnimationState = ref(0)
const typedIntro = ref('')
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
  heroAnimationState.value = 0
  typedIntro.value = ''
  typedLine1.value = ''
  typedLine2.value = ''
  
  // State 0: Type Intro
  await typeText('J.L.JÖRMUNGANDR', typedIntro, 60)
  await new Promise(r => setTimeout(r, 800))
  
  // State 1: Fade out Intro
  heroAnimationState.value = 1
  await new Promise(r => setTimeout(r, 600)) // wait for fade out
  
  // State 2: Type Taglines
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
  if (hasTypedPhilosophy.value) {
    typedPhilosophyText.value = t('landing.aboutStatement')
  }
})

// Removed dynamic body background sync to keep the scrollbar container background permanently dark

let scrollTimeout = null
const handleScroll = () => {
  document.body.classList.add('is-scrolling')
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove('is-scrolling')
  }, 800) // hide after 800ms

  if (videoContainer.value) {
    const rect = videoContainer.value.getBoundingClientRect()
    const windowHeight = window.innerHeight
    
    // Calculate progress from 0 to 1 based on how far the video has scrolled into view
    // Start scaling when top of the video enters the screen (rect.top <= windowHeight)
    // Finish scaling when the top of the video is 1/3 of the screen from the top
    let progress = (windowHeight - rect.top) / (windowHeight / 1.5)
    progress = Math.max(0, Math.min(1, progress))
    videoScale.value = 0.6 + (0.6 * progress)
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})

const scrollToDownload = () => {
  downloadSection.value?.scrollIntoView({ behavior: 'smooth' })
}
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>