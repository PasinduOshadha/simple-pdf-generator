const express = require('express');
const PDFDocument = require('pdfkit'); // Import PDFDocument
const fs = require('fs'); // Import fs
const request = require('request');
const router = express.Router();

// Define the folder where PDFs will be saved
const pdfFolder = 'submitted-pdf';

// Create the folder if it doesn't exist
if (!fs.existsSync(pdfFolder)) {
    fs.mkdirSync(pdfFolder);
}

router.post('/', (req, res) => {

    const { firstName, lastName, email, image } = req.body;

    // Create a new PDF document
    const doc = new PDFDocument();


    // Define the filename with the firstname
    const currentDateTime = new Date().toISOString().replace(/:/g, '-');
    const filename = `${pdfFolder}/${firstName}_${currentDateTime}.pdf`;


    // Pipe the PDF to a writable stream (in this case, a file)
    const stream = fs.createWriteStream(filename);

    // Add content to the PDF
    doc.pipe(stream);
    doc.fontSize(16).text(`Firstname: ${firstName}`);
    doc.fontSize(16).text(`Lastname: ${lastName}`);
    doc.fontSize(16).text(`Email: ${email}`);

    // Fetch image from the provided URL and embed it in the PDF
    request.get(image, { encoding: null }, (err, response, body) => {
        if (!err && response.statusCode === 200) {
            // Convert the fetched image buffer to a data URL
            const base64Image = Buffer.from(body).toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;

            // Embed the image in the PDF
            doc.image(dataUrl, { width: 200 });
        } else {
            console.error(err || `Failed to fetch image from ${image}`);
        }

        // Close the stream after PDF generation is complete
        doc.end();
        console.log('PDF generated successfully');
        // Send a response indicating successful PDF generation
        res.json({ message: 'PDF generated successfully' });
    });

    
})

module.exports = router