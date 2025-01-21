import { google } from 'googleapis';
import express from 'express';

const app = express();

// Use express.json() to automatically parse JSON data in the body
app.use(express.json());

// Retrieve credentials from environment variables
const googleClientEmail = process.env.CLIENT_EMAIL;
const googlePrivateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n'); // Handle multiline private key

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1i8DZIIfjOJsF-8Uxuvo9n8jc6KpqbsIGsXTzPbqMpLY'; // Replace with your Google Sheets ID
const RANGE = 'Sheet1!A2:I'; // Updated range for the new structure (8 columns)

async function authenticate() {
  // Create the JWT client with the environment variables
  const jwtClient = new google.auth.JWT(
    googleClientEmail,
    null,
    googlePrivateKey,
    SCOPES
  );

  // Ensure authentication
  await jwtClient.authorize();
  return jwtClient;
}

async function appendToSheet(auth, data) {
  const sheets = google.sheets({ version: 'v4', auth });

  const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'RAW',
    resource: {
      values: [
        [
          data.name,
          data.phone,
          data.company,
          data.email,
          data.position,
          data['years-of-exp'],
          data['required-skills'],
          data['job-description'],
          data.salary
        ]
      ],
    },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log('Data added to Google Sheets:', response.data);
  } catch (err) {
    console.error('Error appending data:', err);
    throw new Error('Error appending data to sheet');
  }
}

app.post('/api/submit', async (req, res) => {
  const formData = req.body;

  // Validate required fields
  if (
    !formData ||
    !formData.name ||
    !formData.phone ||
    !formData.company ||
    !formData.email ||
    !formData.position ||
    !formData['years-of-exp'] ||
    !formData['required-skills'] ||
    !formData['job-description'] ||
    !formData.salary
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const auth = await authenticate(); // Authenticate using environment variables
    await appendToSheet(auth, formData);

    res.status(200).json({ message: 'Form data submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error submitting form data' });
  }
});

// Example to handle incorrect methods
app.all('*', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

// Set up your server to listen on a port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
