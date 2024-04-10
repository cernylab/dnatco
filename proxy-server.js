const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = 3005;

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8118'); // Allow requests from your React application
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Route for fetching data
app.get('/data/:character/:pdbId', async (req, res) => {
    try {
        const { character, pdbId } = req.params;
        const url = `https://rednatco.datmos.org/pairing/${character}/${pdbId}_basepairs.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Server is running'); // Send a simple response for the root path
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});