const express = require('express');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  const { GoogleAIFileManager } = require("@google/generative-ai/server");

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
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
      mimeType,
      displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
  }


  async function waitForFilesActive(files) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
      let file = await fileManager.getFile(name);
      while (file.state === "PROCESSING") {
        process.stdout.write(".")
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        file = await fileManager.getFile(name)
      }
      if (file.state !== "ACTIVE") {
        throw Error(`File ${file.name} failed to process`);
      }
    }
    console.log("...all files ready\n");
  }

//read the file about the information about libex
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


      const files = [
        await uploadToGemini("libex.txt", "text/plain"),
      ];
    
      // Some files have a processing delay. Wait for them to be ready.
      await waitForFilesActive(files);

    const prompt = `You are an AI assistant that only knows the following information:
    """${fileContent}"""
    Answer based on this document You may paraphrase, explain in different terms. If the answer is not found, say "I don’t have that information."
    Question: ${question}`;


    //TODO change to include history
    const result = await model.generateContent(prompt);
    const response = await result.response;
   return response.text();
}

app.get('/generate', async (req, res) => {
   // const question = req.query.question;
   // console.log(question)
    const response = await generateText("where can I find the information about libex");
    res.send(response);
});

app.post('/generate', async (req, res) => {
    // const question = req.query.question;
    // console.log(question)

    const question = req.body.question;
    console.log(question);

     const response = await generateText(question);
     const answer = {
        answer: response
     }
     res.send(answer);
 });
 
 
 



app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, " +
                   "and App is listening on port " + PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
