const express = require("express");
const router = require("../http/routes/v1/index");

const app = express();

app.use("/api/v1", router);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening to port ${process.env.PORT || 3000}`);
});
