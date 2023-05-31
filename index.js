
// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const app = express();

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');


// Set up MongoDB Atlas connection
mongoose.connect('mongodb+srv://pratikup19:Walchand2020@cluster0.lbqrill.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.log(error));

// Define User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', userSchema);

const blogPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  comments: [
    {
      text: String,
      author: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});


const BlogPost = mongoose.model('BlogPost', blogPostSchema);
// Configure Passport.js
passport.use(new LocalStrategy(
    async function(username, password, done) {
      try {
        const user = await User.findOne({ username: username });
        if (!user || !user.comparePassword(password)) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
// Route: Home
app.get('/',async (req, res) => {
  const blogPosts = await BlogPost.find();

  res.render(__dirname + '/views/index', { blogPosts: blogPosts,currentUser: req.user });
});

// Route: Create a new blog post (form)
app.get('/new', ensureAuthenticated, (req, res) => {
  res.render(__dirname + '/views/create');
});

// Route: Create a new blog post (submit form)
// Route: Create a new blog post (submit form)
app.post('/new', ensureAuthenticated, (req, res) => {
  const { title, content } = req.body;
  const newPost = new BlogPost({
    title: title,
    content: content,
    author: req.user.username // Save the username of the authenticated user as the author
  });
  newPost.save()
    .then(() => res.redirect('/posts'))
    .catch((error) => console.log(error));
});


// Route: Display all blog posts
// Route: Display all blog posts
app.get('/posts', ensureAuthenticated, async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();

    res.render('posts', { blogPosts: blogPosts, currentUser: req.user.username });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

// Route: Edit a blog post (form)
app.get('/edit/:id', ensureAuthenticated, (req, res) => {
  const postId = req.params.id;
  BlogPost.findById(postId)
    .then((post) => res.render('edit.ejs', { post: post }))
    .catch((error) => console.log(error));
});

// Route: Edit a blog post (submit form)
app.post('/edit/:id', ensureAuthenticated, (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  BlogPost.findByIdAndUpdate(postId, { title: title, content: content })
    .then(() => res.redirect('/posts'))
    .catch((error) => console.log(error));
});

// Route: Delete a blog post
app.post('/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
      const blogPost = await BlogPost.findById(req.params.id);
      if (!blogPost) {
        res.status(404).send('Blog post not found');
      } else {
        // Check if the logged-in user is the author of the blog post
        if (blogPost.author !== req.username) {
          res.status(403).send('You are not authorized to delete this blog post');
        } else {
          await BlogPost.findByIdAndDelete(req.params.id);
          res.redirect('/posts');
        }
      }
    } catch (err) {
      res.status(500).send('Internal Server Error');
    }
  });
  
// Route: Display an individual blog post
app.get('/post/:id', ensureAuthenticated, async (req, res) => {
  try {
    const postId = req.params.id;
    const blogPost = await BlogPost.findById(postId);

    if (!blogPost) {
      res.status(404).send('Blog post not found');
    } else {
      res.render('post', { post: blogPost, currentUser: req.user });
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Route: Login (form)
app.get('/login', (req, res) => {
  res.render(__dirname + '/views/login');
});

// Route: Login (submit form)
app.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' })
);
// Route: Logout

app.get("/logout", (req, res) => {
  req.logout(req.user, err => {
    if(err) return next(err);
    res.redirect("/");
  });
});


app.post('/post/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const blogPost = await BlogPost.findById(postId);

    if (!blogPost) {
      res.status(404).send('Blog post not found');
    } else {
      // Check if the user has already liked the blog post
      const alreadyLiked = blogPost.likes.includes(userId);

      if (alreadyLiked) {
        // User has already liked the blog post, so unlike it
        blogPost.likes.pull(userId);
        blogPost.likeCount -= 1;
      } else {
        // User has not liked the blog post, so like it
        blogPost.likes.push(userId);
        blogPost.likeCount += 1;
      }

      await blogPost.save();
      res.redirect('/post/' + postId);
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Route: Add a comment to a blog post
app.post('/comment/:id', ensureAuthenticated, async (req, res) => {
  try {
    const postId = req.params.id;
    const { comment } = req.body;

    const blogPost = await BlogPost.findById(postId);

    if (!blogPost) {
      res.status(404).send('Blog post not found');
    } else {
      const newComment = {
        text: comment,
        author: req.user.username
      };

      blogPost.comments.push(newComment); // Add the new comment to the comments array
      await blogPost.save();
      res.redirect('/post/'+postId);
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});



// Route: Register (form)
app.get('/register', (req, res) => {
  res.render(__dirname + '/views/register');
});

// Route: Register (submit form)
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({
    username: username,
    password: hashedPassword
  });
  newUser.save()
    .then(() => res.redirect('/login'))
    .catch((error) => console.log(error));
});

// Middleware: Check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
