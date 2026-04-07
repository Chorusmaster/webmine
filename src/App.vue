<style scoped>
</style>

<template>
  <canvas ref="canvas">
    Canvas not supported
  </canvas>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import Game from './game_engine/Game.js';

  const canvas = ref(null);

  onMounted(() => {
    const game = new Game(canvas.value);
    game.start();
  });
</script>
