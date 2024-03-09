const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb+srv://kalpraj51:FEkXXxZu0SeNXWiq@cluster0.dly4bej.mongodb.net/Blog?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.log("Error in Connecting to Database:", error));


let loggedInUserEmail = "";


const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const blogSchema = new mongoose.Schema({
    userEmail: String,
    title: String,
    description: String,
    information: String
});

// Create Mongoose models
const User = mongoose.model('User', userSchema);
const Blog = mongoose.model('Blog', blogSchema);

// User signup endpoint
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); 
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.redirect('/login.html'); 
    } catch (err) {
        res.status(400).send(`Error signing up user: ${err.message}`);
    }
});

app.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).send('User not found');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          return res.status(401).send('Invalid password');
      }

      loggedInUserEmail = email; 
      
      res.redirect('/blog'); 
  } catch (err) {
      res.status(500).send(`Error logging in: ${err.message}`);
  }
});


// Create a new blog
app.post('/createblog', async (req, res) => {
    try {
        const { title, description, information } = req.body;
        console.log('Received blog data:', { title, description, information });

        const newBlog = new Blog({ userEmail: loggedInUserEmail, title, description, information });
        await newBlog.save();
        console.log('Blog saved successfully:', newBlog);
        res.redirect('/blog'); 
    } catch (err) {
        console.error('Error creating blog:', err);
        res.status(500).send(`Error creating blog: ${err.message}`);
    }
});

// Display user's blogs
app.get('/my-blogs', async (req, res) => {
    try {
        const userBlogs = await Blog.find({ userEmail: loggedInUserEmail });
        res.render('myblogs', { userBlogs }); 
    } catch (err) {
        res.status(500).send(`Error fetching user blogs: ${err.message}`);
    }
});

app.get('/blogs', async (req, res) => {
    try {
        const allBlogs = await Blog.find();
        res.render('allblogs', { allBlogs }); 
    } catch (err) {
        res.status(500).send(`Error fetching user blogs: ${err.message}`);
    }
});

app.get('/edit-blog/:email', async (req, res) => {
    try {
      const blogemail = req.params.email;
      const blog = await Blog.findById(blogemail);
  
      if (!blog) {
        return res.status(404).send('Blog not found');
      }
  
      // Render an edit form with the fetched blog data
      res.render('edit-blog', { blog });
    } catch (err) {
      res.status(500).send(`Error editing blog: ${err.message}`);
    }
  });
  
  // Route to update a blog
  app.post('/update-blog/:email', async (req, res) => {
    try {
      const blogemail = req.params.email;
      const { title, description, information } = req.body;
  
      const updatedBlog = await Blog.findByIdAndUpdate(blogemail, { title, description, information }, { new: true });
  
      if (!updatedBlog) {
        return res.status(404).send('Blog not found');
      }
  
      res.redirect('/my-blogs');
    } catch (err) {
      res.status(500).send(`Error updating blog: ${err.message}`);
    }
  });
  
  // Route to delete a blog
  app.post('/delete-blog/:email', async (req, res) => {
    try {
      const blogemail = req.params.email;
  
      const deletedBlog = await Blog.findByIdAndDelete(blogemail);
  
      if (!deletedBlog) {
        return res.status(404).send('Blog not found');
      }
  
      res.redirect('/my-blogs');
    } catch (err) {
      res.status(500).send(`Error deleting blog: ${err.message}`);
    }
  });

// Logout
app.post('/logout', async (req, res) => {
    loggedInUserEmail = ""; 
    res.redirect('/login.html'); 
});



app.get("/", (req, res) => {
    res.redirect('/index.html');
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
