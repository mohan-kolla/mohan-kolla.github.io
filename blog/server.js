const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS on all routes (this handles OPTIONS preflight)
app.use(cors({
  origin: '*' // or ['https://mohankolla.com'] for a more restrictive CORS policy
}));

// Parse JSON bodies
app.use(express.json());

// Configure Postgres pool (Railway will set process.env.DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Sanity-check Postgres connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to Postgres:', err.message);
  }
})();

// Explicitly handle OPTIONS (redundant if app.use(cors()) is at the top)
app.options('/api/blog-entries', cors());

// GET all entries
app.get('/api/blog-entries', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blog_entries ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blog entries', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET a single entry by id
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

// CREATE or UPDATE an entry
app.post('/api/blog-entries', async (req, res) => {
  console.log('📝 POST /api/blog-entries body:', req.body);
  const { id, title, content, date } = req.body;

  // Use client-supplied date (YYYY-MM-DD) or default to today
  const postDate = date
    ? new Date(date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  try {
    if (id) {
      // Update existing entry
      const updateResult = await pool.query(
        `UPDATE blog_entries
         SET title   = $1,
             content = $2,
             date    = $3
         WHERE id    = $4
         RETURNING *`,
        [title, content, postDate, id]
      );
      if (updateResult.rows.length > 0) {
        return res.json(updateResult.rows[0]);
      }
      // Optionally fall through to insert if no row was updated
    }

    // Insert new entry
    const insertResult = await pool.query(
      `INSERT INTO blog_entries (title, content, date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, postDate]
    );
    res.json(insertResult.rows[0]);

  } catch (err) {
    console.error('Error saving blog entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE an entry
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

// Serve static files (including personal-blog.html) from project root
app.use(express.static(path.join(__dirname)));

// Catch-all: send personal-blog.html for any other GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'personal-blog.html'));
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
