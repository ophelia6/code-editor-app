const express = require('express');
const app = express();
const cors = require('cors');
const request = require('request');
// const path = require('path');
// const { createProxyMiddleware } = require('http-proxy-middleware');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(cors());

// Create a proxy to forward requests to Jdoodle API
// const jdoodleProxy = createProxyMiddleware({
//   target: 'https://api.jdoodle.com',
//   changeOrigin: true,
//   pathRewrite: {
//     '^/jdoodle-api': '', // Remove the '/jdoodle-api' prefix when forwarding
//   },
// });

// // Use the proxy middleware for requests to '/jdoodle-api'
// app.use('/jdoodle-api', jdoodleProxy);

// // Serve the Vue.js app
// app.use(express.static(path.join(__dirname, 'dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// app.post("/", (req, res) => {
//     console.log("IN");
//     res.set({
//         "Access-Control-Allow-Origin": "http://localhost:8081",
//         "Access-Control-Allow-Headers": "*",
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//     });
//     let codeBody = [];
//     req
//         .on("data", chunk => {
//             codeBody.push(chunk);
//         })
//         .on("end", () => {
//             codeBody = Buffer.concat(codeBody).toString();
//             bodyObj = JSON.parse(codeBody);
//             console.log(bodyObj);
//             let code = bodyObj.code.toString();
//             let language = bodyObj.language.toString();
//             let inputs = bodyObj.standardIn.toString();
//             console.log(code,language,inputs);
//             var program = {
//                 script: code,
//                 language: language,
//                 stdin: inputs,
//                 versionIndex: "0",
//                 clientId: process.env.CLIENT_ID,
//                 clientSecret: process.env.CLIENT_SECRET
//             };
//             request(
//                 {
//                     url: "https://api.jdoodle.com/v1/execute",
//                     method: "POST",
//                     json: program
//                 },
//                 function (error, response, body) {
//                     console.log("error:", error);
//                     console.log("statusCode:", response && response.statusCode);
//                     console.log("body:", body);
//                     res.json(body);
//                 }
//             );
//         });
// });

app.post('/', (req, res) => {
    console.log("Inside", req.body);
    const { script, language, stdin } = req.body;
    res.set({
        "Access-Control-Allow-Origin": "http://localhost:8081",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    });

    // if (!script || !language ) {
    //     return res.status(400).json({ error: 'Missing required parameters' });
    // }

    const program = {
        script: script,                
        language: language,
        versionIndex: "0",
        clientId:'748ece81b2c9cd5e814c77944b01be31',
        clientSecret: 'af3b5b6adc92060369e204823939cb8694e9e47c4fd5e61738de1a2267819556',
    };

    request({
        url: 'https://api.jdoodle.com/v1/execute',
        method: 'POST',
        json: program
    }, (error, response, body) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log(body);
        res.json(body);
    });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
