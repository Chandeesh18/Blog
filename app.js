const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('./models/Post');

const app = express();

// Serve static files (including CSS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.css') {
            res.setHeader('Content-Type', 'text/css');
        }
    },
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://chandeesh2005016:72kv8cywPYq7Bxp4@cluster0.niyxwuh.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/images'; // Destination directory
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        res.render('index', { posts: posts });
    } catch (error) {
        console.error(error);
        res.render('index', { posts: [] });
    }
});

app.get('/compose', (req, res) => {
    res.render('compose');
});

app.post('/compose', upload.single('image'), async (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        image: req.file.filename // Save filename of uploaded image
    });
    await post.save();
    res.redirect('/');
});

app.post('/delete/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            res.status(404).send('Post not found');
            return;
        }
        // Delete post image from file system
        fs.unlinkSync(path.join(__dirname, 'public', 'images', post.image));
        await Post.findByIdAndDelete(postId);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
