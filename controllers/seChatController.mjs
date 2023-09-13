import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { config } from 'dotenv';
import { vectorStoreRead } from '../utils/vectorstores.mjs'

const chatController = async (req, res) => {
  try {
  const { fileName, text } = req.body; // Fetch the fileName from the request body
  const cleanedFilename = fileName
  .replace(/\s+/g, '_') // Replace spaces with underscores
  .toLowerCase() // Convert to lowercase
  .replace(/\.[^.]+$/, ''); // Remove file extension (e.g., .pdf)
  const dbFolderName = `${cleanedFilename}-db`; // Create the folder name by appending '-db'
  const model = new OpenAI({ temperature: 1});
  const directory = `embeddingDb/${dbFolderName}`;

  const vectorstore = await vectorStoreRead(directory)
    
  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model),
    retriever: vectorstore.asRetriever(1),
  });
    /* Ask it a question */
    const chatResult = await chain.call({ query: text });

    // Return the response or perform any other necessary actions
    res.status(200).json({ chatResult: chatResult.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default chatController
