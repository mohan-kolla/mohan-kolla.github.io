// server.js
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// File to store blog entries
const BLOG_DATA_FILE = 'blogEntries.json';

// Helper functions to load and save entries
function loadBlogEntries() {
  if (!fs.existsSync(BLOG_DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(BLOG_DATA_FILE);
  return JSON.parse(data);
}

function saveBlogEntries(entries) {
  fs.writeFileSync(BLOG_DATA_FILE, JSON.stringify(entries, null, 2));
}

// GET all blog entries
app.get('/api/blog-entries', (req, res) => {
  const entries = loadBlogEntries();
  res.json(entries);
});

// GET a single blog entry by ID
app.get('/api/blog-entries/:id', (req, res) => {
  const entries = loadBlogEntries();
  const entry = entries.find(e => e.id === req.params.id);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: 'Entry not found' });
  }
});

// POST to add or edit a blog entry
app.post('/api/blog-entries', (req, res) => {
  const entries = loadBlogEntries();
  const { id, title, content } = req.body;

  if (id) {
    // Editing an existing entry
    const index = entries.findIndex(e => e.id === id);
    if (index > -1) {
      entries[index] = { ...entries[index], title, content, date: new Date().toLocaleDateString() };
    } else {
      // If no entry with that ID, treat as new
      entries.push({ id: Date.now().toString(), title, content, date: new Date().toLocaleDateString() });
    }
  } else {
    // Adding a new entry
    entries.push({ id: Date.now().toString(), title, content, date: new Date().toLocaleDateString() });
  }
  
  saveBlogEntries(entries);
  res.json({ success: true });
});

// DELETE a blog entry
app.delete('/api/blog-entries/:id', (req, res) => {
  let entries = loadBlogEntries();
  entries = entries.filter(e => e.id !== req.params.id);
  saveBlogEntries(entries);
  res.json({ success: true });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
