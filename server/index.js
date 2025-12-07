import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import Product from './product.js'
dotenv.config()

const MONGO_URI = process.env.MONGO_URI
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).then(() => {
    console.log('MongoDB connected')
  }).catch(() => {})
}

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

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  active: { type: Boolean, default: true }
}, { collection: 'users' })
const User = mongoose.models.User || mongoose.model('User', userSchema)
const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, default: 0 },
  minTotal: { type: Number, default: 0 },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 }
}, { collection: 'coupons' })
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)
const dbReady = () => mongoose.connection && mongoose.connection.readyState === 1
const loadFileProducts = async () => {
  const raw = await fs.readFile(productsPath, 'utf-8')
  return JSON.parse(raw)
}
const saveFileProducts = async (arr) => {
  await fs.writeFile(productsPath, JSON.stringify(arr, null, 2))
}

const issueTokens = (user) => {
  const uid = user.id || (user._id ? user._id.toString() : undefined)
  const accessToken = jwt.sign({ sub: uid, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ sub: uid, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

app.get('/', (req, res) => {
  res.type('text/plain').send('API server running')
})
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/products', async (req, res) => {
  try {
    const list = await Product.find()
    if (!list || list.length === 0) {
      const raw = await fs.readFile(productsPath, 'utf-8')
      const data = JSON.parse(raw)
      return res.json(data)
    }
    res.json(list)
  } catch {
    try {
      const raw = await fs.readFile(productsPath, 'utf-8')
      const data = JSON.parse(raw)
      res.json(data)
    } catch {
      res.status(500).json({ error: 'Failed to load products' })
    }
  }
})

app.get('/api/products/all', async (req, res) => {
  try {
    const list = await Product.find()
    if (!list || list.length === 0) {
      const raw = await fs.readFile(productsPath, 'utf-8')
      const data = JSON.parse(raw)
      return res.json(data)
    }
    res.json(list)
  } catch {
    try {
      const raw = await fs.readFile(productsPath, 'utf-8')
      const data = JSON.parse(raw)
      res.json(data)
    } catch {
      res.status(500).json({ error: 'Failed to load products' })
    }
  }
})
app.get('/api/products/:category', async (req, res) => {
  try {
    const cat = req.params.category
    if (dbReady()) {
      const list = await Product.find({ category: cat })
      return res.json(list)
    }
    const data = await loadFileProducts()
    const filtered = data.filter(p => String(p.category) === String(cat))
    res.json(filtered)
  } catch {
    try {
      const data = await loadFileProducts()
      const filtered = data.filter(p => String(p.category) === String(req.params.category))
      res.json(filtered)
    } catch {
      res.status(500).json({ error: 'Failed to load products' })
    }
  }
})
const requireAdmin = (req) => {
  const auth = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  try {
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    return !!payload && payload.role === 'admin'
  } catch {
    return false
  }
}
app.post('/api/products', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const { id, name, price, description, Image, category } = req.body || {}
  if (!name || !category) return res.status(400).json({ error: 'Missing fields' })
  try {
    if (dbReady()) {
      const doc = await Product.create({ id: id || String(Date.now()), name, price, description, Image, category })
      return res.status(201).json(doc)
    }
    const arr = await loadFileProducts()
    const newItem = { id: id || String(Date.now()), name, price, description, Image, category }
    arr.push(newItem)
    await saveFileProducts(arr)
    res.status(201).json(newItem)
  } catch {
    res.status(500).json({ error: 'Create failed' })
  }
})
app.patch('/api/products/:id', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const id = req.params.id
  const update = req.body || {}
  try {
    if (dbReady()) {
      let doc = await Product.findOneAndUpdate({ id }, update, { new: true })
      if (!doc) {
        try {
          doc = await Product.findByIdAndUpdate(id, update, { new: true })
        } catch {}
      }
      if (doc) return res.json(doc)
      
    }
    const arr = await loadFileProducts()
    const idx = arr.findIndex(p => String(p.id) === String(id))
    if (idx < 0) return res.status(404).json({ error: 'Not found' })
    const merged = { ...arr[idx], ...update }
    arr[idx] = merged
    await saveFileProducts(arr)
    res.json(merged)
  } catch {
    res.status(500).json({ error: 'Update failed' })
  }
})
app.delete('/api/products/:id', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const id = req.params.id
  try {
    if (dbReady()) {
      let doc = await Product.findOneAndDelete({ id })
      if (!doc) {
        try {
          doc = await Product.findByIdAndDelete(id)
        } catch {}
      }
      if (doc) return res.json({ ok: true })
      // fall through to file if DB connected but no document matched
    }
    const arr = await loadFileProducts()
    const idx = arr.findIndex(p => String(p.id) === String(id))
    if (idx < 0) return res.status(404).json({ error: 'Not found' })
    arr.splice(idx, 1)
    await saveFileProducts(arr)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Delete failed' })
  }
})
app.post('/api/products/seed', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const raw = await fs.readFile(productsPath, 'utf-8')
    const data = JSON.parse(raw)
    const ops = data.map(p => ({ updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true } }))
    if (ops.length) await Product.bulkWrite(ops)
    const list = await Product.find()
    res.json(list)
  } catch {
    res.status(500).json({ error: 'Seed failed' })
  }
})

