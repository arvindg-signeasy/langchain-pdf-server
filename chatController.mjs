import fs from "fs";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain, RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from './utils/pinecone.mjs';
import { config } from 'dotenv';
import { FaissStore } from 'langchain/vectorstores/faiss';


config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const chatController = async (req, res) => {
  try {
    const model = new OpenAI({});
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const directory = 'vectorstore';

    const vectorstore = await FaissStore.load(
      directory,
      new OpenAIEmbeddings({}),
    );
    /* create vectorstore*/
    // const vectorstore = await PineconeStore.fromExistingIndex(
    // new OpenAIEmbeddings({}),
    // {
    //     pineconeIndex: index,
    //     textKey: 'text',
    //     namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
    //   },
    // );
    /* Create the chain */
    
  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQARefineChain(model),
    retriever: vectorstore.asRetriever(),
  });
    /* Ask it a question */
    const query = req.body.chat;
    const resultOne = await vectorstore.similaritySearch("Benazir Chatur", 4);
    console.log(resultOne)
    const chatResult = await chain.call({ query });

    // Return the response or perform any other necessary actions
    res.status(200).json({ chatResult: chatResult.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default chatController
