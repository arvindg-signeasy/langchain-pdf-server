import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { FaissStore } from "langchain/vectorstores/faiss";
import { pinecone } from './utils/pinecone.mjs';
import { config } from 'dotenv';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

config();

const filePath = 'uploads'; // Directory containing the uploaded files

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const embeddingController = async (req, res) => {
  try {
    /* Delete all existing vectors */
    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
    await pineconeIndex.delete1({ deleteAll: true , namespace: PINECONE_NAME_SPACE});
    const indexStats = await pineconeIndex.describeIndexStats({
      describeIndexStatsRequest: {},
    });

    console.log(12, indexStats)

    /* Load raw docs from all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
    });

    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);

    console.log('Creating vector store...');

    /* FAISS */

    const vectorStore = await FaissStore.fromDocuments(
      rawDocs,
      new OpenAIEmbeddings()
    );

    const directory = "vectorstore";

    await vectorStore.save(directory);

    /* PINECONE */
    // const embeddings = new OpenAIEmbeddings();
    // const index = pinecone.Index(PINECONE_INDEX_NAME);

    // // Embed the PDF documents
    // await PineconeStore.fromDocuments(docs, embeddings, {
    //   pineconeIndex: index,
    //   namespace: PINECONE_NAME_SPACE,
    //   textKey: 'text',
    // });


    res.json({ message: 'Embedding successful' });
  } catch (error) {
    console.log('error', error);
    res.status(500).send('Failed to process embeddings');
  }
};

export default embeddingController