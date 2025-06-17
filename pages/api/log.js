import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const submissionPath = path.join(process.cwd(), 'data', 'submissions.json');
      const newSubmission = req.body;

      let existingSubmissions = [];
      if (fs.existsSync(submissionPath)) {
        const data = fs.readFileSync(submissionPath, 'utf8');
        if (data) {
          existingSubmissions = JSON.parse(data);
        }
      }

      existingSubmissions.push(newSubmission);

      fs.writeFileSync(submissionPath, JSON.stringify(existingSubmissions, null, 2), 'utf8');

      res.status(200).json({ message: 'Submission saved successfully!' });
    } catch (error) {
      console.error('Error saving submission:', error);
      res.status(500).json({ message: 'Error saving submission', error: error.message });
    }
  } 
}
