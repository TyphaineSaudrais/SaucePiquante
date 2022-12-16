const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');// On importe le package jsonwebtoken pour chiffrer des tokens

//FONCTION SIGN UP 
exports.signup = (req, res, next) => {
  // bcrypt pour hasher le password
  bcrypt.hash(req.body.password, 10)
  .then(hash => {
    //creation new user avec email login et password hashé
    const user = new User({
      email: req.body.email,
      password: hash
    });
    //Sauvegarde du user
    user.save()
    // res status 201 OK pour la creation du user + message en json
      .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
      // si erreur envoit status 400 erreur dans la requete envoyée au server
      .catch(error => res.status(400).json({ error }));
  })
  // si erreur envoit status 500 erreur server
  .catch(error => res.status(500).json({ error }));

};

// FONCTION LOGIN 
exports.login = (req, res, next) => {
    // on utilise le modele mangoose et la methode findOne pour trouver l'email via la comparaison req.body.email
  User.findOne({ email: req.body.email })
      .then(user => {
          // si l'utillisateur n'est pas dans la base de données erreur status 401 - erreur dans l'envoi des données
          if (!user) {
              return res.status(401).json({ error: 'Utilisateur non trouvé !' });
          }
           // si l'utillisateur est dans la base de données - utilisation de la methode bcrypt compare pour comparer les "hashages" de mot de passe effectués
          bcrypt.compare(req.body.password, user.password)
            //si la comparaison n'est pas concluante erreur status 401 - erreur dans l'envoi des données
              .then(valid => {
                  if (!valid) {
                      return res.status(401).json({ error: 'Mot de passe incorrect !' });
                  }
                  //si la comparaison est concluante - attribution du jeton token pour session 24h
                  res.status(200).json({
                      userId: user._id,
                      token: jwt.sign(
                          { userId: user._id },
                          process.env.KEY_TOKEN,
                          { expiresIn: '24h' }
                      )
                  });
              })
              // si erreur envoit status 500 erreur server
              .catch(error => res.status(500).json({ error }));
      })
      // si erreur envoit status 500 erreur server
      .catch(error => res.status(500).json({ error }));
};

