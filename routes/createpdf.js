const express = require('express');
const PDFDocument = require('pdfkit'); // Import PDFDocument
const fs = require('fs'); // Import fs
const request = require('request');
const router = express.Router();
const path = require('path');
const nodemailer = require("nodemailer");
require('dotenv').config()

const BREVO_USER = process.env.BREVO_USER;
const BREVO_PASS = process.env.BREVO_PASS;

const ENV =  process.env.NODE_ENV || 'development';
const cc_recipients =  ['mailbox.pasindu@gmail.com', 'devakaguna@gmail.com'];

// Define the folder where PDFs will be saved
const pdfFolder = 'submitted-pdf';

console.log(ENV);

// Create the folder if it doesn't exist
if (!fs.existsSync(pdfFolder)) {
    fs.mkdirSync(pdfFolder);
}

router.post('/', async (req, res) => {


    const {
        location,
        patientName,
        patientDOB,
        patientContact,
        patientAddress,
        urgency,
        diagnosis,
        otherDiagnosis,
        visualAcuityRight,
        visualAcuityLeft,
        intraocularPressureRight,
        intraocularPressureLeft,
        otherComments,
        refName,
        refProviderNo,
        refPhone,
        refDate,
        refAddress,
        refSign,
    } = req.body;

    // setting the destination email address
    const email = location === "Bundoora - Northern Eye Consultants" ? 'douglastsoi@s-trend.com.au' : 'linnahe@s-trend.com.au';
    const currentDate = new Date().toLocaleString();

    // email body 
    let emailBody = `<div style="font-weight:bold;font-size:22px;margin-bottom:30px;">New Submission from Referral Form</div>`;
    emailBody += `<div style="font-weight:bold;font-size:20px;">Patient Details</div>`;
    emailBody += `<div>Name: ${patientName}
    Date of Birth: ${patientDOB}
    Contact Number: ${patientContact}
    Address: ${patientAddress}
    </div>`;

    emailBody += `<div">Urgency: ${urgency}</div>`;
    if (otherDiagnosis) {
        emailBody += `<div style="margin-bottom:20px;">Diagnosis: ${diagnosis}
        Diagnosis Details: ${otherDiagnosis}</div>`;
    }
    else {
        emailBody += `<div style="margin-bottom:20px;">Diagnosis: ${diagnosis}</div>`;
    }
    emailBody += `<div style="font-weight:bold;font-size:20px;">Visual Acuity</div>`;
    emailBody += `<div style="margin-bottom:20px;"> Right: ${visualAcuityRight}
    Left: ${visualAcuityLeft}
    </div>`;

    emailBody += `<div style="font-weight:bold;font-size:20px;">Intraocular Pressure</div>`;
    emailBody += `<div style="margin-bottom:20px;"> Right: ${intraocularPressureRight} 
    Left: ${intraocularPressureLeft}
    </div>`;

    emailBody += `<div style="font-weight:bold;font-size:20px;">Other Comments</div>`;
    emailBody += `<div style="margin-bottom:20px;">${otherComments}</div>`;

    emailBody += `<div style="font-weight:bold;font-size:20px;">Referrer Details</div>`;
    emailBody += `<div style="margin-bottom:50px;">Name: ${refName}
    Provider No: ${refProviderNo}
    Contact Number: ${refPhone}
    Referrer Date: ${refDate}
    Referrer Address: ${refAddress}
    Referrer Signature: 
    <img src="${refSign}" width="200px" />
    </div>`;


    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the top margin
    const topMargin = 10;
    doc.y = topMargin;


    // Define the filename with the firstname
    const currentDateTime = new Date().toISOString().replace(/:/g, '-');
    const filename = `${pdfFolder}/${patientName}_${currentDateTime}.pdf`;


    // Pipe the PDF to a writable stream (in this case, a file)
    const stream = fs.createWriteStream(filename);

    // Add content to the PDF
    doc.pipe(stream);

    // add website logo to the doc
    const siteLogo = await getImageData('https://drgoh.com.au/wp-content/uploads/2023/11/Group-20184.png');
    doc.image(siteLogo, { width: 200, align: 'center' });

    doc.fontSize(16).font('Helvetica-Bold').text(`Patient Details`, doc.x, doc.y + 30);
    doc.fontSize(12).font('Helvetica').text(`Location: ${location}`);
    doc.fontSize(12).text(`Patient Name: ${patientName}`);
    doc.fontSize(12).text(`Patient DOB: ${patientDOB}`);
    doc.fontSize(12).text(`Patient Contact: ${patientContact}`);
    doc.fontSize(12).text(`Patient Address: ${patientAddress}`);
    doc.fontSize(12).text(`Urgency: ${urgency}`);
    doc.fontSize(12).text(`Diagnosis: ${diagnosis}`);

    if (otherDiagnosis) {
        doc.fontSize(12).text(`Other Diagnosis: ${otherDiagnosis}`);
    }

    // Visual Acuity
    doc.fontSize(16).font('Helvetica-Bold').text(`Visual Acuity`, doc.x, doc.y + 20);
    doc.fontSize(12).font('Helvetica').text(`Visual Acuity Right : ${visualAcuityRight}`);
    doc.fontSize(12).text(`Visual Acuity Left : ${visualAcuityLeft}`);

    // Intraocular pressure
    doc.fontSize(16).font('Helvetica-Bold').text(`Intraocular pressure`, doc.x, doc.y + 20);
    doc.fontSize(12).font('Helvetica').text(`Intraocular pressure Right : ${intraocularPressureRight}`);
    doc.fontSize(12).text(`Intraocular pressure Left : ${intraocularPressureLeft}`);

    doc.fontSize(12).text(`Other Comments : ${otherComments}`);

    doc.fontSize(16).font('Helvetica-Bold').text(`Referrer Details`, doc.x, doc.y + 20);
    doc.fontSize(12).font('Helvetica').text(`Referrer Name : ${refName}`);
    doc.fontSize(12).text(`Referrer Provier No. : ${refProviderNo}`);
    doc.fontSize(12).text(`Referrer Contact : ${refPhone}`);
    doc.fontSize(12).text(`Referrer Address : ${refAddress}`);
    doc.fontSize(12).text(`Referrering Date : ${refDate}`);
    doc.fontSize(12).text(`Referrer Signature : `);

    // Fetch image from the provided URL and embed it in the PDF
    try {
        const imageData = await getImageData(refSign);
        doc.image(imageData, { width: 200 });

        console.log('PDF generated successfully');


    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred while generating PDF or sending email.');
    }
    finally {
        // Close the stream after PDF generation is complete
        doc.fontSize(7).font('Courier-Oblique').text(`PDF generated on: ${currentDate}`, doc.x, doc.y + 30); // Adjust coordinates as needed
        doc.end();
        const emailData = await sendEmailWithAttachment(email, filename, emailBody);
        res.json({ message: 'PDF sent successfully' });
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

async function sendEmailWithAttachment(receiverEmail, attachmentPath, emailContent) {
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
        from: '"Dr. Jonathan Goh" <mailbox.pasindu@gmail.com>', // sender address
        to: email, // list of receivers
        cc: cc_recipients, // list of receivers
        subject: `New Submission from Refferal Form`, // Subject line
        text: `${emailContent}`, // plain text body
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