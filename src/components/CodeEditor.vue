<template>
    <div class="editor-component">
      <div class="left-section">
        <div class="ques-number">Question {{ question.id }}</div>
        <div class="ques-title">{{ question.title }}</div>
        <div class="ques-description">{{ question.description }}</div>
      </div>
      <div class="right-section">
        <div class="select-lang">
          <div class="dropdown">
            <div class="dropdown-select" @click="toggleDropdown">
              {{ selectedLanguage }}
              <span class="arrow">&#9660;</span>
            </div>
          <div class="dropdown-options" v-show="showDropdown">
            <div class="dropdown-option" v-for="language in codingLanguages" :key="language" @click="selectLanguage(language)">
              {{ language }}
            </div>
          </div>
        </div>
        </div>
        <div class="editor">
          <Codemirror v-model="code" :options="editorOptions" @keydown="onInput"></Codemirror>
        </div>
        <div class="output">
          <div class="title-op">Output:</div>
          {{ curResult.output }}
        </div>
        <div class="btns">
              <div class="compile-btn" @click="showOutput">
                Compile
              </div>
              <div class="submit-btn" @click="executeCode">
                Next
              </div>
        </div>
      </div>
    </div>
</template>
<script>

import { Codemirror } from 'vue-codemirror';
// import SockJS from 'sockjs-client';
// import Stomp from 'webstomp-client';
// import axios from 'axios';

export default {
  name: 'CodeEditor',
  components: {
    Codemirror,
  },
  data() {
    return {
      codingLanguages: ['NodeJS', 'Python', 'Java'],
      selectedLanguage: 'Select Language',
      showDropdown: false,
      curResult: '',
      code: '',
      editorOptions: {
        mode: 'nodejs', 
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        readOnly: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        viewportMargin: Infinity,
        result: "Hello"
      },
    };
  },
  props: {
    question: {
        type: Object
    },
  },
  mounted() {
    console.log(this.question);
    // this.socketClient = Stomp.over(new SockJS('https://api.jdoodle.com/v1/stomp'), {
    //   heartbeat: false,
    //   debug: true
    // })
    // this.socketClient.connect({}, this.onWsConnection, this.onWsConnectionFailed)
  },
  methods: {
    changeLanguage(newLanguage) {
      this.editorOptions.mode = newLanguage;
    },
    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
    },
    selectLanguage(language) {
      let languageSmall = language.toLowerCase();
      this.editorOptions.mode = languageSmall;
      this.selectedLanguage = language;
      this.showDropdown = false;
    },
    onInput(event){
      console.log(event.key);
    },
    onWsConnection() {
      console.log("Connecton successsful!");
    },
    onWsConnectionFailed(){
      console.log("Connecton failed!");
    },
    executeCode(){
      let tempResult = [];
      let testCase = this.question.testCases;
      for(let i=0;i<testCase.length;i++){
        this.compileCode(); //Test code against testcases i/p and o/p
        console.log(this.curResult);
        tempResult.push(this.curResult);
      }

      this.$emit('nextDrawer',  tempResult);
    },
    async compileCode() {
      await fetch("http://localhost:3000", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // script: `const readline = require('readline');
              //         const rl = readline.createInterface({
              //             input: process.stdin,
              //             output: process.stdout
              //         });
              //         rl.question('', (number) => {
              //             ${this.code}
              //             rl.close();
              //         });
              //     `,      
                script: this.code, 
                language: this.editorOptions.mode,
                versionIndex: "0",
                clientId:'748ece81b2c9cd5e814c77944b01be31',
                clientSecret: 'af3b5b6adc92060369e204823939cb8694e9e47c4fd5e61738de1a2267819556',
            })
          })
          .then(response => {
              return response.json();
          })
          .then(data => {
              console.log(data);
              this.curResult = data;
          })
          .catch(error => alert(error.message));

      },
      showOutput(){
        this.compileCode();
      }

},

}
</script>
<style scoped>

  .editor-component{
    display: flex;
    justify-content: space-between;
  }

  .left-section{
    width: 20%;
    max-width: 20%;

  }
  .right-section{
    width: 80%;
    max-width: 80%;
    padding-left: 15px;
    
  }
  .dropdown {
      position: absolute;
      right: 0;
      display: inline-block;
      background: #fff;
      width: 200px;
    }

    .dropdown-select {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-options {
      top: 100%;
      left: 0;
      width: 100%;
      border: 1px solid #ccc;
      border-top: none;
      border-radius: 0 0 5px 5px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1;
    }

    .dropdown-option {
      padding: 10px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .dropdown-option:hover {
      background-color: #f0f0f0;
    }

  .compile-btn {
    background: #00751f;
    color: #fff;
    font-size: 14px;
    padding: 12px 30px;
    cursor: pointer;
    display: inline-block;
    border-radius: 5px;
    font-weight: bold;
    margin-right: 20px;

  }

  .submit-btn{
    background: #00751f;
    color: #fff;
    font-size: 14px;
    padding: 12px 30px;
    cursor: pointer;
    display: inline-block;
    border-radius: 5px;
    font-weight: bold;

  }

  .ques-number{
    font-size: 30px;
    line-height: 35px;
    font-weight: bold;
    margin-bottom: 20px;
    background: #2c3e50;
    color: #fff;
    padding: 10px;
  }
  .ques-title{
    font-size: 18px;
    line-height: 23px;
    padding-bottom: 10px;

  }
  .ques-description{
    font-size: 14px;
    line-height: 19px;

  }
  .select-lang{
    position: relative;
    height: 55px;
    z-index: 100;
    background: #F3F7F7;
  }

  ::v-deep .cm-editor{
    position: relative !important;
    box-sizing: border-box;
    display: flex !important;
    flex-direction: column;
    height: 462px;
    border: 1px solid #D3D3D3;
    margin-bottom: 20px;
  }
  .output{
    margin-bottom: 20px;
    background: #000;
    padding: 15px;
    color: #fff;
    height: 100px; 
    overflow: auto; 
    
  }
  .title-op{
    font-size: 18px;
    padding-bottom: 10px;
  }

</style>
 