const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@active-interior.cifqsc2.mongodb.net/?appName=Active-Interior`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const constructionStaffsCollection = client.db('Active-Interior').collection('construction_staffs');

        app.get('/construction_staffs', async (req, res) => {
            const result = await constructionStaffsCollection.find().toArray();
            res.send(result);
        })

        app.post('/construction_staffs', async (req, res) => {
            const data = req.body;
            try {
                const result = await constructionStaffsCollection.insertOne(data);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })

        app.delete('/construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await constructionStaffsCollection.deleteOne(filter);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Active Interior is Running')
});






app.listen(port, () => {
    console.log(`Active Interior is running on port ${port}`);
})