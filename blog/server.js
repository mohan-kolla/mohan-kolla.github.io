// blog/server.js

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// === 1) ENABLE CORS AT THE TOP ===
// This ensures preflight (OPTIONS) is handled automatically
app.use(
  cors({
    // For development/demo, allow all origins:
    origin: '*'
    // In production, you might restrict to your front-end domain:
    // origin: 'https://mohankolla.com'
  })
);

// === 2) PARSE JSON REQUEST BODIES ===
app.use(express.json());

// === 3) SERVE STATIC FILES FROM `blog/` FOLDER ===
// When someone visits '/', '/personal-blog.html', '/pageScript.bundle.js', etc.,
// Express will look inside the `blog/` directory for those files.
app.use(express.static(path.join(__dirname)));

// === 4) CONFIGURE POSTGRES CONNECTION ===
// Railway (or your env) should define the env var DATABASE_URL.
// e.g. postgres://username:password@host:5432/dbname?sslmode=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Optional: Test the database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to Postgres:', err.message);
  }
})();

// === 5) EXPLICITLY HANDLE PRE-FLIGHT FOR /api/blog-entries ===
// Because app.use(cors()) is already at the top, you technically don't need this.
// But adding it explicitly ensures OPTIONS requests return the correct headers.
app.options('/api/blog-entries', cors());

// === 6) DEFINE YOUR API ROUTES ===

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

// POST to create or update a blog entry
app.post('/api/blog-entries', async (req, res) => {
  console.log('📝 POST /api/blog-entries body:', req.body);
  const { id, title, content } = req.body;
  // If your table’s "date" column is TEXT, you can use a localized string.
  // If it’s a DATE column, you might do: new Date().toISOString().slice(0,10);
  const currentDate = new Date().toLocaleDateString();

  try {
    if (id) {
      // Attempt to update an existing entry
      const updateResult = await pool.query(
        'UPDATE blog_entries SET title=$1, content=$2, date=$3 WHERE id=$4 RETURNING *',
        [title, content, currentDate, id]
      );
      if (updateResult.rows.length > 0) {
        return res.json(updateResult.rows[0]);
      }
      // If no row was updated (ID didn’t exist), fall through to insert
    }

    // Insert a new blog entry
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

// DELETE a blog entry by ID
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

// === 7) CATCH-ALL: For any other GET request, serve `personal-blog.html` ===
// This makes sure that if someone visits /personal-blog.html or any other “unknown” route,
// they get your blog’s front-end. Adjust if you have a different entry point.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'personal-blog.html'));
});

// === 8) START THE SERVER ===
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
