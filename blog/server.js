const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS on all routes
app.use(cors({ origin: '*' }));
// Parse JSON bodies
app.use(express.json());

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

app.options('/api/blog-entries', cors());

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

// CREATE or UPDATE entry
app.post('/api/blog-entries', async (req, res) => {
  console.log('📝 POST body:', req.body);
  const { id, title, content, date } = req.body;

  // If user provided date, parse to ISO; otherwise use today's ISO date
  const isoDate = date
    ? toISODate(date)
    : new Date().toISOString().slice(0, 10);

  // Format for response
  const responseDate = formatDate(isoDate);

  try {
    if (id) {
      const u = await pool.query(
        `UPDATE blog_entries SET title=$1, content=$2, date=$3 WHERE id=$4 RETURNING *`,
        [title, content, isoDate, id]
      );
      if (u.rows.length) {
        const updated = u.rows[0];
        updated.date = responseDate;
        return res.json(updated);
      }
    }
    const i = await pool.query(
      `INSERT INTO blog_entries (title,content,date) VALUES ($1,$2,$3) RETURNING *`,
      [title, content, isoDate]
    );
    const inserted = i.rows[0];
    inserted.date = responseDate;
    res.json(inserted);
  } catch (err) {
    console.error('Error saving entry', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE entry
app.delete('/api/blog-entries/:id', async (req, res) => {
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
