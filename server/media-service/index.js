const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(__dirname, '../data/media');
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, '../data/photos');
const SHORTS_DIR = process.env.SHORTS_DIR || path.join(__dirname, '../data/shorts');

// Ensure directories exist
[MEDIA_DIR, PHOTOS_DIR, SHORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.use(cors());

// Configure Multer for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.query.type || 'media';
        let dest = MEDIA_DIR;
        if (type === 'photo') dest = PHOTOS_DIR;
        if (type === 'short') dest = SHORTS_DIR;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    limits: {
        files: 20,
    },
});

// Upload media
app.post('/upload', upload.array('files', 20), (req, res) => {
    const files = req.files || [];
    if (!files.length) return res.status(400).send('No files uploaded.');

    res.json({
        message: 'Files uploaded successfully',
        files: files.map((file) => ({
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
        })),
    });
});

// List files by type
app.get('/files/:type', (req, res) => {
    const type = req.params.type;
    let dir = MEDIA_DIR;
    if (type === 'photos') dir = PHOTOS_DIR;
    if (type === 'shorts') dir = SHORTS_DIR;

    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Unable to scan directory' });
        const mappedFiles = files
            .filter(f => !f.startsWith('.'))
            .map(file => {
                const stats = fs.statSync(path.join(dir, file));
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime
                };
            });
        res.json(mappedFiles);
    });
});

// Stream/Serve files
app.get('/stream/:type/:filename', (req, res) => {
    const { type, filename } = req.params;
    let dir = MEDIA_DIR;
    if (type === 'photos') dir = PHOTOS_DIR;
    if (type === 'shorts') dir = SHORTS_DIR;
    
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) contentType = `image/${ext.slice(1)}`;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

// List media files (Backward compatibility)
app.get('/media', (req, res) => {
    fs.readdir(MEDIA_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Unable to scan media directory' });
        const mediaFiles = files
            .filter(f => f.endsWith('.mp4') || f.endsWith('.mp3'))
            .map(file => {
                const stats = fs.statSync(path.join(MEDIA_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime
                };
            });
        res.json(mediaFiles);
    });
});

// Stream media with range support (Backward compatibility)
app.get('/stream/:filename', (req, res) => {
    const filePath = path.join(MEDIA_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('Media not found');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': filePath.endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': filePath.endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

const server = app.listen(PORT, () => {
    console.log(`Media service running on port ${PORT}`);
});
server.timeout = 1800000; // 30 minutes timeout for large uploads
