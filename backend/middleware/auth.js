const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
   try {
        //extraction du token de la requete entrante
       const token = req.headers.authorization.split(' ')[1];
       //verification du token avec verify 
       const decodedToken = jwt.verify(token,process.env.KEY_TOKEN); // changing from 'RANDOM_TOKEN_SECRET'
       //extraction de l'ID utilisateur et ajout à l'objet requete 
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};