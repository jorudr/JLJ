// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src/',
  ssr: false,
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
  nitro: {
    preset: 'static'
  },
  app: {
    head: {
      script: [
        {
          innerHTML: `
            (function () {
              try {
                var isDark = localStorage.getItem('dark') === 'true';
                if (isDark) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `,
          tagPosition: 'head'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/jor_mac.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon', '@pinia/nuxt'],

  tailwindcss: {
    exposeConfig: true,
    viewer: true,
    configPath: './tailwind.config.ts',
    config: {
      darkMode: 'class',

    }

  },
  ignore: ['**/src-tauri/**'],
  vite: {
    server: {
      watch: {
        ignored: ['**/src-tauri/**']
      }
    }
  }
})
