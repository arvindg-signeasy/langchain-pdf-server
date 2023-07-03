const jsonInsightController = async (req, res) => {
    try {
      const payload = req.body;
      console.log(payload); // Print the payload to the console
      
      // Your logic here...
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  };
  
  export default jsonInsightController;