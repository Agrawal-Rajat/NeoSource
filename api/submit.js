import { google } from 'googleapis';

// Retrieve credentials from environment variables
const googleClientEmail = process.env.CLIENT_EMAIL;
const googlePrivateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n'); // Handle multiline private key

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1i8DZIIfjOJsF-8Uxuvo9n8jc6KpqbsIGsXTzPbqMpLY'; // Replace with your Google Sheets ID
const RANGE = 'Sheet1!A2:H'; // The range in your sheet where you want the data to go (e.g., Sheet1!A1)

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
          data.company,
          data['years-of-exp'],
          data.post,
          data['job-description'],
          data['required-skills'],
          data['preferred-skills'],
          data.salary,
          data['joining-date'],
        ]
      ],
    },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log('Data added to Google Sheets:', response.data);
  } catch (err) {
    console.error('Error appending data:', err);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const formData = req.body;

    try {
      const auth = await authenticate();  // Authenticate using environment variables
      await appendToSheet(auth, formData);

      res.status(200).send('Form data submitted successfully');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error submitting form data');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
