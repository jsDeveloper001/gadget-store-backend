const express = require("express")
const cors = require("cors")
require("dotenv").config()
const app = express()
const port = process.env.port || 8080

// middlewares
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const run = async () => {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } catch (error) {
        console.log(error.name, error.message)
    }
}
run()

app.listen(port, () => console.log("server running on", port))