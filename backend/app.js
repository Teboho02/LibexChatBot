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

// Read the file about the information about libex
const filePath = "./libex.txt";
const fileContent = fs.readFileSync(filePath, "utf8");

async function generateText(question) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const generationConfig = {
        temperature: 1.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    const prompt = `You are an AI assistant that only knows the following information:
    """${fileContent}"""
    Answer based on this document You may paraphrase, explain in different terms. If the answer is not found, say "I don't have that information."
    Question: ${question}`;

    // Add retry logic
    let maxRetries = 5;
    let retryDelay = 2000; // Start with 2 seconds delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.log(`Attempt ${attempt} failed: ${error.message}`);
            
            // If this is the last attempt, throw the error
            if (attempt === maxRetries) {
                throw error;
            }
            
            // If it's a 503 error, wait and retry with exponential backoff
            if (error.status === 503) {
                console.log(`Retrying in ${retryDelay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 1; // Exponential backoff
            } else {
                // For other errors, just throw immediately
                throw error;
            }
        }
    }
}

app.get('/generate', async (req, res) => {
    try {
        const response = await generateText("where can I find the information about libex");
        res.send(response);
    } catch (error) {
        console.error("Error in GET /generate:", error);
        res.status(500).send({ error: "Failed to generate response", details: error.message });
    }
});

app.post('/generate', async (req, res) => {
    try {
        const question = req.body.question;
        console.log("Received question:", question);

        const response = await generateText(question);
        const answer = {
            answer: response
        }
        res.send(answer);
    } catch (error) {
        console.error("Error in POST /generate:", error);
        res.status(500).send({ error: "Failed to generate response", details: error.message });
    }
});

app.listen(PORT, (error) => {
    if(!error)
        console.log("Server is Successfully Running, " +
                   "and App is listening on port " + PORT)
    else 
        console.log("Error occurred, server can't start", error);
});