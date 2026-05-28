<template>
  <div class="min-h-screen flex flex-col bg-[#f7f5fa] bg-center bg-cover dark:bg-none dark:bg-[#050505]">
  
    
    <main class="flex-grow flex flex-col items-center justify-center text-center px-4">
      <h1 class="text-9xl font-serif text-black dark:text-white opacity-10 mb-4">
        {{ error?.statusCode || '404' }}
      </h1>
      
      <h2 class="text-3xl md:text-4xl font-serif text-black dark:text-white mb-6">
        {{ error?.message || 'Page not found' }}
      </h2>
      

      <button 
        @click="handleError"
        class="text-sm text-white bg-black dark:bg-white dark:text-black px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
      >
        Go Back Home
      </button>
    </main>

 
  </div>
</template>

<script setup lang="ts">


const error = useError()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>