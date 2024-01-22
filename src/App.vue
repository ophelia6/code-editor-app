<template>
  <div class="main-container">
   <div class="header"></div>  <!-- Call header component -->
   <div class="container">
    <div class="main-section" v-if="isMainSection">
      <div class="banner">
        <div class="title">Welcome User!</div>
        <div class="description">We are here to help you get your dream job. Let’s get started!</div>
      </div>
      <div class="section-title">We recommend</div>
      <div class="listing">
        <ul>
          <li>
            <div class="card-content">
              <div class="prep-content">
                <div class="prep-title">Untimate Coding Challenge</div>
                <div class="prep-stats">Mock Questions : 5</div>
                <div class="prep-description">This Interview Preparation Kit has challenges curated by our experts for you to prepare and ace your interviews.</div>
              </div>
              <div class="start-button" @click="openEditor">
                Start Preparation
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="editor-section" v-if="editorOpened">
      <CodeEditor :question="currentQuestion"
                  @nextDrawer="handleNext" />
    </div>
   </div>
   <div class="footer"></div>  <!-- Call footer component -->
  </div>
</template>

<script>
/* eslint-disable */
import CodeEditor from './components/CodeEditor.vue';
import questionsList from './data/questionBank.json';
export default {
  name: 'App',
  components: {
    CodeEditor,

  },
  data(){
    return{
      editorOpened: false,
      isMainSection: true,
      questionBank: [],
      currentQuestionIndex: 0,
      currentQuestion: '',
      resultList:[]
    }

  },
  mounted(){
    this.questionBank = questionsList['questions'];
    this.currentQuestion = this.questionBank[this.currentQuestionIndex];
    console.log(this.questionBank,this.currentQuestion)
  },
  methods: {
    openEditor(){
      this.editorOpened = true;
      this.isMainSection = false;
    },
    handleNext(data){
      console.log("Update question", data, this.currentQuestionIndex, this.questionBank.length);
      this.currentQuestionIndex++;
      if(this.currentQuestionIndex < this.questionBank.length){
        this.currentQuestion = this.questionBank[this.currentQuestionIndex];
        this.resultList.push(data); // resultList has all outputs and solutions against all testcase
      }
      else{
        console.log("Open Submit Page"); // Just loop for resultList and print
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
*{
  padding:0;
  margin: 0;
  list-style-type: none;
  box-sizing: border-box;
}
.main-section{
  padding: 0 50px;
}
.start-button{
  background: #00751f;
  color: #fff;
  font-size: 14px;
  padding: 12px 30px;
  cursor: pointer;
  display: inline-block;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 15px ;

}
.header{
  background: #2c3e50;
  height: 60px;
  margin-bottom: 50px;
}
.editor-section{
  padding: 20px;
  padding-top: 0;
}
.banner{
  margin-bottom: 50px;
}
.banner .title{
 font-size: 30px;
 font-weight: bold;
}
.section-title{
  font-size: 25px;
  padding-bottom: 3px;
  border-bottom: 5px solid #2c3e50;
  margin-bottom: 20px;
  font-weight: bold;
}

.listing ul li{
  border: 1px solid #c3cece;
  padding: 20px;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px;

}


/* F3F7F7 */

</style>
