const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
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

async function run() {
    try {
        const collectionOfServices = client.db('ZeronOne').collection('ZeroOneData');
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = collectionOfServices.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        //load by specific id
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await collectionOfServices.findOne(query);
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