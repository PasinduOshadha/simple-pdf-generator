// Import required modules
const express = require('express');
const cors = require('cors');
require('dotenv').config()

// Create an Express application
const app = express();
const pdfRouter = require('./routes/createpdf');
const ENV =  process.env.NODE_ENV || 'development';
const allowedOrigins = ["https://drgoh.techsphereglobal.dev", "https://drgoh.com.au", "http://locahost:3000"];

// enable CORS
app.use(cors({
    origin: allowedOrigins
  }));

// Define a route for the home page
app.get('/', (req, res) => {
    res.send(`<h1>Hello, World env: ${ENV}!</h1>`);
});

// Middleware to parse JSON
app.use(express.json());
app.use("/createpdf", pdfRouter)

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
