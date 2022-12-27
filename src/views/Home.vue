<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
    <CommonButton name="asdasd" @setInput="setInput" />
    자식에게 받은 데이터: {{ value }}
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CommonButton from "@/components/button.vue";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

@Component({
  components: {
    HelloWorld,
    CommonButton,
  },
})
export default class Home extends Vue {
  private value = "";
  setInput(value:string) {
    console.log("자식 컴포넌트에게 값을 받았어요 : ", value);
    this.value = value;
  }
  /*****life cycle test******/ 
 private beforeUpdate(): void{
    console.log("BeforeUpdate(home.vue)")
    console.log(this.value)
    this.value="value change?"
    console.log(this.value)
    console.log("입력창에 렌더링 되지는 않음")
  }
  private update():void{
    console.log("update value: 재 렌더링이 일어난 후에 실행")
    console.log(this.value+this.value)
  }
}
</script>
