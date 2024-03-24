import { Server } from 'socket.io';
import { createServer } from 'http';
import express, { Express } from 'express';
import helmet from 'helmet'
import dotenv from 'dotenv';
import cors from 'cors'
import { HTTP_METHODS } from 'contracts';

const app: Express = express();
const http = createServer(app);

// middlewares etc.
app.use(helmet())
app.use(cors({ origin: ['http://localhost:3000'] }))
// TODO (opt) for now it is ok, to keep dotenv, but as project grows it's worth noting that turbo has mechanics to handle global env files: https://turbo.build/repo/docs/handbook/environment-variables
dotenv.config()

// http routes

// io setup
const io = new Server(http, {
  cors: {
    methods: [HTTP_METHODS.GET, HTTP_METHODS.POST]
  }
});

// io routes
io.on('connection', (socket) => {
  console.log('new ws connection', socket.id)
})
