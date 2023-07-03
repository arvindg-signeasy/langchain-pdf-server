import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pinecone } from '../utils/pinecone.mjs';
import { config } from 'dotenv';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import fs from 'fs';
import { VECTOR, faissStoreWrite, pineconeStoreWrite} from "../utils/vectorstores.mjs"

config();

const filePath = 'uploads'; // Directory containing the uploaded files

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const embeddingController = async (req, res) => {
  try {
     /* Load raw docs from all files in the directory */
     const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
      '.xlsx': (path) => new CSVLoader(path),
      '.csv': (path) => new CSVLoader(path)
    });

    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);

    console.log('Creating vector store...');

    if( VECTOR === 'faiss' ){

      const folderName = 'vectorstore';
      // Delete the folder if it exists
      if (fs.existsSync(folderName)) {
        fs.rmdirSync(folderName, { recursive: true });
        console.log(`Deleted folder: ${folderName}`);
      }

      // Create a new folder
      fs.mkdirSync(folderName);
      console.log(`Created folder: ${folderName}`);

      await faissStoreWrite(rawDocs)

    } 

    if( VECTOR === 'pinecone' ){

          /* Delete all existing vectors */
      const pineconeClient = await pinecone()
      const pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
      await pineconeIndex.delete1({ deleteAll: true , namespace: PINECONE_NAME_SPACE});
      await pineconeStoreWrite(docs)

    }


    res.json({ message: 'Embedding successful' });
  } catch (error) {
    console.log('error', error);
    res.status(500).send('Failed to process embeddings');
  }
};

export default embeddingController