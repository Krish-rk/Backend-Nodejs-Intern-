const express = require("express");
require("dotenv").config();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("./cloudinary");
const upload = require("./multer");

const port = process.env.PORT || 3000;
console.log(process.env.CLOUDINARY_CLOUD_NAME);
const dbPath = path.join(__dirname, "post.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(port, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

//Get Posts API
app.get("/posts/", async (request, response) => {
  const {
    offset = 0,
    limit = 100,
    order = "ASC",
    order_by = "id",
    tag = "",
    keyword = "",
  } = request.query;
  console.log(keyword);
  const getPostsQuery = `
    SELECT
      *
    FROM
     posts
    WHERE
     title LIKE '%${keyword}%' OR description LIKE '%${keyword}%' OR
     tag like '%${tag}%'
    ORDER BY ${order_by} ${order}
    LIMIT ${limit} OFFSET ${offset};`;
  const postArray = await db.all(getPostsQuery);
  response.send(postArray);
});

app.post("/posts", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      // If no file is uploaded, handle accordingly
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path);
    const image_url = uploadResult.secure_url; // Use secure_url instead of just url
    console.log(image_url);
    // Extract the other fields from the request body
    const { title, description, tag } = req.body;

    // Insert into the database
    const createPostQuery = `
      INSERT INTO
        posts (title, description, tag, image_url)
      VALUES
        (
          '${title}',
          '${description}',
          '${tag}',
          '${image_url}'
        );
    `;
    await db.run(createPostQuery);

    // Return a success response
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        title,
        description,
        tag,
        image_url,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
});
