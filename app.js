// Import required modules
const express = require('express');

// Create an Express application
const app = express();

const pdfRouter = require('./routes/createpdf')

// Define a route for the home page
app.get('/', (req, res) => {
    res.send('<h1>Hello, World 1!</h1>');
});

// Middleware to parse JSON
app.use(express.json());

app.use("/createpdf", pdfRouter)


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
