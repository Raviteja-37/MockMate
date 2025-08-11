const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const routes = require('./Routes/authRoutes');
const resumeRoutes = require('./Routes/resumeRoutes');

dotenv.config();

const app = express();

const corsOptions = {
  origin: 'https://mockmatefrontend.onrender.com/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
};
app.use(cors(corsOptions));
console.log('called in api...');
app.use(express.json());
app.use('/api/auth', routes);
app.use('/api/resume', resumeRoutes);

// MongoDB connection
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not defined in .env file');
}
const PORT = process.env.PORT || 5004;

if (!PORT) {
  throw new Error('PORT is not defined in .env file');
}
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Sucess'))
  .catch((err) => console.log('The Error is : ', err));

app.get('/', (req, res) => {
  res.send('Hi, Welcome to the API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${process.env.PORT || 5004}`);
});
