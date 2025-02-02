const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Create a new institution
router.post('/institutions', async (req, res) => {
    const { institution_name } = req.body;
    
    if (!institution_name) {
        return res.status(400).json({ message: 'Institution name is required' });
    }

    try {
        const createInstitutionQuery = 'INSERT INTO institution (institution_name) VALUES (?)';
        const [result] = await db.query(createInstitutionQuery, [institution_name]);

        res.status(201).json({ message: 'Institution created successfully', institution_id: result.insertId });
    } catch (error) {
        console.error('Error creating institution:', error);
        res.status(500).json({ error: 'Institution creation failed' });
    }
});
// Retrieve all institutions
router.get('/institutions/all', async (req, res) => {
    try {
        const getAllInstitutionsQuery = 'SELECT * FROM institution';
        const [rows] = await db.query(getAllInstitutionsQuery);

        res.status(200).json({ institutions: rows });
    } catch (error) {
        console.error('Error retrieving institutions:', error);
        res.status(500).json({ error: 'Failed to retrieve institutions' });
    }
});

// Retrieve a single institution by ID
router.get('/institutions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const getInstitutionByIdQuery = 'SELECT * FROM institution WHERE institution_id = ?';
        const [rows] = await db.query(getInstitutionByIdQuery, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        res.status(200).json({ institution: rows[0] });
    } catch (error) {
        console.error('Error retrieving institution:', error);
        res.status(500).json({ error: 'Failed to retrieve institution' });
    }
});

// Update an institution by ID
router.put('/institutions/:id', async (req, res) => {
    const { id } = req.params;
    const { institution_name } = req.body;

    if (!institution_name) {
        return res.status(400).json({ message: 'Institution name is required' });
    }

    try {
        const updateInstitutionQuery = 'UPDATE institution SET institution_name = ? WHERE institution_id = ?';
        const [result] = await db.query(updateInstitutionQuery, [institution_name, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        res.status(200).json({ message: 'Institution updated successfully' });
    } catch (error) {
        console.error('Error updating institution:', error);
        res.status(500).json({ error: 'Failed to update institution' });
    }
});

// Delete an institution by ID
router.delete('/institutions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleteInstitutionQuery = 'DELETE FROM institution WHERE institution_id = ?';
        const [result] = await db.query(deleteInstitutionQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        res.status(200).json({ message: 'Institution deleted successfully' });
    } catch (error) {
        console.error('Error deleting institution:', error);
        res.status(500).json({ error: 'Failed to delete institution' });
    }
});

module.exports = router;
