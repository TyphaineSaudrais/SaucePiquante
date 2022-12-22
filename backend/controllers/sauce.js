const Sauce = require('../models/sauce');
const fs = require('fs');


// CREER UNE SAUCE 
exports.createSauce = (req, res, next) => {
  // On met le texte de la requete entrée en format JSON
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id; // On supprime en amont le faux '_Id' envoyer par le frontend.
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
    // status 201 OK que l'élément à bien été crée + message en json 
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    // si erreur envoit un status 400 - code envoyé incorrect
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
  //On verifie si la req contient un file ou non, si oui on enregistre l'image via le path crée pour stocker les images dans le dossier images du back end/ SI non on prend en compte le req.body uniquement 
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;  // On supprime en amont le faux 'userId' envoyer par le frontend.
    // on utilise le modele mangoose et la methode findOne pour trouver l'objet via la comparaison req.params.id
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
          //si le userID correspond à la creation de la sauce et different de l'userID de la requete de modification, on n'authorise pas la modification
            if (sauce.userId != req.auth.userId) {
                console.log("pas possible")
                // si erreur envoit un status 404 Not Found et l'erreur en json
                res.status(401).json({ message : 'Not authorized'});
            } else {
               //si le userID correspond ) la creation de la sauce et équivalent à l'userID de la requete de modification, on authorise la modification
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                 // status 200 OK et l'élément en json
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                // si erreur envoit un status 404 Not Found et l'erreur en json
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
          // si erreur envoit un status 400 Not Found et l'erreur en json
            res.status(400).json({ error });
        });
 };
  


// SUPPRIMER UNE SAUCE 
exports.deleteSauce = (req, res, next) => {
   // on utilise le modele mangoose et la methode findOne pour trouver l'objet via la comparaison req.params.id
  Sauce.findOne({ _id: req.params.id })
   //si le userID correspond à la creation de la sauce et different de l'userID de la requete de suppression, on n'authorise pas la suppression
  .then(sauce => {
   if(sauce.userId != req.auth.userId){ res.status(403).json({ message: "Unauthorized request"}) }
   else {
    //si le userID correspond à la creation de la sauce et different de l'userID de la requete de suppression, on authorise la suppression
       const fileToDestroy = sauce.imageUrl.split('/images/')[1]
       // on défait le lien path avec le fichier image et on supprime le file
       fs.unlink(`images/${fileToDestroy}`, () => {
        fileToDestroy.deleteOne
        // On supprime la sauce concernée
           Sauce.deleteOne({ _id: req.params.id })
            // status 200 OK et l'élément en json
             .then(() => res.status(200).json({ message: "Sauce supprimée "}))
               // si erreur envoit un status 400 Not Found et l'erreur en json
             .catch(error => res.status(400).json({ error }))
       })
   }
  })
   // si erreur envoit un status 500 error server et l'erreur en json
  .catch( error => res.status(500).json({ error }))
};


// RECUPERER TOUTES LES SAUCES 
exports.getAllSauce = (req, res, next) => {
  // on utilise le modele mangoose et la methode find pour trouver les objets 
  Sauce.find().then(
    (sauces) => {
       // status 200 OK et l'élément en json
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
        // si erreur envoit un status 400 Not Found et l'erreur en json
      res.status(400).json({
        error: error
      });
    }
  );
};


// LIKE & DISLIKES 
exports.likeDislike = (req, res, next) => {
  // on utilise le modele mangoose et la methode findOne pour trouver l'objet via la comparaison req.params.id
  Sauce.findOne({ _id: req.params.id})
  .then(sauce => {
    // DEUX CAS 
    //- case 1 - il n'y a aucun userID correspondant à l'UserID de la req like dans la liste des userID qui ont deja liké
   sauce.usersLiked = sauce.usersLiked.filter(userId => userId != req.auth.userId)   
   //- case 2 -  il n'y a aucun userID correspondant à l'UserID de la req like dans la liste des userID qui ont deja disliké
   sauce.usersDisliked = sauce.usersDisliked.filter(userId => userId != req.auth.userId)


   switch(req.body.like) {
       case 1: 
       // on push le userID de la req dans la liste des userID qui ont liké 
       sauce.usersLiked.push(req.auth.userId)
       break

       case -1:
         // on push le userID de la req dans la liste des userID qui ont disliké 
       sauce.usersDisliked.push(req.auth.userId)
       break
   }
   //on update la liste des likes
   sauce.likes = sauce.usersLiked.length
   //on update la liste des dislikes
   sauce.dislikes = sauce.usersDisliked.length

   // on utilise le modele mangoose et la methode updateOne pour trouver l'objet via la comparaison req.params.id
   Sauce.updateOne({ _id: req.params.id}, sauce)
    // status 201 OK l'élément est bien updaté 
    .then(() =>  res.status(201).json({ message : "Like/Dislike ajusté! "}))
     // si erreur envoit un status 500 error server et l'erreur en json
    .catch(error => res.status(500).json({ error }))
  })
   // si erreur envoit un status 500 error server et l'erreur en json
  .catch(error => res.status(500).json({ error }))
};
