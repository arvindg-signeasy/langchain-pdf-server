import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Define the path to the uploads folder
const __dirname = path.resolve();

// Create a multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Create a multer upload instance with the storage configuration
const upload = multer({ storage });

// Route handler for the /upload API
const uploadFile = async (req, res) => {
  // Delete existing files in the uploads folder
  await deleteUploads();

  // Use the multer upload middleware to handle the file upload
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Handle any upload error
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed' });
    } else {
      // File uploaded successfully
      res.json({ message: 'File uploaded successfully!' });
    }
  });
};

// Function to delete all files in the uploads folder
const deleteUploads = async () => {
  const files = await fs.promises.readdir(path.join(__dirname, 'uploads'));

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(__dirname, 'uploads', file);
      try {
        await fs.promises.unlink(filePath);
        console.log(`Deleted file: ${file}`);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    })
  );
};

export default uploadFile;
