// blog/server.js

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 1) Enable CORS on all routes (this handles OPTIONS preflight)
app.use(cors({
  origin: '*' // or ['https://mohankolla.com'] for a more restrictive CORS policy
}));

// 2) Parse JSON bodies
app.use(express.json());

// 3) Configure Postgres pool (Railway will set process.env.DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Optional: sanity‐check Postgres connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to Postgres:', err.message);
  }
})();

// 4) Explicitly handle OPTIONS (redundant if app.use(cors()) is at the top)
app.options('/api/blog-entries', cors());

// 5) Define API routes
app.get('/api/blog-entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_entries ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blog entries', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/blog-entries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM blog_entries WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (err) {
    console.error('Error fetching blog entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/blog-entries', async (req, res) => {
  console.log('📝 POST /api/blog-entries body:', req.body);
  const { id, title, content } = req.body;
  const currentDate = new Date().toLocaleDateString();
  try {
    if (id) {
      // Update existing:
      const updateResult = await pool.query(
        'UPDATE blog_entries SET title=$1, content=$2, date=$3 WHERE id=$4 RETURNING *',
        [title, content, currentDate, id]
      );
      if (updateResult.rows.length > 0) {
        return res.json(updateResult.rows[0]);
      }
    }
    // Otherwise insert new:
    const insertResult = await pool.query(
      'INSERT INTO blog_entries (title, content, date) VALUES ($1, $2, $3) RETURNING *',
      [title, content, currentDate]
    );
    res.json(insertResult.rows[0]);
  } catch (err) {
    console.error('Error saving blog entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/blog-entries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM blog_entries WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting blog entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6) Serve static files (including personal-blog.html) from /blog
app.use(express.static(path.join(__dirname)));

// 7) Catch-all: send personal-blog.html for any other GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'personal-blog.html'));
});

// 8) Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
