import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const sqs = new AWS.SQS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const QUEUE_URL = process.env.QUEUE_URL;

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

    let savedFiles = [];
    for (const msg of messages) {
      const { ReceiptHandle, Body } = msg;
      try {
        const data = JSON.parse(Body);
        data.MessageId = msg.MessageId;
        data.ReceiptHandle = msg.ReceiptHandle;
        savedFiles.push(data);
        // await sqs.deleteMessage({ QueueUrl: QUEUE_URL, ReceiptHandle }).promise();
      } catch (err) {
        console.log('error in messages loop:', err)
      }
    }
    return res.status(200).json({ messages: savedFiles , count: savedFiles.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
} 