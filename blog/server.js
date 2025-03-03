// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BLOG_DATA_FILE = 'blogEntries.json';

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

app.get('/api/blog-entries', (req, res) => {
  const entries = loadBlogEntries();
  res.json(entries);
});

app.get('/api/blog-entries/:id', (req, res) => {
  const entries = loadBlogEntries();
  const entry = entries.find(e => e.id === req.params.id);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: 'Entry not found' });
  }
});

app.post('/api/blog-entries', (req, res) => {
  const entries = loadBlogEntries();
  const { id, title, content } = req.body;

  if (id) {
    const index = entries.findIndex(e => e.id === id);
    if (index > -1) {
      entries[index] = { ...entries[index], title, content, date: new Date().toLocaleDateString() };
    } else {
      entries.push({ id: Date.now().toString(), title, content, date: new Date().toLocaleDateString() });
    }
  } else {
    entries.push({ id: Date.now().toString(), title, content, date: new Date().toLocaleDateString() });
  }
  
  saveBlogEntries(entries);
  res.json({ success: true });
});

app.delete('/api/blog-entries/:id', (req, res) => {
  let entries = loadBlogEntries();
  entries = entries.filter(e => e.id !== req.params.id);
  saveBlogEntries(entries);
  res.json({ success: true });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
