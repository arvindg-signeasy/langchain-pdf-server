import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist';

async function parsePDF() {
    const uploadsFolderPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'uploads');

    // Read the uploads folder
    const files = await fs.promises.readdir(uploadsFolderPath);
    
    if (files.length === 0) {
      throw new Error('No files found in the "uploads" folder.');
    } else if (files.length > 1) {
      throw new Error('Multiple files found in the "uploads" folder. Expecting only one file.');
    }

    const pdfFileName = files[0];
    const pdfPath = path.join(uploadsFolderPath, pdfFileName);
  //   const pdfBuffer = await fs.promises.readFile(pdfPath);

    // Load the PDF document
     const loadingTask = pdfjsLib.getDocument(pdfPath);
const pdfDocument = await loadingTask.promise;

const numPages = pdfDocument.numPages;
let textContent = '';

for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
  const page = await pdfDocument.getPage(pageNumber);
  const content = await page.getTextContent();
  const textItems = content.items;

  // Extract text from individual text items
  for (let i = 0; i < textItems.length; i++) {
    const textItem = textItems[i];
    textContent += textItem.str + ' ';
  }
}

return textContent;
}

const smallChatController = async (req, res) => {
  try {
    parsePDF()
    .then(async (text) => {
        const model = new OpenAI({});
        const memory = new BufferMemory();
        /* Create the chain */
        const chain = new ConversationChain({ llm: model, memory: memory });
    
        /* Ask it a question */
        const question = req.body.chat;
        const count = req.body.count
        const input = `This is the document - ${text}. You are a helpful advisor. Answer the following question - ${question}`
        const chatResult = await chain.call({ input });
    
        // Return the response or perform any other necessary actions
        res.status(200).json({ chatResult });
    }).catch((error) => {console.log(error)})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default smallChatController
