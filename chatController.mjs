import fs from "fs";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from './utils/pinecone.mjs';
import { config } from 'dotenv';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const chatController = async (req, res) => {
  try {
    const model = new OpenAI({});
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
    const vectorstore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({}),
    {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
      },
    );
    /* Create the chain */
    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorstore.asRetriever(),
      {
        memory: new BufferMemory({
          memoryKey: "chat_history", // Must be set to "chat_history"
        }),
      }
    );
    /* Ask it a question */
    const question = req.body.chat;
    const chatResult = await chain.call({ question });

    // Return the response or perform any other necessary actions
    res.status(200).json({ chatResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default chatController
