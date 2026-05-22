import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class',
    content: [
        './src/app.vue',
        './src/pages/**/*.{vue,js,ts}',
        './src/widgets/**/*.{vue,js,ts}',
        './src/features/**/*.{vue,js,ts}',
        './src/entities/**/*.{vue,js,ts}',
        './src/shared/**/*.{vue,js,ts}'
    ],
    theme: {
        extend: {
            colors: {
                'nier': {
                    'black': '#0a0a0a',
                    'white': '#f4f4f2',
                    'text': {
                        'light': '#2c2c2a',
                        'dark': '#ffffff'
                    },
                    'border': {
                        'light': 'rgba(0, 0, 0, 0.1)',
                        'dark': 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            backgroundImage: {
                'pattern-light': "url('/assets/pattern.png')",
                'pattern-dark': "url('/public/assets/pattern-dark.png')",
            }
        }
    },
    plugins: []
} satisfies Config
