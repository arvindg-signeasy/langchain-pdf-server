import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist';

const filePath = 'uploads'; // Directory containing the uploaded files

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

const smallKeypointsController = async (req, res) => {

    parsePDF()
        .then(async (text) => {
            console.log('Formatted Text:');
            console.log(text);
            const finalText = text.replace(/\n/g, '');
            const keypoints = [
                'Signer human name, Signer company name, Signer details, Signee human name, Signee company name, Signee details, Contract type',
                'Effective date, Contract duration, Renewal term, Expiration date, Jurisdiction',
                'Notice period, Terms for renewal, Termination and expiry, Deliverables and obligations, Payment term',
                'Payment frequency, Contract value, Liability cap, Business liability, Indemnifying party'
              ];
            const template = `Use the context provided - {context}. Derive the following keypoints -  {keypoints}. Format output in key value pairs`;
        const prompt = new PromptTemplate({
            template: template,
            inputVariables: ["context","keypoints"],
        });
        const intermediateSteps = [];
        const model = new OpenAI({ temperature: 0 });
        const chain = new LLMChain({ llm: model, prompt: prompt });
        const info = {}
        const processQueue = async (queue) => {
            if (queue.length === 0) return;
          
            const item = queue.shift();
            const res = await chain.call({
              context: finalText,
              keypoints: item
            });
          
            info[item] = res.text;
          
            await processQueue(queue);
          };
          
          const run = async () => {
            await processQueue([...keypoints]);
          
            console.log('All chain.call operations completed');
            console.log('info:', info);
          };
          
          await run();
        
          const formattedInfo = {};
        
          Object.values(info).forEach((value) => {
            const lines = value.trim().split('\n');
        
            lines.forEach(line => {
              const [key, value] = line.split(': ');
              formattedInfo[key] = value;
            });
          });
        
          console.log(formattedInfo);
        
          res.json(formattedInfo);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
  }
  
  export default smallKeypointsController;
  