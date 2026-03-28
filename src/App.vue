<template>
  <div class="main-container">
   <div class="header"></div>
   <div class="container">

    <!-- Main landing section -->
    <div class="main-section" v-if="isMainSection">
      <div class="banner">
        <div class="title">Welcome User!</div>
        <div class="description">We are here to help you get your dream job. Let's get started!</div>
      </div>
      <div class="section-title">We recommend</div>
      <div class="listing">
        <ul>
          <!-- Default challenge -->
          <li>
            <div class="card-content">
              <div class="prep-content">
                <div class="prep-title">Ultimate Coding Challenge</div>
                <div class="prep-stats">Mock Questions : {{ defaultQuestions.length }}</div>
                <div class="prep-description">This Interview Preparation Kit has challenges curated by our experts for you to prepare and ace your interviews.</div>
              </div>
              <div class="start-button" @click="startDefault">Start Preparation</div>
            </div>
          </li>
          <!-- Upload doc challenge -->
          <li style="margin-top: 16px;">
            <div class="card-content">
              <div class="prep-content">
                <div class="prep-title">Practice from Your Document</div>
                <div class="prep-stats">Custom Questions · PDF or TXT</div>
                <div class="prep-description">Upload a PDF or text file containing programming questions and get an instant AI-generated practice test tailored to that content.</div>
              </div>
              <div>
                <input type="file" ref="fileInput" accept=".pdf,.txt" @change="handleFileUpload" style="display:none" />
                <div class="start-button" @click="$refs.fileInput.click()" :class="{ 'btn-loading': uploading }">
                  {{ uploading ? 'Processing...' : 'Upload & Start' }}
                </div>
                <div class="upload-error" v-if="uploadError">{{ uploadError }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Editor section -->
    <div class="editor-section" v-if="editorOpened">
      <CodeEditor
        ref="editorRef"
        :question="currentQuestion"
        :key="currentQuestion.id"
        :is-first="currentQuestionIndex === 0"
        :initial-code="savedAnswers[currentQuestionIndex] ? savedAnswers[currentQuestionIndex].code : ''"
        :initial-language="savedAnswers[currentQuestionIndex] ? savedAnswers[currentQuestionIndex].language : 'Select Language'"
        @nextDrawer="handleNext"
        @prevQuestion="handlePrev"
      />
    </div>

    <!-- Score / results section -->
    <div class="score-section" v-if="scoreOpened">
      <div class="score-card">
        <div class="score-icon">&#10003;</div>
        <div class="score-heading">Challenge Complete!</div>
        <div class="score-sub">{{ questionBank.length }} questions answered</div>

        <div class="score-stat">
          <span class="score-num">{{ scorePercent }}%</span>
          <span class="score-label">{{ totalPassed }} / {{ totalTests }} test cases passed</span>
        </div>

        <div class="score-breakdown">
          <div
            class="breakdown-item"
            v-for="(result, i) in resultList"
            :key="i"
          >
            <div class="breakdown-top">
              <span class="breakdown-q">Q{{ i + 1 }}: {{ questionBank[i] ? questionBank[i].title : '' }}</span>
              <span
                class="breakdown-badge"
                :class="result.passedCount === result.totalCount ? 'all-pass' : result.passedCount === 0 ? 'all-fail' : 'partial'"
              >
                {{ result.passedCount }}/{{ result.totalCount }}
              </span>
            </div>
            <div class="breakdown-feedback">{{ result.feedback }}</div>
          </div>
        </div>

        <div class="score-btn" @click="restart">Try Again</div>
      </div>
    </div>

   </div>
   <div class="footer"></div>
  </div>
</template>

<script>
/* eslint-disable */
import CodeEditor from './components/CodeEditor.vue';
import questionsList from './data/questionBank.json';
import API_BASE from './config';

export default {
  name: 'App',
  components: { CodeEditor },
  data() {
    return {
      editorOpened: false,
      isMainSection: true,
      scoreOpened: false,
      defaultQuestions: [],
      questionBank: [],
      currentQuestionIndex: 0,
      currentQuestion: '',
      resultList: [],
      uploading: false,
      uploadError: null,
      savedAnswers: {},
    };
  },
  computed: {
    totalPassed() {
      return this.resultList.reduce((sum, r) => sum + (r.passedCount || 0), 0);
    },
    totalTests() {
      return this.resultList.reduce((sum, r) => sum + (r.totalCount || 0), 0);
    },
    scorePercent() {
      if (!this.totalTests) return 0;
      return Math.round((this.totalPassed / this.totalTests) * 100);
    },
  },
  mounted() {
    this.defaultQuestions = questionsList['questions'];
  },
  methods: {
    startDefault() {
      this.questionBank = this.defaultQuestions;
      this.currentQuestionIndex = 0;
      this.currentQuestion = this.questionBank[0];
      this.openEditor();
    },
    openEditor() {
      this.editorOpened = true;
      this.isMainSection = false;
    },
    saveCurrentAnswer() {
      const editor = this.$refs.editorRef;
      if (editor) {
        this.savedAnswers[this.currentQuestionIndex] = {
          code: editor.code,
          language: editor.selectedLanguage,
        };
      }
    },
    handleNext(data) {
      this.saveCurrentAnswer();
      this.resultList.push(data);
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < this.questionBank.length) {
        this.currentQuestion = this.questionBank[this.currentQuestionIndex];
      } else {
        this.editorOpened = false;
        this.scoreOpened = true;
      }
    },
    handlePrev() {
      if (this.currentQuestionIndex === 0) return;
      this.saveCurrentAnswer();
      this.resultList.pop();
      this.currentQuestionIndex--;
      this.currentQuestion = this.questionBank[this.currentQuestionIndex];
    },
    restart() {
      this.currentQuestionIndex = 0;
      this.currentQuestion = this.questionBank[0];
      this.resultList = [];
      this.savedAnswers = {};
      this.scoreOpened = false;
      this.isMainSection = true;
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.uploading = true;
      this.uploadError = null;

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await fetch(`${API_BASE}/upload-questions`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.error) {
          this.uploadError = data.error;
        } else if (!data.questions || data.questions.length === 0) {
          this.uploadError = 'No questions found in the document. Try a different file.';
        } else {
          this.questionBank = data.questions;
          this.currentQuestionIndex = 0;
          this.currentQuestion = this.questionBank[0];
          this.resultList = [];
          this.openEditor();
        }
      } catch (err) {
        this.uploadError = 'Could not reach the server. Make sure the backend is running (npm run start).';
      } finally {
        this.uploading = false;
        // Reset file input so the same file can be re-uploaded if needed
        this.$refs.fileInput.value = '';
      }
    },
  },
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1e293b;
  background: #f1f5f9;
  min-height: 100vh;
}
* {
  padding: 0;
  margin: 0;
  list-style-type: none;
  box-sizing: border-box;
}
.header {
  background: linear-gradient(135deg, #1e1e3f 0%, #3b3486 100%);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.header::before {
  content: '</> CodePrep';
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.container {
  min-height: calc(100vh - 64px);
}
.main-section {
  padding: 48px 60px;
  max-width: 1100px;
  margin: 0 auto;
}
.banner {
  background: linear-gradient(135deg, #1e1e3f 0%, #3b3486 100%);
  border-radius: 16px;
  padding: 48px;
  margin-bottom: 48px;
  color: white;
  box-shadow: 0 8px 32px rgba(59, 52, 134, 0.3);
}
.banner .title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}
.banner .description {
  font-size: 16px;
  opacity: 0.85;
  line-height: 1.6;
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  padding-bottom: 12px;
  border-bottom: 3px solid #6366f1;
  margin-bottom: 24px;
  color: #1e293b;
}
.listing ul li {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}
.listing ul li:hover {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}
.prep-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}
.prep-stats {
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.prep-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
}
.start-button {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 14px;
  padding: 12px 28px;
  cursor: pointer;
  display: inline-block;
  border-radius: 8px;
  font-weight: 600;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.start-button:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.btn-loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
.upload-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 8px;
  max-width: 200px;
  text-align: right;
}
.editor-section {
  padding: 24px;
  padding-top: 0;
}

/* Score page */
.score-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px;
  min-height: calc(100vh - 64px);
}
.score-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 48px 48px 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 560px;
}
.score-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin: 0 auto 24px;
}
.score-heading {
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 6px;
}
.score-sub {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 28px;
}
.score-stat {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 28px;
}
.score-num {
  display: block;
  font-size: 52px;
  font-weight: 800;
  color: #6366f1;
  line-height: 1;
}
.score-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 6px;
}

/* Per-question breakdown */
.score-breakdown {
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 28px;
}
.breakdown-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.breakdown-item:last-child { border-bottom: none; }
.breakdown-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.breakdown-q {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.breakdown-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.all-pass  { background: #dcfce7; color: #16a34a; }
.partial   { background: #fef9c3; color: #ca8a04; }
.all-fail  { background: #fee2e2; color: #dc2626; }
.breakdown-feedback {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.score-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 14px;
  padding: 12px 32px;
  cursor: pointer;
  display: inline-block;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: opacity 0.2s, transform 0.15s;
}
.score-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.footer { display: none; }
</style>
