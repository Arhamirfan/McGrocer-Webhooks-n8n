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
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { Attributes } = await sqs.getQueueAttributes({
      QueueUrl: QUEUE_URL,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
      ],
    }).promise();

    const visible = parseInt(Attributes.ApproximateNumberOfMessages, 10);
    const inFlight = parseInt(Attributes.ApproximateNumberOfMessagesNotVisible, 10);

    return res.status(200).json({
      visible,
      inFlight,
      total: visible + inFlight,
    });
  } catch (error) {
    console.error('SQS GetQueueAttributes error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch message count' });
  }
}
