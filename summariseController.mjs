import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

config();

const __dirname = path.resolve();

const summariseController = async (req, res) => {
  try {
    const uploadsFolderPath = path.join(process.cwd(), 'uploads');
    
    // Read the list of files in the uploads folder
    const files = fs.readdirSync(uploadsFolderPath);
    
    // Find the file based on your criteria
    const desiredFile = files[0]
    
    // Check if the desired file was found
    let rawDocs
    if (desiredFile) {
      // Construct the full path to the file
      const pdfPath = path.join(uploadsFolderPath, desiredFile);
    
      // Continue with your code to load the PDF
      const pdfLoader = new PDFLoader(pdfPath);
      rawDocs = await pdfLoader.load();
    
      // Rest of your code...
    } else {
      console.log('File not found.');
    }

  const model = new OpenAI({ temperature: 0 });
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.splitDocuments(rawDocs);

    // This convenience function creates a document chain prompted to summarize a set of documents.
    const chain = loadSummarizationChain(model, {
      type: "map_reduce",
    });
    const summary = await chain.call({
      input_documents: docs,
    });

    return res.status(200).json({ result: summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default summariseController
