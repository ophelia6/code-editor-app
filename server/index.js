require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const request = require('request');
const OpenAI = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const port = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(cors());

// JDoodle proxy — used by the Compile button
app.post('/', (req, res) => {
    const { script, language } = req.body;
    const program = {
        script,
        language,
        versionIndex: '0',
        clientId: '748ece81b2c9cd5e814c77944b01be31',
        clientSecret: 'af3b5b6adc92060369e204823939cb8694e9e47c4fd5e61738de1a2267819556',
    };
    request({ url: 'https://api.jdoodle.com/v1/execute', method: 'POST', json: program },
        (error, response, body) => {
            if (error) return res.status(500).json({ error: 'Compile failed' });
            res.json(body);
        }
    );
});

// OpenAI evaluation — used by the Submit button
app.post('/evaluate', async (req, res) => {
    const { code, language, question, testCases } = req.body;

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server.' });
    }

    const prompt = `You are a strict code evaluator. Analyze this ${language} code solution and determine if it correctly solves the problem for each test case. Trace through the logic precisely.

Question: ${question.title}
Description: ${question.description}

User's code:
\`\`\`${language}
${code}
\`\`\`

Test cases:
${testCases.map((tc, i) => `Test ${i + 1}: input = ${JSON.stringify(tc.input)}, expected output = ${JSON.stringify(tc.output)}`).join('\n')}

Return ONLY valid JSON, no markdown or extra text:
{
  "results": [
    { "input": <input value>, "expectedOutput": <expected value>, "actualOutput": <what code produces>, "passed": <true or false> }
  ],
  "passedCount": <number of passed tests>,
  "totalCount": <total number of tests>,
  "feedback": "<1-2 sentence summary of the solution quality and any issues>"
}`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
        });

        let content = completion.choices[0].message.content.trim();
        content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const result = JSON.parse(content);
        res.json(result);
    } catch (err) {
        console.error('OpenAI evaluation error:', err.message);
        res.status(500).json({ error: err.message || 'Evaluation failed.' });
    }
});

// Document upload — parses PDF/text and extracts questions via OpenAI
app.post('/upload-questions', upload.single('document'), async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const parsed = await pdfParse(req.file.buffer);
            text = parsed.text;
        } else {
            text = req.file.buffer.toString('utf-8');
        }

        const prompt = `Extract all programming questions from the document text below. For each question:
1. Write a short title (under 60 chars)
2. Write a clear problem description
3. Generate 3–5 test cases with realistic input and expected output values

Return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "id": <number starting from 1>,
      "title": "<title>",
      "description": "<description>",
      "testCases": [
        { "input": <value>, "output": <value> }
      ]
    }
  ]
}

Document text:
${text.substring(0, 8000)}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        });

        let content = completion.choices[0].message.content.trim();
        content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const result = JSON.parse(content);
        res.json(result);
    } catch (err) {
        console.error('Upload/parse error:', err.message);
        res.status(500).json({ error: 'Failed to extract questions from document.' });
    }
});

// Serve the Vue build in production
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
