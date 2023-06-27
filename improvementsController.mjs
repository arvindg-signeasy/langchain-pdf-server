import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain, loadQARefineChain } from "langchain/chains";
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from './utils/pinecone.mjs';
import { FaissStore } from 'langchain/vectorstores/faiss';

import { config } from 'dotenv';

config();

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME

const PINECONE_NAME_SPACE = process.env.PINECONE_NAME_SPACE

const keypointsController = async (req, res) => {
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
  // const vectorstore = await PineconeStore.fromExistingIndex(
  //   new OpenAIEmbeddings({}),
  //   {
  //       pineconeIndex: index,
  //       textKey: 'text',
  //       namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
  //     },
  //   );

  const directory = 'vectorstore';

  const vectorstore = await FaissStore.load(
    directory,
    new OpenAIEmbeddings({}),
  );

  const model = new OpenAI({ temperature: 0 });

  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQARefineChain(model),
    retriever: vectorstore.asRetriever(),
  });

  const keypoints = [
    'Signer human name, Signer company name, Signer details, Signee human name, Signee company name, Signee details, Contract type, Contract details',
    'Effective date, Contract duration, Renewal term, Expiration date, Jurisdiction',
    'Notice period, Terms for renewal, Termination and expiry, Deliverables and obligations, Payment term',
    'Payment frequency, Contract value, Liability cap, Business liability, Indemnifying party'
  ];
  const info = {};

  const callChain = async () => {
    const types= [
        "salesContracts",
        "employmentContracts",
        "rentalAgreements",
        "nonDisclosureAgreements",
        "serviceLevelAgreements",
        "partnershipAgreements"
      ]
    const contractTypeKeywords = {
        salesContracts: [
          'Seller,Buyer,Goods,Services',
          'Price,Payment,Delivery',
          'Warranty,Guarantee,Termination,Cancellation',
        ],
        employmentContracts: [
          'Employer,Employee,Job Position', 
          'Salary,Compensation,Work Schedule',
          'Benefits,Termination,Resignation',
        ],
        rentalAgreements: [
          'Landlord,Tenant,Property Description',
          'Rent Amount,Lease Term',
          'Maintenance,Repairs,Security Deposit',
        ],
        nonDisclosureAgreements: [
          'Disclosing Party,Receiving Party', 
          'Purpose of Disclosure,Confidential Information,Non-Disclosure Obligations',
          'Term','Termination,Exclusions and Exceptions'
        ],
        serviceLevelAgreements: [
          'Service Provider,Customer', 
          'Services Provided,Service Level Metrics,Performance Standards',
          'Penalties,Remedies,Termination,Renewal',
        ],
        partnershipAgreements: [
          'Partners,Business Purpose',
          'Capital Contributions,Profit Sharing',
          'Decision Making,Dissolution,Exit',
        ]
    }
    const classification = await chain.call({
        query: `Classify the document into one of these - ${types.join(", ")}. Return the output as exactly one of these types. In same character case`,
      });
    const formattedString = classification.output_text.trim().replace(/^\w/, (c) => c.toLowerCase());
    const keywords = contractTypeKeywords[formattedString]
    for (const element of keywords) {
        const keyword = element;
        const res = await chain.call({
            query: `Assume you are a legal advisor. Suggest improvements to the document related to the following keywords - ${keyword}. Give the answer in format 'keyword: improvement'. Be specific`,
          });
          info[keyword] = res.output_text;
      }
  };
  
  const run = async () => {
    await callChain();
  
    console.log('All chain.call operations completed');
    console.log('info:', info);
  };

  await run();

  const formattedInfo = {}


  Object.values(info).forEach((value) => {
    const lines = value.trim().split('\n');

    lines.forEach(line => {
      const [key, value] = line.split(': ');
      formattedInfo[key] = value;
    });
  });
  

  res.json(formattedInfo);
};

export default keypointsController