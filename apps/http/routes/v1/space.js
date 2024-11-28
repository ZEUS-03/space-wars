const { Router } = require("express");
const spaceRouter = Router();

spaceRouter.post("/", (req, res) => {
  res.json({
    message: "created space.",
  });
});

spaceRouter.delete("/:spaceId", (req, res) => {
  res.json({
    message: "delete space.",
  });
});

spaceRouter.get("/all", (req, res) => {
  res.json({
    message: "get all spaces.",
  });
});

spaceRouter.get("/:spaceId", (req, res) => {
  res.json({
    message: "get a particular space.",
  });
});

spaceRouter.post("/element", (req, res) => {
  res.json({
    message: "add an element to the space.",
  });
});

spaceRouter.delete("/element", (req, res) => {
  res.json({
    message: "Delete element in the space.",
  });
});

module.exports = spaceRouter;
