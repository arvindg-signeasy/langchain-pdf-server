import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQARefineChain, loadQAStuffChain } from "langchain/chains";
import { config } from 'dotenv';
import { vectorStoreRead } from '../utils/vectorstores.mjs'


config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const chatController = async (req, res) => {
  try {
    const model = new OpenAI({ temperature: 1});
    const directory = 'vectorstore';

    const vectorstore = await vectorStoreRead()
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
    combineDocumentsChain: loadQAStuffChain(model),
    retriever: vectorstore.asRetriever(1),
  });
    /* Ask it a question */
    const query = req.body.chat;
    const chatResult = await chain.call({ query });

    // Return the response or perform any other necessary actions
    res.status(200).json({ chatResult: chatResult.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default chatController
