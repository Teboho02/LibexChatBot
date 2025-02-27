const express = require('express');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*'
}));

const libexPath = path.resolve(__dirname, '../libex');
app.use(express.static(libexPath));
console.log(`Serving static files from: ${libexPath}`);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const responseCache = new Map();
const CACHE_EXPIRY = 1000 * 60 * 60; 

const filePath = path.resolve(__dirname, "./libex.txt");
let fileContent;

try {
    fileContent = fs.readFileSync(filePath, "utf8");
    console.log("Libex knowledge base loaded successfully");
} catch (error) {
    console.error("Error loading knowledge base:", error);
    fileContent = "Knowledge base file not found or could not be read.";
}

async function generateText(question) {
    if (responseCache.has(question)) {
        const cachedResponse = responseCache.get(question);
        if (Date.now() - cachedResponse.timestamp < CACHE_EXPIRY) {
            console.log("Cache hit for question:", question);
            return cachedResponse.text;
        } else {
            responseCache.delete(question);
        }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const generationConfig = {
        temperature: 0.7,  
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    const prompt = `You are Libex AI, a helpful assistant that exclusively uses the following information to answer questions. If the answer isn't found in this document, politely respond with "I don't have that information in my knowledge base, but I'd be happy to help with something else about Libex."
    
    Document Content:
    """${fileContent}"""
    
    Question: ${question}
    
    Answer in a helpful tone:`;

    let maxRetries = 5;
    let retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = await result.response;
            const responseText = response.text();
            
            responseCache.set(question, {
                text: responseText,
                timestamp: Date.now()
            });
            
            return responseText;
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw new Error('Max retries reached: ' + error.message);
            }

            if (error.response && [429, 503].includes(error.response.status)) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;  
            } else {
                throw error;
            }
        }
    }
}

app.post('/generate', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).send({ error: "Question is required" });
        }

        console.log("Received question:", question);
        const response = await generateText(question);
        res.send({ answer: response });
    } catch (error) {
        console.error("Error in POST /generate:", error);
        res.status(500).send({ 
            error: "Failed to generate response", 
            details: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(libexPath, 'index.html'));
});

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to use Libex AI Assistant`);
    } else {
        console.error("Server startup error:", error);
    }
});