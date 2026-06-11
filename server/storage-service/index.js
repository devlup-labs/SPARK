const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../data/cloud');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

const TRASH_DIR = path.join(UPLOAD_DIR, '.trash');
const METADATA_FILE = path.join(UPLOAD_DIR, '.metadata.json');

if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true });
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify({ favorites: [], history: [] }));

function getMetadata() {
    try {
        return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    } catch {
        return { favorites: [], history: [] };
    }
}

function saveMetadata(data) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

function updateHistory(subPath, isNew = false) {
    if (!subPath || subPath === '.metadata.json' || subPath.startsWith('.trash')) return;
    const data = getMetadata();
    const now = new Date().toISOString();
    let item = data.history.find(h => h.path === subPath);
    if (item) {
        item.lastOpened = now;
        if (isNew) item.created = now;
    } else {
        data.history.push({ path: subPath, lastOpened: now, created: now });
    }
    // Keep only last 100 items
    if (data.history.length > 100) data.history.shift();
    saveMetadata(data);
}

// Helper: safely resolve a path inside UPLOAD_DIR, preventing path traversal
function safeResolve(subPath) {
    const resolved = path.resolve(UPLOAD_DIR, subPath || '');
    if (!resolved.startsWith(UPLOAD_DIR)) {
        throw new Error('Path traversal detected');
    }
    return resolved;
}

// List files — supports ?path=subfolder/nested
app.get('/files', (req, res) => {
    let dirPath;
    const subPath = req.query.path || '';
    try {
        dirPath = safeResolve(subPath);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }

    if (subPath) updateHistory(subPath);

    fs.readdir(dirPath, (err, files) => {
        if (err) return res.status(500).json({ error: 'Unable to scan directory' });

        const meta = getMetadata();
        const fileList = files
            .filter(file => file !== '.trash' && file !== '.metadata.json')
            .map(file => {
                const stats = fs.statSync(path.join(dirPath, file));
                const fullSubPath = subPath ? `${subPath}/${file}` : file;
                return {
                    name: file,
                    path: fullSubPath,
                    size: stats.size,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory(),
                    isFavorite: meta.favorites.includes(fullSubPath)
                };
            });
        res.json(fileList);
    });
});

// Favorites Toggle
app.post('/favorites/toggle', (req, res) => {
    const { path: itemPath } = req.body;
    if (!itemPath) return res.status(400).send('Path is required');
    const data = getMetadata();
    const idx = data.favorites.indexOf(itemPath);
    if (idx > -1) data.favorites.splice(idx, 1);
    else data.favorites.push(itemPath);
    saveMetadata(data);
    res.json({ isFavorite: idx === -1 });
});

// List Favorites
app.get('/favorites', (req, res) => {
    const meta = getMetadata();
    const result = [];
    meta.favorites.forEach(itemPath => {
        try {
            const fullPath = safeResolve(itemPath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                result.push({
                    name: path.basename(itemPath),
                    path: itemPath,
                    size: stats.size,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory(),
                    isFavorite: true
                });
            }
        } catch { }
    });
    res.json(result);
});

// List Recent (Last 7 days, sorted by opened/created)
app.get('/recent', (req, res) => {
    const meta = getMetadata();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = meta.history
        .filter(h => new Date(h.lastOpened) > sevenDaysAgo || new Date(h.created) > sevenDaysAgo)
        .sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
        .map(h => {
            try {
                const fullPath = safeResolve(h.path);
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    return {
                        name: path.basename(h.path),
                        path: h.path,
                        size: stats.size,
                        modified: stats.mtime,
                        isDirectory: stats.isDirectory(),
                        isFavorite: meta.favorites.includes(h.path),
                        lastOpened: h.lastOpened,
                        created: h.created
                    };
                }
            } catch { }
            return null;
        })
        .filter(i => i !== null);
    res.json(recent);
});

// List Trash items
app.get('/trash', (req, res) => {
    fs.readdir(TRASH_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Unable to scan trash' });
        const fileList = files.map(file => {
            const stats = fs.statSync(path.join(TRASH_DIR, file));
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        });
        res.json(fileList);
    });
});

// Delete file (Move to Trash)
app.delete('/files/:filename', (req, res) => {
    let filePath;
    const subPath = req.query.path || '';
    try {
        filePath = path.join(safeResolve(subPath), req.params.filename);
    } catch (e) {
        return res.status(400).send(e.message);
    }

    if (fs.existsSync(filePath)) {
        const trashPath = path.join(TRASH_DIR, `${Date.now()}-${req.params.filename}`);
        fs.renameSync(filePath, trashPath);

        // Remove from metadata
        const fullSubPath = subPath ? `${subPath}/${req.params.filename}` : req.params.filename;
        const data = getMetadata();
        data.favorites = data.favorites.filter(f => f !== fullSubPath);
        data.history = data.history.filter(h => h.path !== fullSubPath);
        saveMetadata(data);

        res.json({ message: 'Moved to trash' });
    } else {
        res.status(404).send('File not found');
    }
});

