import { getDocumentDetails } from '../firebase/index.mjs';

const seKeypointsController = async (req, res) => {
  try {
    const { fileName } = req.body; // Fetch the fileName from the request body
    const dbDocumentDetails = await getDocumentDetails(fileName);
    let formattedInfo = {};

    // Check if the keypoints data exists in the document details fetched from Firebase
    if (dbDocumentDetails?.keypoints) {
      // If keypoints data exists, use it
      formattedInfo = dbDocumentDetails?.keypoints;
    } 

    res.json(formattedInfo);
  } catch (error) {
    console.error('Error in seKeypointsController:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export default seKeypointsController;