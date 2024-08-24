const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../database/db');

// Directory where files will be uploaded locally
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/pdfs');
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });

// Route to handle file upload
router.post('/upload', upload.single('file'), (req, res) => {
    console.log('Request body:', req.body);
    console.log('Uploaded file details:', req.file);
    return res.json({ Status: "Success" });
});

router.post('/create', (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'File upload error!' });
        }

        console.log('Request body:', req.body);
        console.log('Uploaded file details:', req.file);

        if (!req.file) {
            console.error('No file received or invalid file type');
            return res.status(400).json({ error: 'No file received or invalid file type' });
        }

        try {
            const { title, authors, categories, keywords, abstract } = req.body;
            const filename = req.file.filename;

            // Check if title already exists
            const [existingDocument] = await db.promise().execute('SELECT title FROM researches WHERE title = ?', [title]);
            if (existingDocument.length > 0) {
                console.error('Document with this title already exists:', title);
                return res.status(409).json({ error: 'Document with this title already exists!' });
            }

            // Insert research record
            const [result] = await db.promise().execute('INSERT INTO researches (title, publish_date, abstract, filename) VALUES (?, NOW(), ?, ?)', [title, abstract, filename]);
            const researchId = result.insertId;

            // Insert authors, categories, and keywords
            await insertAuthors(researchId, authors);
            await insertCategories(researchId, categories);
            await insertKeywords(researchId, keywords);

            res.status(201).json({ message: 'Document uploaded successfully' });
        } catch (error) {
            console.error('Error processing upload:', error);
            res.status(500).json({ error: 'Error processing upload' });
        }
    });
});

// Functions to insert authors, categories, and keywords into the database
async function insertAuthors(researchId, authors) {
    const authorNames = authors.split(',').map(name => name.trim());
    for (const name of authorNames) {
        try {
            let [author] = await db.promise().execute('SELECT author_id FROM authors WHERE author_name = ?', [name]);
            if (author.length === 0) {
                const [result] = await db.promise().execute('INSERT INTO authors (author_name) VALUES (?)', [name]);
                author = { author_id: result.insertId };
            } else {
                author = author[0];
            }
            await db.promise().execute('INSERT INTO research_authors (research_id, author_id) VALUES (?, ?)', [researchId, author.author_id]);
        } catch (error) {
            console.error('Error inserting author:', error);
        }
    }
}

async function insertCategories(researchId, categories) {
    const categoryNames = categories.split(',').map(name => name.trim());
    for (const name of categoryNames) {
        try {
            let [category] = await db.promise().execute('SELECT category_id FROM category WHERE category_name = ?', [name]);
            if (category.length === 0) {
                const [result] = await db.promise().execute('INSERT INTO category (category_name) VALUES (?)', [name]);
                category = { category_id: result.insertId };
            } else {
                category = category[0];
            }
            await db.promise().execute('INSERT INTO research_categories (research_id, category_id) VALUES (?, ?)', [researchId, category.category_id]);
        } catch (error) {
            console.error('Error inserting category:', error);
        }
    }
}

async function insertKeywords(researchId, keywords) {
    const keywordNames = keywords.split(',').map(name => name.trim());
    for (const name of keywordNames) {
        try {
            let [keyword] = await db.promise().execute('SELECT keyword_id FROM keywords WHERE keyword_name = ?', [name]);
            if (keyword.length === 0) {
                const [result] = await db.promise().execute('INSERT INTO keywords (keyword_name) VALUES (?)', [name]);
                keyword = { keyword_id: result.insertId };
            } else {
                keyword = keyword[0];
            }
            await db.promise().execute('INSERT INTO research_keywords (research_id, keyword_id) VALUES (?, ?)', [researchId, keyword.keyword_id]);
        } catch (error) {
            console.error('Error inserting keyword:', error);
        }
    }
}

module.exports = router;
