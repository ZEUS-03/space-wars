const { Router } = require("express");
const userRouter = require("./user");
const adminRouter = require("./admin");
const spaceRouter = require("./space");

const router = Router();

router.get("/elements", (req, res) => {
  res.json({
    message: "get all available elements.",
  });
});

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/space", spaceRouter);

module.exports = router;