app.get('/api/coupons/active', async (req, res) => {
  try {
    const list = dbReady() ? await Coupon.find({ active: true }) : []
    res.json(list)
  } catch {
    res.status(500).json({ error: 'Failed to load coupons' })
  }
})
app.post('/api/coupons', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const { code, type, value, minTotal, expiresAt, active, usageLimit } = req.body || {}
  if (!code) return res.status(400).json({ error: 'Missing code' })
  try {
    if (!dbReady()) return res.status(503).json({ error: 'DB unavailable' })
    const c = await Coupon.create({ code: String(code).toUpperCase(), type, value, minTotal, expiresAt, active, usageLimit })
    res.status(201).json(c)
  } catch {
    res.status(500).json({ error: 'Create failed' })
  }
})
app.patch('/api/coupons/:code', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const code = String(req.params.code).toUpperCase()
  try {
    if (!dbReady()) return res.status(503).json({ error: 'DB unavailable' })
    const c = await Coupon.findOneAndUpdate({ code }, req.body || {}, { new: true })
    if (!c) return res.status(404).json({ error: 'Not found' })
    res.json(c)
  } catch {
    res.status(500).json({ error: 'Update failed' })
  }
})
app.delete('/api/coupons/:code', async (req, res) => {
  if (!requireAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const code = String(req.params.code).toUpperCase()
  try {
    if (!dbReady()) return res.status(503).json({ error: 'DB unavailable' })
    const c = await Coupon.findOneAndDelete({ code })
    if (!c) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Delete failed' })
  }
})
app.post('/api/coupons/apply', async (req, res) => {
  try {
    const { code, total } = req.body || {}
    if (!code || typeof total !== 'number') return res.status(400).json({ error: 'Missing code or total' })
    let c = null
    if (dbReady()) c = await Coupon.findOne({ code: String(code).toUpperCase() })
    if (!c) return res.status(404).json({ error: 'Coupon not found' })
    if (!c.active) return res.status(400).json({ error: 'Coupon inactive' })
    if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return res.status(400).json({ error: 'Coupon expired' })
    if (c.usageLimit && c.usedCount >= c.usageLimit) return res.status(400).json({ error: 'Coupon usage exceeded' })
    if (c.minTotal && total < c.minTotal) return res.status(400).json({ error: 'Order not eligible' })
    const discount = c.type === 'percent' ? Math.floor(total * (c.value / 100)) : Math.min(c.value, total)
    const finalTotal = Math.max(total - discount, 0)
    res.json({ code: c.code, type: c.type, value: c.value, discount, finalTotal })
  } catch {
    res.status(500).json({ error: 'Apply failed' })
  }
})

app.post('/api/v1/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET)
    if (!payload || payload.type !== 'refresh') return res.status(400).json({ error: 'Invalid token' })
    const uid = payload.sub
    let userDoc = null
    try {
      userDoc = await User.findById(uid)
    } catch {}
    if (!userDoc) {
      const idNumber = Number(uid)
      const mem = users.find(u => u.id === idNumber)
      if (!mem) return res.status(404).json({ error: 'User not found' })
      const tokens = issueTokens(mem)
      return res.json(tokens)
    }
    const tokens = issueTokens(userDoc)
    res.json(tokens)
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
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


app.post('/api/v1/users/sign-in', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })
  try {
    const found = await User.findOne({ username })
    if (found) {
      const ok = bcrypt.compareSync(password, found.password)
      if (!ok) return res.status(401).json({ error: 'Invalid username or password' })
      const { password: _, ...safeUser } = found.toObject()
      const tokens = issueTokens(found)
      return res.json({ user: safeUser, ...tokens })
    }
    const fallback = users.find(u => u.username === username)
    if (!fallback) return res.status(401).json({ error: 'Invalid username or password' })
    const isHashed = typeof fallback.password === 'string' && fallback.password.startsWith('$2')
    const ok2 = isHashed ? bcrypt.compareSync(password, fallback.password) : fallback.password === password
    if (!ok2) return res.status(401).json({ error: 'Invalid username or password' })
    const { password: _pw, ...safeUser2 } = fallback
    const tokens2 = issueTokens(fallback)
    res.json({ user: safeUser2, ...tokens2 })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})


app.post('/api/v1/users/sign-up', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
  try {
    const existsDb = await User.exists({ username })
    const existsMem = users.some(u => u.username === username)
    if (existsDb || existsMem) return res.status(409).json({ error: 'Username already exists' })
    const hash = bcrypt.hashSync(password, 10)
    const created = await User.create({ username, password: hash, role: 'user', active: true })
    const { password: _, ...safeUser } = created.toObject()
    res.status(201).json({ user: safeUser })
  } catch {
    res.status(500).json({ error: 'Sign-up failed' })
  }
})


const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
app.get('/api/v1/users', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const list = await User.find({}, 'username role active')
    const usersOut = list.map(u => ({ id: u._id.toString(), username: u.username, role: u.role, active: u.active }))
    res.json({ users: usersOut })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = req.params.id
    const found = await User.findById(id)
    if (!found) return res.status(404).json({ error: 'Not found' })
    const { password: _, ...safeUser } = found.toObject()
    res.json({ user: safeUser })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.delete('/api/v1/users/:id', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = req.params.id
    const doc = await User.findById(id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    if (doc.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' })
    await User.findByIdAndDelete(id)
    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
app.patch('/api/v1/users/:id', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = token ? jwt.verify(token, JWT_SECRET) : null
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const id = req.params.id
    const { active, role } = req.body || {}
    const doc = await User.findById(id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    if (typeof active === 'boolean') doc.active = active
    if (role && doc.role !== 'admin') doc.role = role
    await doc.save()
    const { password: _, ...safeUser } = doc.toObject()
    res.json({ user: safeUser })
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
