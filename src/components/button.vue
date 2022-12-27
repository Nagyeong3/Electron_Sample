<template>
  <div>
      <div>
      버튼이름:
      <button @click="onClick">
        클릭
      </button>
      </div>
      <div>
        Emit:
        <input type="text" v-model="value">
        <button @click="onEmit">emit</button>
      </div>
  </div>
 
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
@Component
export default class Button extends Vue {
  // props:{
  //   name: string;
  // }

  @Prop()
  private name!: string;


  private value = "";
  
    onClick() {
    console.log("button vue active");
    }
    onEmit(){
      //this.$emit("키",값)
      this.$emit("setInput",this.value);
    }

  /****************************
   ******life cycle test*******
   ****************************/ 
  private beforeCreate(): void{
    console.log("beforecreate: 컴포넌트가 dom에 추가되기전임 dom에 접근시도. . .");
    //console.log(this.name); -> error
  }
  private mounted(): void {
    console.log(this.name)
  }
  private beforeUpdate(): void{
    console.log("BeforeUpdate(button.vue)")
    console.log(this.value)
  }
  // private update():void{
  //   console.log("update value: 컴포넌트 데이터가 변하여 재 렌더링이 일어난 후에 실행")
  //   console.log(this.value)
  // }
}
</script>