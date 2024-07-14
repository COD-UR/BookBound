import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import pkg from 'pg';
const { Pool } = pg;


const app = express();
const port = 3000;
const loginId = "bookbound@urvashi.corp711";
const pass = "76ggydf86";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


dotenv.config();



/* const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookbound",
  password: "Palindrome@711",
  port: "5432"
}); */


const DBConfigLink = `postgresql://bookbound_6183_user:em8ps9vFqCtPa3pht8fzPxGMmZf5yjLq@dpg-cq7hkk6ehbks738vnoj0-a.singapore-postgres.render.com/bookbound_6183`;


const db = new Pool({
    connectionString: process.env.DBConfigLink,
    ssl: {
        rejectUnauthorized: false
    }
});

export default db;



db.connect();

let book = [];
let comments = [];

app.get("/", async (req, res) => {
  try {
    const sortOption = req.query.sortlist; // default sorting option
    let query = "SELECT * FROM books";
    
    switch (sortOption) {
      case 'alphabetically':
        query += " ORDER BY title ASC";
        break;
      case 'ratingHighToLow':
        query += " ORDER BY rating DESC";
        break;
      case 'ratingLowToHigh':
        query += " ORDER BY rating ASC";
        break;

      case 'romance':
        query += " WHERE genre = 'Romance'";
        break;
      case 'life':
        query += " WHERE genre = 'Life'";
        break;
      case 'mystery':
        query += " WHERE genre = 'Mystery'";
        break;
      case 'thriller':
        query += " WHERE genre = 'Thriller'";
        break;
      case 'sci-fi':
        query += " WHERE genre = 'Sci-fi'";
        break;
      case 'kids':
        query += " WHERE genre = 'Kids'";
        break;
      case 'adventure':
        query += " WHERE genre = 'Adventure'";
        break;
      case 'lastAdded':
      default:
        query += " ORDER BY date DESC";
    }

    const response = await db.query(query);
    book = response.rows;
    
    res.render("home.ejs", {
      books: book,
      sortOption: sortOption,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/review/:id", async (req, res) => {
  try {
    const book_id = req.params.id;
    const bookResponse = await db.query("SELECT * FROM books WHERE id = $1", [book_id]);
    book = bookResponse.rows[0];

    const response = await db.query("SELECT * FROM users WHERE userid = $1", [book_id]);
    comments = response.rows;

    res.render("review.ejs", {
      books: book,
      userdata: comments,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/comment", async (req, res) => {
  try {
    const usrnm = req.body.username;
    const cmnt = req.body.usercomment;
    const book_id = parseInt(req.body.bookid); //isko form mein hidden input ke saath pass karna zaroori hai.

    await db.query("INSERT INTO users(username, usercomment, userid) VALUES($1, $2, $3)", [usrnm, cmnt, book_id]);
    res.redirect(`/review/${book_id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/aboutus", (req, res) => {
    res.render("aboutus.ejs");
});


app.get("/adminlogin", (req, res) => {
    res.render("login.ejs");
});

app.get("/bookmark", (req, res) =>{
  res.render("bookmark.ejs");
});

app.post("/bookmark", (req, res) =>{
  res.render("bookmark.ejs");
});

app.post('/modify', (req, res) => {
  
  if (req.body.loginid === loginId && req.body.password === pass) {
      res.render('modify.ejs');
  } else {
      res.send('Invalid login credentials');
  }
});

app.post("/add", async(req, res) =>{
const title = req.body.book_title;
const author = req.body.book_author;
const genre = req.body.book_genre;
const rating = req.body.book_rating;
const review = req.body.book_review;
const date =req.body.book_date;
const coverId = req.body.book_coverid;
const bookURL = req.body.book_url;
  try{
    await db.query('INSERT INTO books(title, author, genre, rating, review, date, cover_id, url) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', 
      [title, author, genre, rating, review, date, coverId, bookURL]);
      res.redirect("/");
  } catch(err){
    console.log(err);
  }
});

app.post("/update", async(req, res) =>{

const newtitle = req.body.book_title;
const newauthor = req.body.book_author;
const newgenre = req.body.book_genre;
const newrating = req.body.book_rating;
const newreview = req.body.book_review;
const coverId = req.body.book_coverid;
const newURL = req.body.book_url;
const newdate = req.body.book_date;


  try {

    const existingdata = await db.query("SELECT * FROM books WHERE cover_id = $1", [coverId]);

    if (existingdata.rows.length === 0) {
      return res.status(404).send("Book not found");
    }

    const book = existingdata.rows[0];

    const title = newtitle || book.title;
    const author = newauthor || book.author;
    const genre = newgenre || book.genre;
    const rating = newrating || book.rating;
    const review = newreview || book.review;
    const bookURL = newURL || book.url;
    const date = newdate || book.date;
    
    await db.query(
      "UPDATE books SET title = $1, author = $2, genre = $3, rating = $4, review = $5, url = $6, date =$7 WHERE cover_id = $8",
      [title, author, genre, rating, review, bookURL, date, coverId]);
      res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).send("Error updating book");
  }
});


app.post("/delete", async(req, res) =>{
  try{
    const coverId = req.body.book_coverid;
    await db.query("DELETE FROM books WHERE cover_id = $1", [coverId]);
    res.redirect("/");
  } catch(err){
    console.log("Error Deleting book!", err);
    res.status(500).send("Error deleting book");
  }
});


 app.post("/home", (req, res) =>{
    res.redirect("/");
 });




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