// Permanent Delete from Trash
app.delete('/trash/:filename', (req, res) => {
    const filePath = path.join(TRASH_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
        } else {
            fs.unlinkSync(filePath);
        }
        res.json({ message: 'Permanently deleted' });
    } else {
        res.status(404).send('File not found in trash');
    }
});

// Restore from Trash
app.post('/trash/restore/:filename', (req, res) => {
    const trashPath = path.join(TRASH_DIR, req.params.filename);
    if (fs.existsSync(trashPath)) {
        const originalName = req.params.filename.replace(/^\d+-/, '');
        const restorePath = path.join(UPLOAD_DIR, originalName);
        fs.renameSync(trashPath, restorePath);
        updateHistory(originalName, true);
        res.json({ message: 'Restored successfully' });
    } else {
        res.status(404).send('File not found in trash');
    }
});

// Upload file
const uploadDynamic = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let dest;
            try {
                dest = safeResolve(req.query.path || '');
            } catch (e) {
                return cb(e);
            }
            fs.mkdirSync(dest, { recursive: true });
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

app.post('/upload', uploadDynamic.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const subPath = req.query.path ? `${req.query.path}/${req.file.filename}` : req.file.filename;
    updateHistory(subPath, true);
    res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

// Download file
app.get('/download/:filename', (req, res) => {
    let filePath;
    const subPath = req.query.path || '';
    try {
        filePath = path.join(safeResolve(subPath), req.params.filename);
    } catch (e) {
        return res.status(400).send(e.message);
    }
    if (fs.existsSync(filePath)) {
        const fullSubPath = subPath ? `${subPath}/${req.params.filename}` : req.params.filename;
        updateHistory(fullSubPath);
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// View file inline (for previews — no forced download)
// Supports HTTP Range requests for video/audio seeking
app.get('/view/:filename', (req, res) => {
    let filePath;
    const subPath = req.query.path || '';
    try {
        filePath = path.join(safeResolve(subPath), req.params.filename);
    } catch (e) {
        return res.status(400).send(e.message);
    }
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    const fullSubPath = subPath ? `${subPath}/${req.params.filename}` : req.params.filename;
    updateHistory(fullSubPath);

    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg',
        '.mov': 'video/quicktime', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
        '.aac': 'audio/aac', '.m4a': 'audio/mp4',
        '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // Parse Range header: "bytes=start-end"
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        // Guard against malformed Range headers (NaN values)
        if (isNaN(start) || isNaN(end) || start < 0 || end >= fileSize || start > end) {
            res.writeHead(416, {
                'Content-Range': `bytes */${fileSize}`,
                'Content-Type': contentType,
            });
            return res.end();
        }

        const chunkSize = end - start + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
            'Content-Disposition': 'inline',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Content-Disposition': 'inline',
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

// Create directory
app.post('/mkdir', (req, res) => {
    const { folderName, parentPath } = req.body;
    if (!folderName) return res.status(400).send('Folder name is required');

    let dirPath;
    try {
        dirPath = path.join(safeResolve(parentPath || ''), folderName);
    } catch (e) {
        return res.status(400).send(e.message);
    }
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            const subPath = parentPath ? `${parentPath}/${folderName}` : folderName;
            updateHistory(subPath, true);
            res.json({ message: 'Folder created successfully' });
        } else {
            res.status(400).send('Folder already exists');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read file content
app.get('/content/:filename', (req, res) => {
    let filePath;
    const subPath = req.query.path || '';
    try {
        filePath = path.join(safeResolve(subPath), req.params.filename);
    } catch (e) {
        return res.status(400).send(e.message);
    }

    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
    if (fs.lstatSync(filePath).isDirectory()) return res.status(400).send('Path is a directory');

    const fullSubPath = subPath ? `${subPath}/${req.params.filename}` : req.params.filename;
    updateHistory(fullSubPath);

    const ext = path.extname(req.params.filename).toLowerCase();
    const TEXT_EXTS = ['.txt', '.md', '.log', '.json', '.yaml', '.yml', '.xml', '.csv', '.ini', '.env', '.js', '.ts', '.py', '.sh', '.html', '.css', '.conf'];

    if (TEXT_EXTS.includes(ext)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            res.json({ content, encoding: 'text', ext });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        res.json({ encoding: 'binary', ext });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Storage service running on port ${PORT}`);
});
server.timeout = 1800000; // 30 minutes timeout for large uploads
