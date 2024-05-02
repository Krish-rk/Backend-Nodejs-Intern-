const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dmlpsfehn",
  api_key: "655475633799166",
  api_secret: "j3SF7oFJA1JL60nqs0N7eD_9-mA",
});

module.exports = cloudinary;
