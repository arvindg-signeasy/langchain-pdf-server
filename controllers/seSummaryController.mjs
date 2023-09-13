import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getDocumentDetails } from '../firebase/index.mjs';

config();

const __dirname = path.resolve();

function splitParagraphIntoSentences(paragraph) {
    // Use a regular expression to match sentence-ending punctuation marks (. ? !) followed by a space or the end of the paragraph.
    const sentenceRegex = /[^.!?]*[.!?]+[^\s.]*(?=\s|$)/g;
    
    // Use the match method with the regex to split the paragraph into an array of sentences.
    const sentences = paragraph.match(sentenceRegex);
  
    return sentences;
  }

const seSummaryController = async (req, res) => {
  try {
    // Extract the fileName from the request payload
    const { fileName } = req.body;

    // Check if the fileName exists in Firebase and retrieve the summary if available
    const dbDocumentDetails = await getDocumentDetails(fileName);
    let summary = "No summary found";
    let sentencesArray = []

    if (dbDocumentDetails?.summary) {
      // If the summary exists in Firebase, use it
      summary = dbDocumentDetails?.summary;
      sentencesArray = splitParagraphIntoSentences(summary.text);
    }

    return res.status(200).json({ result: sentencesArray });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default seSummaryController;