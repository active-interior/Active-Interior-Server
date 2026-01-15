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
        const constructionProjectsCollection = client.db('Active-Interior').collection('construction_projects');

        // ------------- Construction Staffs
        app.get('/construction_staffs', async (req, res) => {
            const result = await constructionStaffsCollection.find().toArray();
            res.send(result);
        })
        app.get('/construction_staffs/:id', async(req, res) => {
            const id = req.params.id;
            const result = await constructionStaffsCollection.findOne({_id: new ObjectId(id)});
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
        app.patch('/construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const attendance_data = req.body.attendance_data;
            const transection_data = req.body.transection_data;
            const staff = await constructionStaffsCollection.findOne({_id: new ObjectId(id)});
            if (attendance_data) {
                const result = await constructionStaffsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { 
                        staff_working_details: [ ...staff.staff_working_details, attendance_data],
                        income: staff.income + attendance_data.income,
                        available_balance: staff.available_balance + attendance_data.income
                    } }
                );
                res.send(result);
            }
            else if (transection_data) {
                const result = await constructionStaffsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { 
                        staff_transections: [...staff.staff_transections, transection_data],
                        withdraw: staff.withdraw + transection_data.amount,
                        available_balance: staff.available_balance - transection_data.amount
                    } }
                );
                res.send(result);
            }
        })

        app.delete('/construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await constructionStaffsCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/close_construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body
            const result = await constructionStaffsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        due: data.due,
                        income: data.income,
                        withdraw: data.withdraw,
                        last_closing_date: data.last_closing_date
                    }
                }
            )
            res.send(result);
        })
        app.patch('/construction_staffs_edit_form/:id', async (req, res) => {
            const id = req.params.id;
            const {staff_name, staff_address, staff_number, work_category, staff_category, staff_nid, staff_emergency, staff_blood, staff_salary, staff_reference} = req.body;
            const result = await constructionStaffsCollection.updateOne(
                {_id: new ObjectId(id)},
                {
                    $set: {
                        staff_name,
                        staff_address,
                        staff_number,
                        work_category,
                        staff_category,
                        staff_nid,
                        staff_emergency,
                        staff_blood,
                        staff_salary,
                        staff_reference
                    }
                }
            )
            res.send(result);
        })
        // -------------------- Construction Projects
        app.get('/construction_projects', async (req, res) => {
            const result = await constructionProjectsCollection.find().toArray();
            res.send(result);
        })


        app.get('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await constructionProjectsCollection.findOne(filter);
            res.send(result);
        })

        app.post('/construction_projects', async (req, res) => {
            const data = req.body;
            try {
                const result = await constructionProjectsCollection.insertOne(data);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })

        app.put('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const costData = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $push: { project_cost: costData }
            }
            const result = await constructionProjectsCollection.updateOne(filter, updateDoc, { upsert: true });
            res.send(result);
        })

        app.delete('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await constructionProjectsCollection.deleteOne(filter);
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