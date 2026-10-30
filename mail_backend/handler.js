import { DynamoDBClient, PutItemCommand, ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGS = ['ko', 'en', 'ja'];

export const saveEmail = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const email = (body.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Invalid email address' }) };
  }

  try {
    await client.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        email: { S: email },
        subscribedAt: { S: new Date().toISOString() },
        // Anything else (missing, made up) is stored as the default, not as sent
        lang: { S: LANGS.includes(body.lang) ? body.lang : 'ko' },
      },
      ConditionExpression: 'attribute_not_exists(email)',
    }));
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Already registered' }) };
    }
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Server error' }) };
  }

  return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Subscribed successfully' }) };
};
