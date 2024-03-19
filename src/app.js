import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

// configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: '16kb'
})) // limits the json input data

app.use(urlencoded({
    extended: true, 
    limit: '16kb'
})) // recieve data from url request

app.use(express.static("public")) // stores assets in public folder
app.use(cookieParser())


// routes
import userRouter from './routes/user.routes.js'
app.use('/api/v1/users', userRouter)

export {app}