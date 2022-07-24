
require('dotenv').config();
const express = require('express');
const apiRouter = express.Router();
const knex = require('knex') ({
    client: 'pg',
    connection: {
        connectionString : process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
});

apiRouter.get('/produtos', (req, res) => {
    knex.select('*').from('produto')
    .then(produtos => res.status(200).json(produtos));  
});

// Add a new product
apiRouter.post('/produtos', express.json(), (req, res) => {
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
apiRouter.get('/produtos/:id', (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (id > 0) {
        knex
          .select("*")
          .from("produto")
          .where('id', id)
          .then(produtos => res.json(produtos))
          .catch(err => { res.status(500).json({message: 'Could not fetch - ' + err.message})});
    } else {
        res.status(404).json({ message: "Product not found!" });
    }
});

// Update Product details
apiRouter.put('/produtos/:id', (req, res) => {
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
apiRouter.delete('/produtos/:id', (req, res) => {
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

module.exports = apiRouter