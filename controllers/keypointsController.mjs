import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { vectorStoreRead } from '../utils/vectorstores.mjs'
import { storeDocument, getDocumentDetails } from '../firebase/index.mjs';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const keypointsController = async (req, res) => {
  const uploadsFolderPath = path.join(process.cwd(), 'uploads');
    
    // Read the list of files in the uploads folder
    const files = fs.readdirSync(uploadsFolderPath);
    
    // Find the file based on your criteria
    const desiredFile = files[0]

  const vectorstore = await vectorStoreRead()

  const model = new OpenAI({ temperature: 0 });

  const dbDocumentDetails = await getDocumentDetails(desiredFile)
  let formattedInfo = {}
  if(false && dbDocumentDetails?.keypoints){
    // formattedInfo = dbDocumentDetails?.keypoints
  } else {
    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQARefineChain(model),
      retriever: vectorstore.asRetriever(),
    });
  
    const keypoints = [
      'Parties Involved, Signer human name, Signer company name, Signer details, Signee human name, Signee company name, Signee details, Contract type',
      'Effective date, Contract duration, Renewal term, Expiration date, Jurisdiction',
      'Notice period, Terms for renewal, Termination and expiry, Deliverables and obligations, Payment term',
      'Payment frequency, Contract value, Liability cap, Business liability, Indemnifying party'
    ];
    const info = {};
  
    const processQueue = async (queue) => {
      if (queue.length === 0) return;
    
      const item = queue.shift();
      const res = await chain.call({
        query: `Find the values for the following fields - ${item}. Be precise and specific. Only provide information that is explicitly mentioned and return N/A for invalid values. Format output in key value pairs`,
      });
    
      info[item] = res.output_text;
    
      await processQueue(queue);
    };
    
    const run = async () => {
      await processQueue([...keypoints]);
    
      console.log('All chain.call operations completed');
      console.log('info:', info);
    };
    
    await run();
  
    Object.values(info).forEach((value) => {
      const lines = value.trim().split('\n');
  
      lines.forEach(line => {
        const [key, value] = line.split(': ');
        if(value){
          formattedInfo[key] = value;
        }
      });
    });

    await storeDocument(desiredFile, { keypoints: formattedInfo})
  }

  console.log(formattedInfo);

  res.json(formattedInfo);
};

export default keypointsController