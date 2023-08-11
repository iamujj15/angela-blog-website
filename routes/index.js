import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import passport from "passport";
import eA from "../config/auth.js";
import { Post } from "../models/User.js";
import mongoose from "mongoose";
import session from "express-session";

const router = express.Router();
const saltRounds = 15;

const homeStartingContent =
    "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
    "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
    "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

router.get("/", function (req, res) {
    res.render("home");
});

router.get("/login", async function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/profile");
    } else {
        res.render("login");
    }
});

router.post("/login", function (req, res, next) {
    passport.authenticate("local", {
        successRedirect: "/profile",
        failureRedirect: "/login",
        failureFlash: true,
    })(req, res, next);
});

router.get("/signup", function (req, res) {
    res.render("signup");
});

router.post("/signup", function (req, res) {
    const { name, username, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if (!username || !password || !password2) {
        errors.push({ msg: "Please fill in all fields" });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: "Passwords do not match" });
    }

    // Check password length
    if (password.length < 8) {
        errors.push({ msg: "Password should be at least 8 characters" });
    }

    if (errors.length > 0) {
        res.render("signup", {
            errors: errors,
            username: username,
            password: password,
            password2: password2,
        });
    } else {
        (async function () {
            try {
                const foundUser = await User.findOne({ username: username });
                if (foundUser) {
                    // User exists
                    errors.push({ msg: "Username is already registered." });
                    res.render("signup", {
                        errors: errors,
                        username: username,
                    });
                } else {
                    const hash = await bcrypt.hash(password, saltRounds);
                    const newUser = new User({
                        name: name,
                        username: username,
                        password: hash,
                    });
                    await newUser.save();
                    req.flash(
                        "success_msg",
                        "You are now registered. Please log in."
                    );
                    res.redirect("/login");
                }
            } catch (err) {
                console.error(err.message);
                res.redirect("/signup");
            }
        })();
    }
});

// router.get("/logout", function (req, res) {
//     // req.session.destroy();
//     req.logout(function (err) {
//         if (err) {
//             return next(err);
//         }

//         req.flash("success_msg", "You are sucessfully logged out");
//         res.redirect("/login");
//     });
// });

router.get("/logout", async function (req, res, next) {
    try {
        req.session.destroy();
        res.clearCookie("connect.sid");
        // req.flash("success_msg", "You are sucessfully logged out");
        res.redirect("/login");
    } catch (err) {
        next(err);
    }
});

router.get("/profile", eA.isAuthentic, async function (req, res) {
    const postsArray = req.user.posts;
    const posts = await Post.aggregate([
        { $match: { "_id": { "$in": postsArray } } },
    ]);

    res.render("profile", {
        name: req.user.name,
        username: req.user.username,
        posts: posts
    });
});

router.get("/about", function (req, res) {
    res.render("about", { aboutContent: aboutContent });
});

router.get("/contact", function (req, res) {
    res.render("contact", { contactContent: contactContent });
});

router.get("/compose", eA.isAuthentic, function (req, res) {
    res.render("compose");
});

router.post("/compose", eA.isAuthentic, function (req, res) {
    const sm = req.body;
    const postData = new Post({
        title: sm.postTitle,
        body: sm.postBody,
    });
    postData.save();

    req.user.posts.unshift(postData._id);
    req.user.save();

    res.redirect(`/${postData._id.toString()}`);
});

router.post("/delete", eA.isAuthentic, async function (req, res) {
    const pId = req.body.postId;
    const index = req.user.posts.indexOf(pId);
    if (index > -1) {
        await Post.findByIdAndDelete(pId);
        req.user.posts.pull(pId);
        req.user.save();
        res.redirect("/profile");
    }
});

router.get("/:part", eA.isAuthentic, async function (req, res) {
    const partData = String(req.params.part);
    try {
        const post = await Post.findById(partData);
        res.render("post", {
            post: post,
        });
    } catch (err) {
        console.log(err);
    }
});

export default router;
