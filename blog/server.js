const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Only your own sites may call this API from a browser.
const ALLOWED_ORIGINS = [
  'https://mohankolla.com',
  'https://www.mohankolla.com',
  'https://mohan-kolla.github.io'
];
app.use(cors({ origin: ALLOWED_ORIGINS }));
// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rejects any write request that does not carry the correct admin token.
// Set ADMIN_TOKEN in Railway's Variables tab. If it is missing, all writes are refused.
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    console.error('ADMIN_TOKEN is not set; refusing write request');
    return res.status(503).json({ error: 'Writes are disabled' });
  }
  const header = req.get('Authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Format a Date (or date-string) as MM/DD/YYYY
function formatDate(input) {
  const dt = new Date(input);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Parse MM/DD/YYYY or ISO YYYY-MM-DD into ISO YYYY-MM-DD
function toISODate(input) {
  if (!input) return null;
  if (input.includes('/')) {
    const [m, d, y] = input.split('/');
    return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return input.slice(0, 10);
}

// Check Postgres connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to Postgres:', err.message);
  }
})();

// GET all entries
app.get('/api/blog-entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_entries ORDER BY id ASC');
    const rows = result.rows.map(row => ({
      ...row,
      date: formatDate(row.date)
    }));
    res.json(rows);
  } catch (err) {
    console.error('Error fetching entries', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET one entry
app.get('/api/blog-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM blog_entries WHERE id=$1', [id]);
    if (result.rows.length) {
      const entry = result.rows[0];
      entry.date = formatDate(entry.date);
      return res.json(entry);
    }
    res.status(404).json({ error: 'Entry not found' });
  } catch (err) {
    console.error('Error fetching entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CREATE entry
app.post('/api/blog-entries', requireAdmin, async (req, res) => {
  const { content, date } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const isoDate = date ? toISODate(date) : new Date().toISOString().slice(0, 10);

  try {
    const i = await pool.query(
      `INSERT INTO blog_entries (content, date) VALUES ($1, $2) RETURNING *`,
      [content, isoDate]
    );
    const inserted = i.rows[0];
    inserted.date = formatDate(isoDate);
    res.status(201).json(inserted);
  } catch (err) {
    console.error('Error saving entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// UPDATE entry (the blog page sends PUT when editing)
app.put('/api/blog-entries/:id', requireAdmin, async (req, res) => {
  const { content, date } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const isoDate = date ? toISODate(date) : new Date().toISOString().slice(0, 10);

  try {
    const u = await pool.query(
      `UPDATE blog_entries SET content=$1, date=$2 WHERE id=$3 RETURNING *`,
      [content, isoDate, req.params.id]
    );
    if (!u.rows.length) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const updated = u.rows[0];
    updated.date = formatDate(isoDate);
    res.json(updated);
  } catch (err) {
    console.error('Error updating entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE entry
app.delete('/api/blog-entries/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM blog_entries WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve static
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'personal-blog.html'))
);

app.listen(port, () => console.log(`Server on port ${port}`));
