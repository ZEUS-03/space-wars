const { Router } = require("express");
const userRouter = Router();

userRouter.post("/signup", (req, res) => {
  res.json({
    message: "Signup",
  });
});

userRouter.post("/signin", (req, res) => {
  res.json({
    message: "Signin",
  });
});

userRouter.post("/metadata", (req, res) => {
  res.json({
    message: "updated metadata",
  });
});

userRouter.get("/avatars", (req, res) => {
  res.json({
    message: "all avatars.",
  });
});

userRouter.get("/metadata/bulk", (req, res) => {
  res.json({
    message: "bulk users.",
  });
});
module.exports = userRouter;
