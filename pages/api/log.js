import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method === "POST") {
      const filePath = path.join(process.cwd(), 'data', 'submissions.json');

      fs.readFile(filePath, (err, data) => {
        let submissions = [];
        if (!err) {
          submissions = JSON.parse(data);
        }

        submissions.push(req.body);

        fs.writeFile(filePath, JSON.stringify(submissions, null, 2), (writeErr) => {
          if (writeErr) {
            console.error("Error writing to submissions.json:", writeErr);
            res.status(500).json({ message: "Failed to save data" });
          } else {
            console.log("Received data from n8n and saved:", req.body);
            res.status(200).json({ message: "Data logged and saved successfully" });
          }
        });
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }