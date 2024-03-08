const express = require('express');
const PDFDocument = require('pdfkit'); // Import PDFDocument
const fs = require('fs'); // Import fs
const request = require('request');
const router = express.Router();
const path = require('path'); 
const nodemailer = require("nodemailer");

const BREVO_USER = process.env.BREVO_USER;
const BREVO_PASS = process.env.BREVO_PASS;


// Define the folder where PDFs will be saved
const pdfFolder = 'submitted-pdf';


// Create the folder if it doesn't exist
if (!fs.existsSync(pdfFolder)) {
    fs.mkdirSync(pdfFolder);
}

router.post('/', async (req, res) => {

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
    try {
        const imageData = await getImageData(image);
        doc.image(imageData, { width: 200 });

        // Close the stream after PDF generation is complete
        doc.end();
        console.log('PDF generated successfully');

        // Send email with PDF attachment
        const emailData = await sendEmailWithAttachment(email, filename);

        // Send a response indicating successful PDF generation and email sending
        res.json(
            {
                message: 'PDF generated and email sent successfully',
                emailData: emailData
            }
        );

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred while generating PDF or sending email.');
    }


})

async function getImageData(imageUrl) {
    return new Promise((resolve, reject) => {
        request.get(imageUrl, { encoding: null }, (err, response, body) => {
            if (err || response.statusCode !== 200) {
                reject(err || `Failed to fetch image from ${imageUrl}`);
            } else {
                const base64Image = Buffer.from(body).toString('base64');
                const dataUrl = `data:image/jpeg;base64,${base64Image}`;
                resolve(dataUrl);
            }
        });
    });
}

async function sendEmailWithAttachment(receiverEmail, attachmentPath) {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
            user: BREVO_USER, // your Gmail account
            pass: BREVO_PASS // your Gmail password
        }
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Your Name" <mailbox.pasindu@gmail.com>', // sender address
        to: 'mailbox.pasindu@gmail.com', // list of receivers
        subject: `New Submission from ${receiverEmail}`, // Subject line
        text: `New submission from: ${receiverEmail}`, // plain text body
        attachments: [
            {
                filename: `submission_${receiverEmail}.pdf`,
                path: attachmentPath,
                contentType: 'application/pdf'
            }
        ]
    });

    console.log('Email sent: %s', info.messageId);
}

router.use('/submitted-pdf', express.static(path.join(__dirname, pdfFolder)));


module.exports = router