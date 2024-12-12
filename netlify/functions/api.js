import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './auth.js';

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new MongoClient(uri);

async function connectToDatabase() {
  if (!client.isConnected()) await client.connect();
  return client.db('ogbuda_db');
}

const login = async (event) => {
  const { email, password } = JSON.parse(event.body);
  const db = await connectToDatabase();

  const user = await db.collection('users').findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '1h' });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Login successful', token }),
    };
  } else {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials' }) };
  }
};

const signup = async (event) => {
  const { nickname, password, email, date } = JSON.parse(event.body);
  const db = await connectToDatabase();

  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    return { statusCode: 400, body: JSON.stringify({ message: 'User with this email already exists' }) };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.collection('users').insertOne({ nickname, password: hashedPassword, email, date });
  
  return { statusCode: 201, body: JSON.stringify({ message: 'User created successfully' }) };
};

const reserve = async (event) => {
  const authResult = await authenticateToken(event);
  if (authResult.statusCode !== 200) {
    return authResult;
  }

  const { date, time, pcType } = JSON.parse(event.body);
  const db = await connectToDatabase();

  await db.collection('reservations').insertOne({ userId: authResult.userId, date, time, pcType });
  return { statusCode: 201, body: JSON.stringify({ message: 'Reservation successful' }) };
};

const userInfo = async (event) => {
  const authResult = await authenticateToken(event);
  if (authResult.statusCode !== 200) {
    return authResult;
  }

  const db = await connectToDatabase();

  const user = await db.collection('users').findOne({ _id: new ObjectId(authResult.userId) });
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };
  }

  const reservations = await db.collection('reservations').find({ userId: authResult.userId }).toArray();

  return {
    statusCode: 200,
    body: JSON.stringify({
      user: { nickname: user.nickname, email: user.email, date: user.date },
      reservations
    })
  };
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const path = event.path.replace(/\.netlify\/functions\/[^/]+/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    switch (segments[0]) {
      case 'login':
        if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
        return await login(event);
      case 'signup':
        if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
        return await signup(event);
      case 'reserve':
        if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
        return await reserve(event);
      case 'user-info':
        if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
        return await userInfo(event);
      case 'auth-status':
        if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
        return await authenticateToken(event);
      default:
        return {
          statusCode: 404,
          body: 'Not Found',
        };
    }
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};