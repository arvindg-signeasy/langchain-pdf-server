import { FaissStore } from 'langchain/vectorstores/faiss';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { config } from 'dotenv';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const directory = "vectorstore";

export const VECTOR = 'faiss'

export const faissStoreWrite = async (rawDocs) => {
    const vectorStore = await FaissStore.fromDocuments(
        rawDocs,
        new OpenAIEmbeddings()
      );
  
      await vectorStore.save(directory);
  };

export const faissStoreRead = async () => {
    const vectorstore = await FaissStore.load(
        directory,
        new OpenAIEmbeddings(),
      )
    return vectorstore
  };

export const pineconeStoreWrite = async (docs) => {
    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
        pineconeIndex: PINECONE_INDEX_NAME,
        namespace: PINECONE_NAME_SPACE,
        textKey: 'text',
      });
}

export const pineconeStoreRead = async () => {
  const vectorstore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({}),
    {
        pineconeIndex: PINECONE_INDEX_NAME,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
      },
    );
    return vectorstore
}

export const vectorStoreRead = async () => {
    if(VECTOR === 'faiss'){
        return faissStoreRead()
    }
    if(VECTOR === 'pinecone'){
        return pineconeStoreRead()
    }
}

