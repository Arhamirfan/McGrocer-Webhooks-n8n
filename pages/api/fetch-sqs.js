import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Configure AWS SDK from environment variables
const sqs = new AWS.SQS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const QUEUE_URL = process.env.QUEUE_URL;
const OUTPUT_DIR = path.join(process.cwd(), 'output');

console.log('QUEUE_URL:', process.env.QUEUE_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await sqs.receiveMessage({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 10,
      VisibilityTimeout: 20,
    }).promise();

    const messages = response.Messages || [];
    if (messages.length === 0) {
      return res.status(200).json({ message: 'No messages available.' });
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    let savedFiles = [];
    for (const msg of messages) {
      const { ReceiptHandle, Body } = msg;
      try {
        const data = JSON.parse(Body);
        console.log('data', data);
        const filename = `${data.id || 'message'}_${new Date().toISOString().replace(/[-:.TZ]/g, '')}.json`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 4), 'utf-8');
        savedFiles.push(filename);
        // Optionally delete the message from the queue:
        // await sqs.deleteMessage({ QueueUrl: QUEUE_URL, ReceiptHandle }).promise();
      } catch (err) {
        // Invalid JSON, skip
      }
    }
    return res.status(200).json({ savedFiles, count: savedFiles.length, messages });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
} 