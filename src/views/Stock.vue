<template>
  <div class="stock">
    <h2>boots is in stock.</h2>
    {{ text2 }}<br /><br />
    <button @click="onClick">{{ text }}</button>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Stock extends Vue {
  private text = "";
  private text2 = "";
  private mounted(): void {
    this.text = "버튼";
  }
  onClick() {
    console.log("버튼 클릭하였습니다.");
    this.text2 = "버튼클릭됨";
  }
}
</script>