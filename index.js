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


        const staffsCollection = client.db('Active-Interior').collection('staffs');
        const projectsCollection = client.db('Active-Interior').collection('projects');
        const workCategoryCollection = client.db('Active-Interior').collection('work_category');
        const voucherSLCollection = client.db('Active-Interior').collection('voucher_sl_no');
        const transactionSLCollection = client.db('Active-Interior').collection('transaction_sl_no');
        const accountsCollection = client.db('Active-Interior').collection('Accounts');
        const expensesCollection = client.db('Active-Interior').collection('expenses');
        const revenuesCollection = client.db('Active-Interior').collection('revenues');

        // ------------- Construction Staffs
        app.get('/construction_staffs', async (req, res) => {
            const result = await staffsCollection.find().toArray();
            res.send(result);
        })
        app.get('/construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const result = await staffsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        app.post('/construction_staffs', async (req, res) => {
            const data = req.body;
            try {
                const result = await staffsCollection.insertOne(data);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })
        app.patch('/construction_staffs/:id', async (req, res) => {
            const { id } = req.params;
            const { attendance_data, transection_data } = req.body;

            if (attendance_data) {
                const result = await staffsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $push: { staff_working_details: attendance_data },
                        $inc: {
                            income: attendance_data.income,
                            available_balance: attendance_data.income
                        }
                    }
                );
                return res.send(result);
            }

            if (transection_data) {
                const result = await staffsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $push: {
                            staff_transections: {
                                $each: [transection_data],
                                $slice: -50   // ✅ keep only last 50 transactions
                            }
                        },
                        $inc: {
                            withdraw: transection_data.amount,
                            available_balance: -transection_data.amount
                        }
                    }
                );
                return res.send(result);
            }

            res.status(400).send({ message: "No valid data provided" });
        });

        app.delete('/construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await staffsCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/close_construction_staffs/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body
            const result = await staffsCollection.updateOne(
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
            const { staff_name, staff_address, staff_number, work_category, staff_category, staff_nid, staff_emergency, staff_blood, staff_salary, staff_reference } = req.body;
            const result = await staffsCollection.updateOne(
                { _id: new ObjectId(id) },
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


        // ==================== Work Category ===========================

        app.get('/work_category', async (req, res) => {
            const result = await workCategoryCollection.findOne({});
            res.send(result);
        })


        // ================== End Work Category =========================
        // -------------------- Construction Projects
        app.get('/construction_projects', async (req, res) => {
            const result = await projectsCollection.find().toArray();
            res.send(result);
        })


        app.get('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await projectsCollection.findOne(filter);
            res.send(result);
        })

        app.post('/construction_projects', async (req, res) => {
            const data = req.body;
            try {
                const result = await projectsCollection.insertOne(data);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })

        app.put('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const { date, cost_category, cost_description, amount } = req.body;

            const filter = {
                _id: new ObjectId(id),
                project_cost: {
                    $elemMatch: {
                        date,
                        cost_category,
                        cost_description
                    }
                }
            };
            const update = {
                $inc: {
                    "project_cost.$.amount": amount
                }
            };
            const result = await projectsCollection.updateOne(filter, update);

            if (result.matchedCount === 0) {
                await projectsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $push: {
                            project_cost: {
                                date,
                                cost_category,
                                cost_description,
                                amount
                            }
                        }
                    }
                );
            }
            res.send(result);
        })

        app.delete('/construction_projects/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await projectsCollection.deleteOne(filter);
            res.send(result);
        })

        app.patch('/construction_projects_status/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) }
            const result = await projectsCollection.updateOne(filter, { $set: { status } });
            res.send(result);
        })


        // ------------------------ Voucher and Transaction Sl No ------------------------------


        app.get('/voucher_sl_no', async (req, res) => {
            const result = await voucherSLCollection.findOne({});
            res.send(result);
        })
        app.get('/transaction_sl_no', async (req, res) => {
            const result = await transactionSLCollection.findOne({});
            res.send(result);
        })
        app.patch('/voucher_sl_no', async (req, res) => {
            const voucherSLExisting = await voucherSLCollection.findOne({});
            const slUpdateResult = await voucherSLCollection.updateOne(
                { _id: voucherSLExisting._id },
                { $inc: { sl_no: 1 } }
            );
            res.send(slUpdateResult);
        })
        app.patch('/transaction_sl_no', async (req, res) => {
            const transactionSLExisting = await transactionSLCollection.findOne({});
            const slUpdateResult = await transactionSLCollection.updateOne(
                { _id: transactionSLExisting._id },
                { $inc: { sl_no: 1 } }
            );
            res.send(slUpdateResult);
        })



        // ------------------------ End Voucher and Transaction Sl No ------------------------------

        // -------------------------- Accounts -------------------------------
        app.get('/accounts', async (req, res) => {
            const result = await accountsCollection.findOne({});
            res.send(result);
        })
        // -------------------------- End Accounts -------------------------------

        // ---------------------- Accounts Cash In ---------------------------------

        app.patch('/project_cash_in/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const transactionData = req.body;
            const result = await projectsCollection.updateOne(
                filter,
                {
                    $push: {
                        project_transaction: {
                            $each: [transactionData],
                        }
                    }
                }
            );
            res.send(result);
        })
        app.patch('/projects_payment', async (req, res) => {
            const item = await accountsCollection.findOne({});
            const id = item?._id;
            const filter = { _id: new ObjectId(id) };
            const transactionData = req.body;
            const result = await accountsCollection.updateOne(
                filter,
                {
                    $push: {
                        project_payment: {
                            $each: [transactionData],
                        }
                    }
                }
            );
            res.send(result);
        })
        app.patch('/loans', async (req, res) => {
            const item = await accountsCollection.findOne({});
            const id = item?._id;
            const filter = { _id: new ObjectId(id) };
            const transactionData = req.body;
            const result = await accountsCollection.updateOne(
                filter,
                {
                    $push: {
                        loans: {
                            $each: [transactionData],
                        }
                    }
                }
            );
            res.send(result);
        })
        app.patch('/personal_investments', async (req, res) => {
            const item = await accountsCollection.findOne({});
            const id = item?._id;
            const filter = { _id: new ObjectId(id) };
            const transactionData = req.body;
            const result = await accountsCollection.updateOne(
                filter,
                {
                    $push: {
                        personal_investments: {
                            $each: [transactionData],
                        }
                    }
                }
            );
            res.send(result);
        })
        app.patch('/others_received', async (req, res) => {
            const item = await accountsCollection.findOne({});
            const id = item?._id;
            const filter = { _id: new ObjectId(id) };
            const transactionData = req.body;
            const result = await accountsCollection.updateOne(
                filter,
                {
                    $push: {
                        others_received: {
                            $each: [transactionData],
                        }
                    }
                }
            );
            res.send(result);
        })


        // ---------------------- End Accounts Cash In ---------------------------------


        // -------------------------- Accounts Revenue Transactions -----------------------

        app.patch('/revenue_transactions', async (req, res) => {
            const existing = await accountsCollection.findOne({});
            const filter = { _id: existing._id }
            const transactionData = req.body;
            const result = await accountsCollection.updateOne(
                filter,
                {
                    $push: {
                        revenue_transactions: {
                            $each: [transactionData],
                        },
                        last_20_transaction: {
                            $each: [transactionData],
                            $slice: -20
                        }
                    },
                    $inc: {
                        current_balance: transactionData.amount,
                        total_cash_in: transactionData.amount
                    }
                }
            );
            res.send(result);
        })

        // -------------------------- End Accounts Revenue Transactions -----------------------

        // -------------------------- Accounts Expense Transactions ---------------------------

        app.patch('/expense_transactions', async (req, res) => {
            try {
                const transactionData = req.body;
                const { date, category, amount, reference } = transactionData;

                const existing = await accountsCollection.findOne({});
                if (!existing) {
                    return res.status(404).json({ message: "Account not found" });
                }

                const filter = {
                    _id: existing._id,
                    expense_transactions: { $elemMatch: { date, category } }
                };

                const update = {
                    $push: {
                        "expense_transactions.$.reference": reference[0]
                    },
                    $inc: {
                        "expense_transactions.$.amount": amount,
                        current_balance: -amount,
                        total_cash_out: amount
                    },
                };

                const lastTransactionFilter = {
                    _id: existing._id,
                    last_20_transaction: { $elemMatch: { date, category } }
                };

                const lastTransactionUpdate = {
                    $push: {
                        "last_20_transaction.$.reference": reference[0]
                    },
                    $inc: { "last_20_transaction.$.amount": amount }
                };

                const result = await accountsCollection.updateOne(filter, update);
                const lastTransactionResult = await accountsCollection.updateOne(
                    lastTransactionFilter,
                    lastTransactionUpdate
                );

                let pushed = false;

                if (result.matchedCount === 0 && lastTransactionResult.matchedCount === 0) {
                    await accountsCollection.updateOne(
                        { _id: existing._id },
                        {
                            $push: {
                                expense_transactions: transactionData,
                                last_20_transaction: {
                                    $each: [transactionData],
                                    $slice: -20
                                }
                            },
                            $inc: { current_balance: -amount, total_cash_out: amount }
                        }
                    );
                    pushed = true;
                }

                // ✅ SINGLE RESPONSE
                res.json({
                    updatedExpense: result,
                    updatedLast20: lastTransactionResult,
                    pushedNew: pushed
                });

            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // -------------------------- End Accounts Expense Transactions ---------------------------


        // -------------------------------- All Revenue Transaction --------------------------------

        app.get('/revenues', async (req, res) => {
            const result = await revenuesCollection.find().toArray();
            res.send(result);
        })

        app.patch('/revenues', async (req, res) => {
            const transactionData = req.body;

            // Get single expenses document
            const existing = await revenuesCollection.findOne({});
            if (!existing) {
                return res.status(404).send({ message: "Revenue document not found" });
            }

            const filter = { _id: existing._id };

            const categoryExists = existing.categories?.includes(transactionData.category);

            const updateOps = {
                $push: {
                    transactions: transactionData
                }
            };

            if (!categoryExists) {
                updateOps.$push.categories = transactionData.category;
            }

            const result = await revenuesCollection.updateOne(filter, updateOps);

            res.send(result);
        });

        // -------------------------------- End All Revenue Transaction --------------------------------




        // -------------------------------- All Expense Transaction --------------------------------

        app.get('/expenses', async (req, res) => {
            const result = await expensesCollection.find().toArray();
            res.send(result);
        })

        app.patch('/expenses', async (req, res) => {
            const transactionData = req.body;

            // Get single expenses document
            const existing = await expensesCollection.findOne({});
            if (!existing) {
                return res.status(404).send({ message: "Expenses document not found" });
            }

            const filter = { _id: existing._id };

            const categoryExists = existing.categories?.includes(transactionData.category);

            const updateOps = {
                $push: {
                    transactions: transactionData
                }
            };

            if (!categoryExists) {
                updateOps.$push.categories = transactionData.category;
            }

            const result = await expensesCollection.updateOne(filter, updateOps);

            res.send(result);
        });


        // -------------------------------- End All Expense Transaction --------------------------------



















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