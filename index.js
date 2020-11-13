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

app.options('/sendemail', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.end();
});

app.get('/', async(req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "index.html"))
})

//register
app.get('/register', async(req, res) => {
    res.status(200).redirect('/#register')
})

app.post('/login', async(req, res) => {
    try {
        let connection = await client.connect(dburl);
        let db = connection.db('login');
        let data = await db.collection('users').findOne({ email: req.body.email });
        if (data) {
            let compare = await bcrypt.compare(req.body.password, data.password);
            if (compare) {
                res.status(200).json({ message: "Login Success!!" });
            } else {
                res.status(400).json({ message: "Login Failed!!" });
            }
        } else {
            res.status(401).json({ message: "Email not registered!" })
        }
        await connection.close();
    } catch (error) {
        console.log('Login Error :' + error);
    }
})


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
                to: req.body.email,
                subject: "Password reset",
                html: `<div>
                <h4>Hello ${checkvalidity.name},</h4>

                <p>Enter the code ${req.body.keytomail} in the webpage!!</p>

                <p>Regards</p>,
                <p>Password reset team</p>
                </div>`
            }

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log("Error occuries while sending mail");
                } else {
                    res.status(200).json({ message: "Email sent !!" })
                }
            })
            await connection.close();
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
    console.log(ismatching);
    if (ismatching !== null) {
        res.status(200).json({ message: "success" });
    } else {
        res.status(400).json({ message: "string did not match" });
    }
    await connection.close();
})

app.put('/resetpassword', async(req, res) => {
    let connection = await client.connect(dburl, { useUnifiedTopology: true });
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
    await connection.close();
})

app.listen(port, () => console.log("Server started at port 4000!!!"));