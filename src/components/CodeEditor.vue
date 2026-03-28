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
          <Codemirror v-model="code" :options="editorOptions"></Codemirror>
        </div>

        <!-- Output: shown when compiling, hidden once eval results appear -->
        <div class="output" v-if="!evalResults">
          <div class="title-op">Output:</div>
          <div v-if="compiling" class="output-loading">Running...</div>
          <div v-else>{{ curResult.output }}</div>
        </div>

        <!-- Eval results panel: shown after Submit -->
        <div class="eval-panel" v-if="evalResults">
          <div class="eval-header">
            <span class="eval-score-badge" :class="evalResults.passedCount === evalResults.totalCount ? 'all-pass' : evalResults.passedCount === 0 ? 'all-fail' : 'partial'">
              {{ evalResults.passedCount }}/{{ evalResults.totalCount }} passed
            </span>
            <span class="eval-feedback-text">{{ evalResults.feedback }}</span>
          </div>
          <div class="eval-cases">
            <div
              class="eval-case"
              v-for="(r, i) in evalResults.results"
              :key="i"
              :class="r.passed ? 'case-pass' : 'case-fail'"
            >
              <span class="case-icon">{{ r.passed ? '✓' : '✗' }}</span>
              <span class="case-label">Test {{ i + 1 }}</span>
              <span class="case-detail" v-if="!r.passed">
                Expected <code>{{ r.expectedOutput }}</code> · Got <code>{{ r.actualOutput }}</code>
              </span>
            </div>
          </div>
        </div>

        <!-- Error panel -->
        <div class="error-panel" v-if="evalError">
          &#9888; {{ evalError }}
        </div>

        <div class="btns">
          <div class="prev-btn" @click="$emit('prevQuestion')" :class="{ 'btn-disabled': isFirst || evaluating || compiling }">
            &#8592; Previous
          </div>
          <div class="compile-btn" @click="showOutput" :class="{ 'btn-disabled': evaluating || compiling }">
            Compile
          </div>
          <div class="submit-btn" @click="handleSubmitBtn" :class="{ 'btn-disabled': evaluating || compiling }">
            <span v-if="evaluating">Evaluating...</span>
            <span v-else-if="evalResults">Continue &#8594;</span>
            <span v-else>Submit</span>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
/* eslint-disable */
import { Codemirror } from 'vue-codemirror';
import API_BASE from '../config';

export default {
  name: 'CodeEditor',
  components: { Codemirror },
  props: {
    question: { type: Object },
    isFirst: { type: Boolean, default: false },
    initialCode: { type: String, default: '' },
    initialLanguage: { type: String, default: 'Select Language' },
  },
  data() {
    return {
      codingLanguages: ['NodeJS', 'Python', 'Java'],
      selectedLanguage: this.initialLanguage,
      showDropdown: false,
      curResult: '',
      code: this.initialCode,
      compiling: false,
      evaluating: false,
      evalResults: null,
      evalError: null,
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
      },
    };
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    selectLanguage(language) {
      this.editorOptions.mode = language.toLowerCase();
      this.selectedLanguage = language;
      this.showDropdown = false;
    },
    handleSubmitBtn() {
      if (this.evaluating || this.compiling) return;
      if (this.evalResults) {
        this.continueToNext();
      } else {
        this.evaluateCode();
      }
    },
    async evaluateCode() {
      if (!this.code.trim()) {
        this.evalError = 'Please write some code before submitting.';
        return;
      }
      this.evaluating = true;
      this.evalError = null;
      this.evalResults = null;

      try {
        const response = await fetch(`${API_BASE}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: this.code,
            language: this.selectedLanguage || 'NodeJS',
            question: {
              title: this.question.title,
              description: this.question.description,
            },
            testCases: this.question.testCases,
          }),
        });
        const data = await response.json();
        if (data.error) {
          this.evalError = data.error;
        } else {
          this.evalResults = data;
        }
      } catch (err) {
        this.evalError = 'Could not reach the server. Make sure the backend is running (npm run start).';
      } finally {
        this.evaluating = false;
      }
    },
    continueToNext() {
      this.$emit('nextDrawer', {
        questionId: this.question.id,
        passedCount: this.evalResults.passedCount,
        totalCount: this.evalResults.totalCount,
        feedback: this.evalResults.feedback,
        results: this.evalResults.results,
      });
    },
    async compileCode() {
      this.compiling = true;
      this.curResult = '';
      try {
        const response = await fetch(`${API_BASE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: this.code,
            language: this.editorOptions.mode,
            versionIndex: '0',
          }),
        });
        const data = await response.json();
        this.curResult = data;
      } catch (err) {
        this.curResult = { output: 'Error: Could not reach the server. Make sure the backend is running.' };
      } finally {
        this.compiling = false;
      }
    },
    showOutput() {
      if (this.compiling || this.evaluating) return;
      this.evalResults = null;
      this.evalError = null;
      this.compileCode();
    },
  },
};
</script>

