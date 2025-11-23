import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const productsPath = path.join(projectRoot, 'product.json')
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', active: true },
  { id: 2, username: 'TranBao', password: '123', role: 'user', active: true },
]
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

const issueTokens = (user) => {
  const accessToken = jwt.sign({ sub: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }
  const found = users.find(u => u.username === username)
  if (found) {
    const isHashed = typeof found.password === 'string' && found.password.startsWith('$2')
    const ok = isHashed ? bcrypt.compareSync(password, found.password) : found.password === password
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    const { password: _, ...safeUser } = found
    const tokens = issueTokens(found)
    return res.json({ user: safeUser, ...tokens })
  }
  if (!found) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }
  const { password: _pw, ...safeUser } = found
  const tokens = issueTokens(found)
  res.json({ user: safeUser, ...tokens })
})


app.post('/api/v1/users/sign-in', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })
  const user = users.find(u => u.username === username)
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })
  const isHashed = typeof user.password === 'string' && user.password.startsWith('$2')
  const ok = isHashed ? bcrypt.compareSync(password, user.password) : user.password === password
  if (!ok) return res.status(401).json({ error: 'Invalid username or password' })
  const { password: _, ...safeUser } = user
  const tokens = issueTokens(user)
  res.json({ user: safeUser, ...tokens })
})


app.post('/api/v1/users/sign-up', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
  const exists = users.some(u => u.username === username)
  if (exists) return res.status(409).json({ error: 'Username already exists' })
  const hash = bcrypt.hashSync(password, 10)
  const newUser = { id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, username, password: hash, role: 'user', active: true }
  users.push(newUser)
  const { password: _, ...safeUser } = newUser
  res.status(201).json({ user: safeUser })
})


const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
app.get('/api/v1/users', (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const list = users.map(u => ({ id: u.id, username: u.username, role: u.role, active: u.active }))
    res.json({ users: list })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.get('/api/v1/users/:id', (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = Number(req.params.id)
    const found = users.find(u => u.id === id)
    if (!found) return res.status(404).json({ error: 'Not found' })
    const { password: _, ...safeUser } = found
    res.json({ user: safeUser })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.delete('/api/v1/users/:id', (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = Number(req.params.id)
    const idx = users.findIndex(u => u.id === id)
    if (idx < 0) return res.status(404).json({ error: 'Not found' })
    if (users[idx].role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' })
    users.splice(idx, 1)
    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.patch('/api/v1/users/:id', (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = Number(req.params.id)
    const found = users.find(u => u.id === id)
    if (!found) return res.status(404).json({ error: 'Not found' })
    const { active, role } = req.body || {}
    if (typeof active === 'boolean') found.active = active
    if (role && found.role !== 'admin') found.role = role
    const { password: _, ...safeUser } = found
    res.json({ user: safeUser })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})