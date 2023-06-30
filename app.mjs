import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import uploadsController from './uploadsController.mjs';
import embeddingController from './embeddingController.mjs';
import keypointsController from './keypointsController.mjs';
import summariseController from './summariseController.mjs';
import chatController from './chatController.mjs';
import smallKeypointsController from './smallKeypointsController.mjs';
import smallChatController from './smallChatController.mjs';
import csvInsightController from './csvInsightController.mjs';
import jsonInsightController from './jsonInsightController.mjs';
import improvementsController from './improvementsController.mjs';




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


// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});