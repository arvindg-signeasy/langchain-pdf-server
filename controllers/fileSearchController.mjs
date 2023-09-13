import fs from 'fs';
import { VECTOR, faissStoreWrite, pineconeStoreWrite, pineconeSearch } from "../utils/vectorstores.mjs";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { config } from 'dotenv';
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pinecone } from '../utils/pinecone.mjs';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from "langchain/document";


config();

const filePath = 'fileSearch'; // Directory containing the files

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const FileSearchController = {
  getFiles: async (req, res) => {
    try {
      const files = fs.readdirSync(filePath);
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
    //   for( let i = 0; i < files.length; i++){
    //     const file = files[i]
    //     const loader = new PDFLoader(`fileSearch/${file}`);

    //     const rawDocs = await loader.load();
    //     const pineconeClient = await pinecone()

    //     const textSplitter = new RecursiveCharacterTextSplitter({
    //         chunkSize: 1000,
    //         chunkOverlap: 200,
    //       });
      
    //       const docs = await textSplitter.splitDocuments(rawDocs);

    //       const documentsWithMetadata = docs.map((doc) => {
    //         return new Document({
    //           metadata: { fileName: file }, // Replace with your desired metadata
    //           pageContent: doc.pageContent,
    //         });
    //       });

    //       await pineconeStoreWrite(documentsWithMetadata)
    //   }
    // await pineconeStoreWrite(docs)
      res.json({ files });
    } catch (error) {
      console.log('Error reading files:', error);
      res.status(500).send('Failed to read files');
    }
  },

  searchFiles: async (req, res) => {
    try {
      const { searchTerm } = req.body;
        // Perform search using Pinecone vector store
        const searchResults = await pineconeSearch(searchTerm);
        res.json({ searchResults });
     } catch (error) {
      console.log('Error searching files:', error);
      res.status(500).send('Failed to search files');
     }
  }
};

export default FileSearchController;