eveloped a robust backend system for a payment platform using Node.js and Express and MongoDB, ensuring secure and efficient transaction processing.
Implemented features for user authentication, transaction management, and wallet services, integrating with various APIs for seamless payment experiences. 

Project Structure:
/digital-wallet
├── /src
│   ├── /controllers
│   │   ├── authController.js
│   │   ├── walletController.js
│   │   ├── transactionController.js
│   ├── /middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   ├── /models
│   │   ├── User.js
│   │   ├── Wallet.js
│   │   ├── Transaction.js
│   ├── /routes
│   │   ├── authRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── transactionRoutes.js
│   ├── app.js
│   ├── server.js
├── package.json
├── .env
├── README.md
Setting Up the Project:
Install Dependencies
npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv body-parser cors
npm install --save-dev nodemon
Environment Variables (.env)
PORT=5000
MONGO_URI=mongodb://localhost:27017/digital_wallet
JWT_SECRET=your_secret_key

 Model Definitions:
src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);

src/models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
});

module.exports = mongoose.model('Wallet', walletSchema);

src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);

Middleware:
src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
src/middlewares/errorMiddleware.js
exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message || 'Internal Server Error' });
};
Controllers:
src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
rc/controllers/walletController.js
const Wallet = require('../models/Wallet');

exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    res.json(wallet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user.id });
    wallet.balance += amount;
    await wallet.save();
    res.json({ message: 'Funds added successfully', wallet });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
Routes:
src/routes/authRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;
src/routes/walletRoutes.js
const express = require('express');
const { getWallet, addFunds } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', protect, getWallet);
router.post('/add-funds', protect, addFunds);

module.exports = router;

App and Server:
src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

module.exports = app;

src/server.js
const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

Run the Application:
Start the MongoDB server locally.
Run the development server:
npx nodemon src/server.js
