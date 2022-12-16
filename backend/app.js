const express = require('express');
const app = express();
// Helmet pour securisation des requetes HTTP
const helmet = require('helmet')
//Moogoose pour interargir avec la base de données de MongoDB
const mongoose = require('mongoose');

// dotenv config pour variable d'environnement confidentialité
const dotenv = require('dotenv');
dotenv.config();

// moogose & mongoDB
mongoose.connect(process.env.MONGO_URL,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

//Routes required pour sauces et users
const saucesRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');
// path pour les ajouts d'images - sauces 
const path = require('path');

app.use(express.json());

//cross origin solutions quand plusieurs servers interagissent 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

//app use
app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(helmet())

module.exports = app;
