import { FaissStore } from 'langchain/vectorstores/faiss';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { config } from 'dotenv';
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { pinecone } from '../utils/pinecone.mjs';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const directory = "vectorstore";

export const VECTOR = 'faiss'

export const faissStoreWrite = async (rawDocs, folderDirectory) => {
    const vectorStore = await FaissStore.fromDocuments(
        rawDocs,
        new OpenAIEmbeddings()
      );
  
      await vectorStore.save(folderDirectory || directory);
  };

export const faissStoreRead = async (fileDirectory) => {
    const vectorstore = await FaissStore.load(
        fileDirectory || directory,
        new OpenAIEmbeddings(),
      )
    return vectorstore
  };

export const pineconeStoreWrite = async (docs) => {
  const embeddings = new OpenAIEmbeddings();
  const pineconeClient = await pinecone()
  const pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
  const pineconeStore = new PineconeStore(embeddings, { pineconeIndex });
  await pineconeStore.addDocuments(docs);
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

export const vectorStoreRead = async (directory) => {
    if(VECTOR === 'faiss'){
        return faissStoreRead(directory)
    }
    if(VECTOR === 'pinecone'){
        return pineconeStoreRead()
    }
}

export const pineconeSearch = async (searchWord) => {
  const embeddings = new OpenAIEmbeddings();
  const pineconeClient = await pinecone()
  const pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
  const pineconeStore = new PineconeStore(embeddings, { pineconeIndex });
  const results = await pineconeStore.similaritySearch(searchWord, 20);
  return results
}

