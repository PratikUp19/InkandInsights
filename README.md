# InkandInsights

This is a blog website built using Node.js, Express.js, MongoDB, and Passport.js. It allows users to create an account, log in, create blog posts, like posts, add comments, and perform other basic blog functionalities.

Features
User Registration: Users can create an account by providing a unique username and password. The passwords are securely hashed using bcrypt before storing them in the database.

User Authentication: Registered users can log in to their accounts using their username and password. Passport.js is used for handling authentication and session management.

Create Blog Posts: Authenticated users can create new blog posts by providing a title and content for their posts. The author's username is automatically assigned to the post.

View Blog Posts: Users can view all the blog posts available on the website. Each post displays the title, truncated content, author's username, like count, and a "Read Full Blog" button.

Like and Unlike Blog Posts: Logged-in users can like or unlike blog posts. The like count for each post is displayed, and users can toggle their like status by clicking the like button.

Add Comments: Authenticated users can add comments to blog posts. The comments are associated with the respective blog post and display the comment text, author's username, and the timestamp of when the comment was added.

Edit and Delete Blog Posts: The author of a blog post has the ability to edit and delete their own posts. Edit and delete buttons are displayed only for the posts created by the logged-in user.

Installation
Clone the repository to your local machine.
Navigate to the project directory.
Install the required dependencies by running the command npm install.
Set up a MongoDB Atlas account and obtain your connection string.
Replace the placeholder connection string in index.js with your MongoDB Atlas connection string.
Start the server by running the command node index.js.
Open your web browser and visit http://localhost:3000 to access the blog website.
Dependencies
The main dependencies used in this project are:

Express.js: Web application framework for Node.js.
MongoDB: NoSQL database for storing user information, blog posts, and comments.
Mongoose: MongoDB object modeling for Node.js.
Passport.js: Authentication middleware for Node.js.
Bcrypt: Password hashing library for encrypting user passwords.
