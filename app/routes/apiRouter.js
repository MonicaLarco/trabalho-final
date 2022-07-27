require('dotenv').config();
const express = require ('express');
const apiRouter = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex')({
    client: 'pg',
    debug: true,
    connection: {
        connectionString : process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
});


// Authenticate password
let checkToken = (req, res, next) => {
    let authToken = req.headers['authorization'];
    if (!authToken) {        
        res.status(401).json({ message: 'Token de acesso requerida' })
    }
    else {
        let token = authToken.split(' ')[1]
        req.token = token
    }

    jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
        if (err) {
            res.status(401).json({ message: 'Acesso negado'})
            return
        }
        req.usuarioId = decodeToken.id
        next()
    })
};

// // Check user role
let isAdmin = (req, res, next) => {
    knex
        .select ('*').from ('usuario').where({ id: req.usuarioId })
        .then ((usuarios) => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let roles = usuario.roles.split(';')
                let adminRole = roles.find(i => i === 'ADMIN')
                if (adminRole === 'ADMIN') {
                    next()
                    return
                }
                else {
                    res.status(403).json({ message: 'Role de ADMIN requerida' })
                    return
                }
            }
        })
        .catch (err => {
            res.status(500).json({ 
              message: 'Erro ao verificar roles de usuário - ' + err.message })
        })
};

//Get list of products
apiRouter.get('/produtos', checkToken, (req, res) => {
    knex.select('*').from('produto')
    .then( produtos => res.status(200).json(produtos) )
    .catch(err => {
        res.status(500).json({ 
           message: 'An error has occured - ' + err.message })
    });  
});

// Add a new product
apiRouter.post('/produtos', checkToken, isAdmin, express.json(), (req, res) => {
    knex('produto')
        .insert({
            descricao: req.body.descricao,
            valor: req.body.valor,
            marca: req.body.marca},
            ['id', 'descricao', 'valor', 'marca'])
        .then (produtos => {
            let produto = produtos[0]
            res.status(201).json ({ produto })
        })
        .catch (err => res.status(500).json ({ message: `An error has occured ${err.message}`}))
});

// Get a product by ID
apiRouter.get('/produtos/:id', checkToken, (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (id > 0) {
        knex
          .select("*")
          .from("produto")
          .where('id', id)
          .then(produtos => {
            if (produtos.length > 0) {
                res.json(produtos[0])
                return
            }
            res.status(404).json({message: 'Product not found'})
        })
          .catch(err => { res.status(500).json({message: 'Could not fetch - ' + err.message})});
    } else {
        res.status(404).json({ message: "Product not found!" });
    }
});

// Update Product details
apiRouter.put('/produtos/:id', checkToken, isAdmin, (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (id > 0) {
        knex('produto')
            .where('id', id)
            .update({
                descricao: req.body.descricao,
                valor: req.body.valor,
                marca: req.body.marca
            },
            ['id','descricao','valor','marca'])
            .then (produtos => {
                let produto = produtos[0]
                res.status(200).json({produto})
            })
            .catch (err => res.status(500).json ({ message: `An error has occured ${err.message}`}));
    } else {
        res.status(404).json({message: "Product not found!"});
    }
});

// Delete a Product
apiRouter.delete('/produtos/:id', checkToken, isAdmin, (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (id > 0) {
        knex('produto')
          .where('id', id)
          .del()
          .then(res.status(200).json({message: `Item ${id} was removed from the list successfully`}))
          .catch (err => res.status(500).json ({ message: `An error has occured ${err.message}`}))
    } else {
        res.status(404).json({ message: "Product not found"});
    }
});

module.exports = apiRouter;
