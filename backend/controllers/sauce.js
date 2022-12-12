const Sauce = require('../models/sauce');
const fs = require('fs');

// CREER UNE SAUCE 
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id; 
    delete sauceObject._userId; // On supprime en amont le faux 'userId' envoyer par le frontend.
    const sauce = new Sauce({
        ...sauceObject, // L'opérateur spread '...' permet de faire des copies de tous les éléments de req.body
        // userId: req.auth.userId,
        // likes: 0,
        // dislikes: 0,
        // usersDisliked: [],
        // usersLiked: [],
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

//Méthode .save() qui permet d'enregistrer l'objet dans la base de données.
//Ici on viens créer une instance de notre modèle 'sauce'
//en lui passant un objet javascript contenant toutes les informations requises du corps de requête analysé.

    sauce.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( {message: 'Non enregistré !'})})
};



// RECUPERER UNE SAUCE
exports.getOneSauce = (req, res,next) => {
  // on utilise le modele mangoose et la methode findOne pour trouver un objet via la comparaison req.params.id
  Sauce.findOne({ _id: req.params.id })
  // status 200 OK et l'élément en json
  .then((sauce) => res.status(200).json(sauce))
  // si erreur envoit un status 404 Not Found et l'erreur en json
  .catch((error) => res.status(404).json({  message: 'Non OK !'}));
  };


// MODIFIER UNE SAUCE
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                console.log("pas possible")
                res.status(401).json({ message : 'Not authorized'});
            } else {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };
  


// SUPPRIMER UNE SAUCE 
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
  .then(sauce => {
   if(sauce.userId != req.auth.userId){ res.status(403).json({ message: "Unauthorized request"}) }
   else {
       const fileToDestroy = sauce.imageUrl.split('/images/')[1]
       fs.unlink(`images/${fileToDestroy}`, () => {
           Sauce.deleteOne({ _id: req.params.id })
             .then(() => res.status(200).json({ message: "Sauce supprimée "}))
             .catch(error => res.status(400).json({ error }))
       })
   }
  })
  .catch( error => res.status(500).json({ error }))
};


// RECUPERER TOUTES LES SAUCES 
exports.getAllSauce = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


// LIKE & DISLIKES 
exports.likeDislike = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
  .then(sauce => {
   sauce.usersLiked = sauce.usersLiked.filter(userId => userId != req.auth.userId)   
   sauce.usersDisliked = sauce.usersDisliked.filter(userId => userId != req.auth.userId)


   switch(req.body.like) {
       case 1: 
       sauce.usersLiked.push(req.auth.userId)
       break

       case -1:
       sauce.usersDisliked.push(req.auth.userId)
       break
   }
   sauce.likes = sauce.usersLiked.length
   sauce.dislikes = sauce.usersDisliked.length

   Sauce.updateOne({ _id: req.params.id}, sauce)
    .then(() =>  res.status(201).json({ message : "Like/Dislike ajusté! "}))
    .catch(error => res.status(500).json({ error }))
  })
  .catch(error => res.status(500).json({ error }))
};
