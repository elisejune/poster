<template>
  <div class="header-section">
    <div class="title-area">
      <div class="main-title">信息技术部<br>黑板报</div>
      <div class="date-text">{{ displayDate }}</div>
    </div>
    <div class="subtitle">只要读懂了客户，科技的突破则水到渠成</div>
    <div class="description">
      阳光科技人必须以"争创第一，追求极致"的心气和决心；<br>
      以最懂客户的底气；以最懂技术的能力；<br>
      以永不满足的进取精神；<br>
      渐进积累、颠覆突破、实现第一、靠近极致。<br>
      以科技创造未来！
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ displayDate: string }>()
</script>
