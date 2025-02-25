const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const app = express();
const PORT = 3000;


require("dotenv").config({ path: "../.env" });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

//read the file about the information about libex
const filePath = "./libex.txt";
const fileContent = fs.readFileSync(filePath, "utf8");

console.log(fileContent)
async function generateText(question) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an AI assistant that only knows the following information:
    """${fileContent}"""
    Answer based on this document. If the answer is not found, say "I don’t have that information."
    Question: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(await response.text());
}

app.get('/generate', async (req, res) => {
    //const question = req.query.question;
  //  console.log(question)
    const response = await generateText("what is an nft");
    res.send(response);
});



app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, " +
                   "and App is listening on port " + PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
