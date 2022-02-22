const express = require('express')
const mongoose = require('mongoose')
const session  = require("express-session")
const cors = require('cors')
const { MONGO_USER, MONGO_PASSWORD,MONGO_PORT,MONGO_IP, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require("./config/config")
const redis = require("redis")
let RedisStore = require("connect-redis")(session)
let redisClient = redis.createClient({
    host: REDIS_URL,
    port: REDIS_PORT
})

const postRouter = require("./routes/postRoutes")
const userRouter = require("./routes/userRoutes")

const app = express()

// имена контейнеров в докер-компосе - это dns имена(ip грубо говоря внутри докер сети)

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
    // функциия нужна в случае, если мы не сможем подконектиться
    // к монго контейнеру
    mongoose
    .connect(mongoURL, {
        useNewUrlParser:true,
        useUnifiedTopology:true,
        useFindAndModify:false,
    })
    .then(() => {
        console.log('succesfully connected to DB')
    }).catch((e) => {
        console.log(e)
        setTimeout(connectWithRetry, 5000)
    })
}

connectWithRetry()

//добавляет доступ к ip адресу отправителя

app.enable("trust proxy")

app.use(cors({}))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
        secure: false,
        resave: false,
        saveUnitialized: false,
        httpOnly:true,
        maxAge:1000 * 30
    }
}))

app.use(express.json())

app.get('/api/v1',(req,res) => {
    res.send("<h2>Hi there!!</h2>")
    console.log('yeah it ran')
})

app.use("/api/v1/posts", postRouter)
app.use("/api/v1/users", userRouter)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`listening on port ${port}`))