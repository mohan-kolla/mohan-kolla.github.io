// server.js

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Allow CORS from any origin (you can lock this down to your domain if desired)
app.use(cors());

// Parse incoming JSON bodies
app.use(express.json());

// === SERVE STATIC FILES ===
// Serve everything inside /blog as static assets.
// For example, a request to "/" or "/personal-blog.html" will be served by blog/personal-blog.html
app.use(express.static(path.join(__dirname, 'blog')));

// === POSTGRESQL POOL CONFIGURATION ===
// Make sure you have set DATABASE_URL in your Railway (or local) environment.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Optional: sanity check at startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Postgres pool.connect() succeeded.');
    client.release();
  } catch (err) {
    console.error('❌ Postgres pool.connect() failed:', err);
  }
})();

// === CRUD API ROUTES FOR /api/blog-entries ===

// GET all blog entries
app.get('/api/blog-entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_entries ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blog entries', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET a single blog entry by ID
app.get('/api/blog-entries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM blog_entries WHERE id = $1',
      [id]
    );
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

// POST to add or update a blog entry
app.post('/api/blog-entries', async (req, res) => {
  const { id, title, content } = req.body;
  // If your table’s date column is TEXT, this works. If it’s DATE, you might want new Date().toISOString().slice(0,10).
  const currentDate = new Date().toLocaleDateString();

  try {
    if (id) {
      // Attempt to update an existing entry
      const updateResult = await pool.query(
        'UPDATE blog_entries SET title = $1, content = $2, date = $3 WHERE id = $4 RETURNING *',
        [title, content, currentDate, id]
      );
      if (updateResult.rows.length > 0) {
        return res.json(updateResult.rows[0]);
      }
      // If no entry was updated, insert a new one instead
      const insertResult = await pool.query(
        'INSERT INTO blog_entries (title, content, date) VALUES ($1, $2, $3) RETURNING *',
        [title, content, currentDate]
      );
      return res.json(insertResult.rows[0]);
    } else {
      // Insert a brand new entry
      const insertResult = await pool.query(
        'INSERT INTO blog_entries (title, content, date) VALUES ($1, $2, $3) RETURNING *',
        [title, content, currentDate]
      );
      return res.json(insertResult.rows[0]);
    }
  } catch (err) {
    console.error('Error saving blog entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a blog entry
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

// === FALLBACK: if someone navigates to "/" or any non-API route, serve index.html from /blog ===
app.get('*', (req, res) => {
  // If no other route matched, send back the personal-blog.html (or whatever your front page is)
  res.sendFile(path.join(__dirname, 'blog', 'personal-blog.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
