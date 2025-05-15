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

body::-webkit-scrollbar {
  width: 0px;
}
</style>
