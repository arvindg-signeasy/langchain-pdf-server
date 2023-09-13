import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { pinecone } from '../utils/pinecone.mjs';
import { config } from 'dotenv';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import fs from 'fs';
import { VECTOR, faissStoreWrite, pineconeStoreWrite} from "../utils/vectorstores.mjs"
import path from 'path';

const dbPath = 'embeddingDb'

async function getDocumentNameInFolder(folderPath) {
  try {
    const files = await fs.promises.readdir(folderPath);

    // Filter out subfolders (if any) and get the name of the only document (file)
    const documentName = files.find(async (file) => (await fs.promises.stat(path.join(folderPath, file))).isFile());

    if (documentName) {
      return documentName
    } else {
      console.log('No document found in the folder.');
    }
  } catch (err) {
    console.error('Error reading folder:', err);
  }
}

function createDbFolder(filename) {
  const cleanedFilename = filename
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase() // Convert to lowercase
    .replace(/\.[^.]+$/, ''); // Remove file extension (e.g., .pdf)
  const dbFolderName = `${cleanedFilename}-db`; // Create the folder name by appending '-db'
  const dbFolderPath = path.join(dbPath, dbFolderName); // Combine parent folder path with the new folder name

  fs.mkdir(dbFolderPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating db folder:', err);
    } else {
      console.log('Db folder created successfully:', dbFolderPath);
    }
  });

  return dbFolderPath
}

config();

const filePath = 'uploads'; // Directory containing the uploaded files

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const embeddingController = async (req, res) => {
  try {
    const fileName = await getDocumentNameInFolder(filePath);
    const folderPath =  await createDbFolder(fileName);
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

      await faissStoreWrite(rawDocs, folderPath)
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