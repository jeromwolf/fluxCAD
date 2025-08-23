#!/usr/bin/env node

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')

const port = process.env.PORT || 1234

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket Server')
})

const wss = new WebSocket.Server({ server })

wss.on('connection', (ws, req) => {
  console.log('새로운 Yjs 연결')
  setupWSConnection(ws, req)
})

server.listen(port, () => {
  console.log(`Yjs WebSocket 서버가 포트 ${port}에서 실행 중입니다.`)
})