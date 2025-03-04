// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If your provider requires SSL:
  ssl: { rejectUnauthorized: false }
});

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

// POST to add or update a blog entry
app.post('/api/blog-entries', async (req, res) => {
  const { id, title, content } = req.body;
  const currentDate = new Date().toLocaleDateString();
  try {
    if (id) {
      // Attempt to update an existing entry
      const updateResult = await pool.query(
        'UPDATE blog_entries SET title = $1, content = $2, date = $3 WHERE id = $4 RETURNING *',
        [title, content, currentDate, id]
      );
      if (updateResult.rows.length > 0) {
        res.json(updateResult.rows[0]);
      } else {
        // If no entry was updated, insert a new one
        const insertResult = await pool.query(
          'INSERT INTO blog_entries (title, content, date) VALUES ($1, $2, $3) RETURNING *',
          [title, content, currentDate]
        );
        res.json(insertResult.rows[0]);
      }
    } else {
      // Insert a new blog entry
      const insertResult = await pool.query(
        'INSERT INTO blog_entries (title, content, date) VALUES ($1, $2, $3) RETURNING *',
        [title, content, currentDate]
      );
      res.json(insertResult.rows[0]);
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

app.listen(port, () => console.log(`Server running on port ${port}`));
