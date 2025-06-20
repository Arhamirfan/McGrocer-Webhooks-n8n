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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ReceiptHandle } = req.body;

  if (!ReceiptHandle) {
    return res.status(400).json({ error: 'ReceiptHandle is required' });
  }

  try {
    await sqs.deleteMessage({
      QueueUrl: QUEUE_URL,
      ReceiptHandle,
    }).promise();

    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('SQS deleteMessage error:', error.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}
