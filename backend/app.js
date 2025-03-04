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

require("dotenv").config({ path: path.resolve(__dirname, ".env") });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*'
}));


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

async function generateText(question, messages) {
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
        temperature: 0.5,  // Lower temperature for more focused responses
        topP: 0.8,        // Reduced for more deterministic outputs
        topK: 20,         // Reduced for more focused token selection
        maxOutputTokens: 1024, // Significantly reduced max output tokens
        responseMimeType: "text/plain",
    };
    // Enhanced prompt for better token efficiency
    const prompt = `You are Libex AI, a concise assistant focused on blockchain, NFTs, and fintech.
    
    Guidelines:
    - Keep responses under 100 words
    - Use simple, direct language
    - Focus only on essential information
    - Avoid repetition
    
    Context:
    """${fileContent}"""
    
    Previous: ${JSON.stringify(messages)}
    Question: ${question}
    
    Provide a brief, focused response.`;
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
        const {messages} = req.body;


        if (!question) {
            return res.status(400).send({ error: "Question is required" });
        }

        console.log("Received question:", question);
        const response = await generateText(question, messages);
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
    res.send("Libex AI Assistant is running.");
});

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to use Libex AI Assistant`);
    } else {
        console.error("Server startup error:", error);
    }
});