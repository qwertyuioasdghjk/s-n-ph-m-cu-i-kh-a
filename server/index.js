import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

dotenv.config()

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const productsPath = path.join(projectRoot, 'product.json')

app.get('/', (req, res) => {
  res.type('text/plain').send('API server running')
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/products', async (req, res) => {
  try {
    const raw = await fs.readFile(productsPath, 'utf-8')
    const data = JSON.parse(raw)
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to load products' })
  }
})

app.get('/api/products/all', async (req, res) => {
  try {
    const raw = await fs.readFile(productsPath, 'utf-8')
    const data = JSON.parse(raw)
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to load products' })
  }
})


const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})