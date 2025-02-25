const express = require('express');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const fs = require('fs');
const app = express();
const PORT = 3000;
const cors = require('cors');

require("dotenv").config({ path: "../.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*'
}));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const filePath = "./libex.txt";
const fileContent = fs.readFileSync(filePath, "utf8");

async function generateText(question) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const generationConfig = {
        temperature: 0.9,  // Corrected to valid value
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    const prompt = `You are an AI assistant that exclusively uses the following information to answer questions. If the answer isn't found here, respond with "I don't have that information."
    
    Document Content:
    """${fileContent}"""
    
    Question: ${question}
    
    Answer:`;

    let maxRetries = 5;
    let retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw new Error('Max retries reached: ' + error.message);
            }

            // Check for 429 (Too Many Requests) or 503 (Service Unavailable)
            if (error.response && [429, 503].includes(error.response.status)) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;  // Correct exponential backoff
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

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server running on port ${PORT}`);
    } else {
        console.error("Server startup error:", error);
    }
});