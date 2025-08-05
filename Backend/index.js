const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const routes = require('./Routes/authRoutes');
const resumeRoutes = require('./Routes/resumeRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', routes);
app.use('/api/resume', resumeRoutes);

// MongoDB connection
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not defined in .env file');
}
if (!process.env.PORT) {
  throw new Error('PORT is not defined in .env file');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Sucess'))
  .catch((err) => console.log('The Error is : ', err));

app.get('/', (req, res) => {
  res.send('Hi, Welcome to the API');
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
