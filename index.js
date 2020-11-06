const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyparser = require('body-parser');
const dotenv = require('dotenv').config();
const mongodb = require('mongodb');
const client = mongodb.MongoClient;


const app = express();
const dburl = process.env.DB_URL || "mongodb://localhost:27017";
const port = process.env.PORT || 4000;

//middle ware
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors());
app.use(bodyparser.json())

app.get('/', async(req, res) => {
    res.send("Welcome to main page!!!")
})


//register
app.post('/register', async(req, res) => {
    try {
        let connection = await client.connect(dburl);
        let db = connection.db("login");
        let data = await db.collection("users").findOne({ email: req.body.email })
        if (data) {
            res.status(400).json({ message: "User already exists" });
        } else {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash;
            await db.collection("users").insertOne(req.body);
            res.status(200).json({ message: "Registration Successful" });
        }
        await connection.close();
    } catch (error) {
        console.log("error : " + error);
    }

})


//routes
app.post('/sendemail', async(req, res) => {
    try {
        let connection = await client.connect(dburl);
        let db = connection.db("login");
        let checkvalidity = await db.collection("users").findOne({ email: req.body.email })
        if (checkvalidity) {
            let data = await db.collection("reset").insertOne(req.body);
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            let mailOptions = {
                from: "krishnakireeti.mamidi@gmail.com",
                to: "krishchats024@gmail.com",
                subject: "Password reset",
                html: `<div>
                <h4>Hello ${checkvalidity.name},<h4>

                <p>Enter the code ${req.body.keytomail} in the webpage!!</p>

                <p>Regards,
                Mail reset team</p>
                </div>`
            }

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log("Error occuries while sending mail");
                } else {
                    res.status(200).json({ message: "Email sent !!" })
                }
            })

        } else {
            res.status(400).json({ message: "User doesn't exist in data base!" })
        }
    } catch (error) {
        console.log(error);
    }
})


app.post('/code', async(req, res) => {
    let connection = await client.connect(dburl);
    let db = connection.db("login");
    let ismatching = await db.collection('reset').findOne({ "keytomail": req.body.code });
    if (ismatching) {
        res.status(200).json({ message: "success" });
    } else {
        res.status(400).json({ message: "string did not match" });
    }
})

app.put('/resetpassword', async(req, res) => {
    let connection = await client.connect(dburl);
    let db = connection.db("login");
    console.log(req.body);
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    console.log(hash);
    let updatepassword = await db.collection("users").updateOne({ "email": req.body.email }, { $set: { "password": req.body.password } });
    if (updatepassword) {
        res.status(200).json({ message: "Password Updated successfully" })
    } else {
        res.status(400).json({ message: "Password Updation failed" })
    }
})

app.listen(port, () => console.log("Server started!!!"));