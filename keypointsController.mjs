import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from './utils/pinecone.mjs';
import { FaissStore } from 'langchain/vectorstores/faiss';

import { config } from 'dotenv';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const keypointsController = async (req, res) => {
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
  // const vectorstore = await PineconeStore.fromExistingIndex(
  //   new OpenAIEmbeddings({}),
  //   {
  //       pineconeIndex: index,
  //       textKey: 'text',
  //       namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
  //     },
  //   );

  const directory = 'vectorstore';

  const vectorstore = await FaissStore.load(
    directory,
    new OpenAIEmbeddings({}),
  );

  const model = new OpenAI({ temperature: 0 });

  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQARefineChain(model),
    retriever: vectorstore.asRetriever(),
  });

  const keypoints = [
    'Signer human name, Signer company name, Signer details, Signee human name, Signee company name, Signee details, Contract type, Contract details',
    'Effective date, Contract duration, Renewal term, Expiration date, Jurisdiction',
    'Notice period, Terms for renewal, Termination and expiry, Deliverables and obligations, Payment term',
    'Payment frequency, Contract value, Liability cap, Business liability, Indemnifying party'
  ];
  const info = {};

  const processQueue = async (queue) => {
    if (queue.length === 0) return;
  
    const item = queue.shift();
    const res = await chain.call({
      query: `Find the values for the following fields - ${item}. Be precise and specific. Only provide information that is explicitly mentioned`,
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
};

export default keypointsController