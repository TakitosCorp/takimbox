<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style scoped>
@font-face {
  font-family: 'Comfortaa';
  src: url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@100&display=swap') format('truetype');
}

html,
* {
  font-family: 'Comfortaa', sans-serif !important;
}

/*
@font-face {
  font-family: 'Contm';
  src: url('@/assets/contm.ttf') format('truetype');
  font-display: swap;
}
html, * {
  font-family: 'Contm', sans-serif !important;
}
*/
body::-webkit-scrollbar {
  width: 0px;
}
</style>
