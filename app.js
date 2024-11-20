const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
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

const GadgetShop = client.db("GadgetShop")
const UserCollection = GadgetShop.collection("Users")
const ProductsCollection = GadgetShop.collection("Products")
const run = async () => {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Create New User
        app.post("/addUser", async (req, res) => {
            const NewUser = req.body
            const Query = { email: NewUser.email }
            const ExisingUser = await UserCollection.findOne(Query)
            if (ExisingUser) {
                res.send("Already Existed")
            }
            else {
                const AddedUser = await UserCollection.insertOne(NewUser)
                res.send(AddedUser)
            }

        })


    } catch (error) {
        console.log(error.name, error.message)
    }
}


run()


// jwt token POST API for secure APIs
app.post("/authentication", async (req, res) => {
    const userEmail = req.body

    // const Token = jwt.sign({data: ""}, "secret Key", {expiresIn: "2d"})
    const Token = jwt.sign({ userEmail }, process.env.Access_Sign_Key, { expiresIn: "2d" })
    res.send(Token)
})

app.listen(port, () => console.log("server running on", port))