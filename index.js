const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Server side is running...");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cnhrqkg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, nex) {
    const authHeader = req.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        nex();
    })
}

function verifyJWT(req, res, next) {
    // console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({message: 'Unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
    // next()
}

async function run() {
    try {
        const collectionOfServices = client.db('ZeronOne').collection('ZeroOneData');
        const reviewerCollection = client.db('ZeronOne').collection('reviewers');
        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            console.log(page, size);
            const query = {};
            const cursor = collectionOfServices.find(query);
            const services = await cursor.skip(page*size).limit(size).toArray();
            const count = await collectionOfServices.estimatedDocumentCount();
            res.send({count,services});
        });
        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACESS_TOKEN, { expiresIn: '1h' });
            res.send({token});
        })
        // reviewers
        app.post('/reviewers', async (req, res) => {
            const review = req.body;
            const result = await reviewerCollection.insertOne(review);
            res.send(result);
        });
        // review send to client
        app.get('/reviewers', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('inside order api', decoded);
            if (decoded.email !== req.query.email) {
                res.status(403).send({message: 'Unauthorized access'})
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email,
                }
            }
            const cursor = reviewerCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/allservice', async (req, res) => {
            const query = {};
            const cursor = collectionOfServices.find(query);
            const allservice = await cursor.toArray();
            res.send(allservice);
        })
        //load by specific id
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await collectionOfServices.findOne(query);
            res.send(result);
        });
        // delete review
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewerCollection.deleteOne(query);
            res.send(result);
        });
        
        // for update review
        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewerCollection.findOne(query);
            res.send(result);
        });
        // update review
        app.put('/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upsert: true };
            const updatedReview = {
                $set: {
                    email: review.email,
                    name: review.name,
                    url: review.url,
                    ratting: review.ratting,
                    description: review.description
                }
            }
            const result = await reviewerCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        })

    }
    finally {
        
    }
}
run().catch(error => console.error(error));



app.listen(port, () => {
    console.log(`Running on ${port} port`);
})