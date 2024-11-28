const { Router } = require("express");
const adminRouter = Router();

adminRouter.post("/element", (req, res) => {
  res.json({
    message: "Element created.",
  });
});

adminRouter.put("/element/:elementId", (req, res) => {
  res.json({
    message: "Element updated.",
  });
});

adminRouter.post("/avatar", (req, res) => {
  res.json({
    message: "avatar created.",
  });
});

adminRouter.post("/map", (req, res) => {
  res.json({
    message: "map created.",
  });
});

module.exports = adminRouter;
