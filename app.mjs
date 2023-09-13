import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import uploadsController from './controllers/uploadsController.mjs';
import embeddingController from './controllers/embeddingController.mjs';
import keypointsController from './controllers/keypointsController.mjs';
import summariseController from './controllers/summariseController.mjs';
import chatController from './controllers/chatController.mjs';
import smallKeypointsController from './controllers/smallKeypointsController.mjs';
import smallChatController from './controllers/smallChatController.mjs';
import csvInsightController from './controllers/csvInsightController.mjs';
import jsonInsightController from './controllers/jsonInsightController.mjs';
import improvementsController from './controllers/improvementsController.mjs';
import fileSearchController from './controllers/fileSearchController.mjs';
import seChatController from './controllers/seChatController.mjs';
import seKeypointsController from './controllers/seKeypointsController.mjs';
import seSummaryController from './controllers/seSummaryController.mjs';




// Create an Express app
const app = express();
app.use(cors());
app.use(express.json());


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads'); // specify the destination folder
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileExtension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
    },
  });
  
const upload = multer({ storage });
  

// Define a route handler for the root URL
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/upload', uploadsController);

app.get('/embedding', embeddingController);

app.get('/keypoints', keypointsController);

app.get('/summary', summariseController);

app.post('/chat', chatController);

app.post('/smallchat', smallChatController);

app.post('/jsoninsight', jsonInsightController);

app.get('/csvinsight', csvInsightController);

app.get('/smallkeypoints', smallKeypointsController);

app.get('/improvement', improvementsController);

app.get('/fileSearch', fileSearchController.getFiles);

app.post('/fileSearch', fileSearchController.searchFiles);

app.post('/se-chat', seChatController);

app.post('/se-keypoints', seKeypointsController);

app.post('/se-summary', seSummaryController);


// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});