const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');
require('dotenv').config();

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// List containers
app.get('/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start container
app.post('/containers/:id/start', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.start();
        res.json({ message: 'Container started' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stop container
app.post('/containers/:id/stop', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.stop();
        res.json({ message: 'Container stopped' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get container stats
app.get('/containers/:id/stats', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const stats = await container.stats({ stream: false });
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Admin service running on port ${PORT}`);
});