<style scoped>
.editor-component {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.left-section {
  width: 28%;
  max-width: 28%;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.right-section {
  width: 72%;
  max-width: 72%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.ques-number {
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e1e3f, #3b3486);
  color: #a5b4fc;
  padding: 16px 20px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.ques-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  padding: 20px 20px 8px;
  line-height: 1.4;
}

.ques-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.75;
  padding: 0 20px 20px;
}

.select-lang {
  position: relative;
  height: 48px;
  z-index: 100;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.dropdown {
  position: absolute;
  right: 16px;
  display: inline-block;
  width: 180px;
  border-radius: 6px;
}

.dropdown-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #1e293b;
  font-size: 13px;
  background: #fff;
  user-select: none;
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.dropdown-option {
  padding: 9px 12px;
  cursor: pointer;
  color: #1e293b;
  font-size: 13px;
  transition: background-color 0.15s;
}

.dropdown-option:hover {
  background-color: #f1f5f9;
}

.editor {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

::v-deep .cm-editor {
  position: relative !important;
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column;
  height: 100%;
  border: none;
  margin-bottom: 0;
}

.output {
  background: #f1f5f9;
  padding: 12px 16px;
  color: #1e293b;
  height: 110px;
  overflow: auto;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.title-op {
  font-size: 10px;
  color: #64748b;
  padding-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-weight: 600;
}

.output-loading {
  color: #94a3b8;
  font-style: italic;
}

/* Eval results panel */
.eval-panel {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px;
  max-height: 180px;
  overflow-y: auto;
  flex-shrink: 0;
}

.eval-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.eval-score-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.all-pass  { background: #dcfce7; color: #16a34a; }
.partial   { background: #fef9c3; color: #ca8a04; }
.all-fail  { background: #fee2e2; color: #dc2626; }

.eval-feedback-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.eval-cases {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.eval-case {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 5px;
}

.case-pass { background: #f0fdf4; color: #15803d; }
.case-fail { background: #fff1f2; color: #be123c; }

.case-icon { font-weight: 700; font-size: 13px; }
.case-label { font-weight: 600; }
.case-detail { color: #64748b; }
.case-detail code {
  background: #e2e8f0;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  color: #1e293b;
}

/* Error panel */
.error-panel {
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  padding: 10px 16px;
  border-top: 1px solid #fecdd3;
  flex-shrink: 0;
}

.btns {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  gap: 10px;
  flex-shrink: 0;
}

.prev-btn {
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-block;
  border-radius: 6px;
  font-weight: 600;
  border: 1.5px solid #e2e8f0;
  transition: background 0.18s, color 0.18s;
  margin-right: auto;
}

.prev-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.compile-btn {
  background: transparent;
  color: #6366f1;
  font-size: 13px;
  padding: 8px 22px;
  cursor: pointer;
  display: inline-block;
  border-radius: 6px;
  font-weight: 600;
  border: 1.5px solid #6366f1;
  transition: background 0.18s, color 0.18s;
}

.compile-btn:hover {
  background: #6366f1;
  color: #fff;
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 13px;
  padding: 8px 22px;
  cursor: pointer;
  display: inline-block;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(99, 102, 241, 0.35);
  transition: opacity 0.18s, transform 0.15s;
}

.submit-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
