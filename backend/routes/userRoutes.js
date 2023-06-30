const express = require("express");
const {
  allUser,
  singleUser,
  editUser,
  deleteUser,
  createUserJobsHistory,
  ShowAllUser,
} = require("../controllers/userController");
const { isAuthenticated, isAdmin, isMainAdmin } = require("../middleware/auth");
const router = express.Router();

//user router

//  /api/allusers
router.get("/allusers", isAuthenticated, isMainAdmin, allUser);
//  /api/showallusers
router.get("/showallusers", isAuthenticated, isMainAdmin, ShowAllUser);
//  /api/user/id
router.get("/user/:id", isAuthenticated, singleUser);

//  /api/user/edit/id
router.patch("/user/edit/:id", isAuthenticated, editUser);

//  /api/admin/user/delete/id
router.delete(
  "/admin/user/delete/:id",
  isAuthenticated,
  isMainAdmin,
  deleteUser
);

//  /api/user/jobhistory
router.post("/user/jobhistory/", isAuthenticated, createUserJobsHistory);

module.exports = router;
