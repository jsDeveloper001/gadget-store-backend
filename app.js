const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const app = express()
const port = process.env.port || 8080


// const corsOptions = {
//     origin: ["http://localhost:5173", "http://localhost:5174",],
//     credentials: true,
//     optionsSuccessStatus: 200,
// };

// middlewares
// app.use(cors(corsOptions));
app.use(cors())
app.use(express.json())


// JWToken verification by using localStorage
const verifyJWToken = (req, res, next) => {
    const Token = req.headers.authorization
    if (!Token) {
        res.send({ message: "No Token Found" })

    }
    else {
        jwt.verify(Token, process.env.Access_Sign_Key, (error, Decoded) => {
            if (error) {
                return res.send({ message: "invalid token" })
            }
            req.decoded = Decoded;
            next()
        })
    }
}


// Verify seller using JWT
const verifySeller = async (req, res, next) => {
    const userEmail = req.decoded.userEmail.email
    const Query = { email: userEmail }
    const User = await UserCollection.findOne(Query)
    if (User.role == "seller") {
        return next()
    }
    return res.send({ message: "Bad Request for seller" })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

        app.get("/", (req, res) => {
            res.send("gadget-shop running")
        })

        // get an user
        app.get("/user/:email", async (req, res) => {
            const Query = { email: req.params.email }
            const Result = await UserCollection.findOne(Query)
            if (Result) {
                res.send(Result)
            }
            else {
                res.send("User Not Found")
            }
        })

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

        // Add new product
        app.post("/addProduct", verifyJWToken, verifySeller, async (req, res) => {
            const productInfo = req.body
            const Result = await ProductsCollection.insertOne(productInfo)
            res.send(Result)
        })


        // get all products by filtering
        app.get("/all-products", async (req, res) => {

            // if clientside demand any query then inject the query name in Object
            const Query = {}
            const { name, sort, category, brand, page = 1, limit = 10 } = req.query;
            if (name) {
                Query.name = { $regex: name, $options: "i" }// avoid the case sensitivity 
            }
            if (category) {
                Query.category = { $regex: category, $options: "i" }// avoid the case sensitivity 
            }
            if (brand) {
                Query.brand = { $regex: brand, $options: "i" }
            }

            // const sortByPrice = sort === "asc" ? 1 : -1
            let sortByPrice;
            if (sort == "asc") {
                sortByPrice == 1;
            }
            else {
                sortByPrice == -1;
            }

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)

            const Products = await ProductsCollection.find(Query)
                // .skip((pageNumber - 1) * limitNumber)
                // .limit((limitNumber))
                .sort({ price: sortByPrice })
                .toArray()

            // how many documents are presented accorgin query(for pagination purpose)
            const totalProducts = await ProductsCollection.countDocuments(Query)

            // get specific field of collections of documents (not a solution)
            // const productsInfo = await ProductsCollection.find({}, { projection: { category: 1, brand: 1 } }).toArray()
            const Brands = [...new Set(Products.map(productInfo => productInfo.brand))]
            const Categories = [...new Set(Products.map(productInfo => productInfo.category))]

            res.send({ Products, Brands, Categories })

        })

        // add to WishList
        app.patch("/addWishList", async (req, res) => {
            const { email, productId } = req.body
            const Query = { email: email }
            const UpdateList = UserCollection.updateOne(
                Query, { $addToSet: { wishlist: new ObjectId(productId) } })
            res.send(UpdateList)
        })

        app.get("/users/:email", async (req, res) => {
            const Query = { email: req.params.email }
            const UserData = await UserCollection.findOne(Query)
            res.send(UserData)
        })

    }
    catch (error) {
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