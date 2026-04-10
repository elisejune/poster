<template>
  <div class="report-section" :class="sectionClass">
    <table class="report-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0 && emptyMessage">
          <td :colspan="columns.length" :class="['no-data', sectionClass]">{{ emptyMessage }}</td>
        </tr>
        <tr v-else v-for="(row, i) in rows" :key="i">
          <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  sectionClass: string
  columns: string[]
  rows: string[][]
  emptyMessage?: string
}>()
</script>

<style scoped>
.no-data {
  background-color: #ffffff;
  text-align: center;
  font-weight: bold;
}
.commend-section .no-data {
  color: rgb(179, 212, 252);
}
.notice-section .no-data {
  color: #e53935;
}
</style>
