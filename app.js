import express from "express";
import ejs from "ejs";
import _ from "lodash";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import flash from "connect-flash";
import session from "express-session";
import passport from "passport";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import eA from "./config/auth.js";
import indexRouter from "./routes/index.js";
import passportConfig from "./config/passport.js";
import MongoStore from "connect-mongo";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saltRounds = 15;

// Passport Config
passportConfig(passport);

app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	"/css",
	express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);
app.use(
	"/js",
	express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
app.use(
	"/js",
	express.static(path.join(__dirname, "node_modules/jquery/dist"))
);
dotenv.config();

app.locals._ = _;

app.set("view engine", "ejs");

const dbConnect = async function () {
	try {
		await mongoose.connect(`${process.env.MONGODB_CONNECT}`, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Connected to DB");
	} catch (err) {
		console.error(err.message);
	}
};

dbConnect();

// MongoStore Middleware
// const MongoStore = MongoStore(session);

// Express Session
app.use(
	session({
		name: process.env.SESS_NAME,
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: `${process.env.MONGODB_CONNECT}`,
			collectionName: "sessions",
			ttl: parseInt(process.env.SESS_LIFETIME) / 1000,
			autoRemove: "native",
			// autoRemoveInterval: 1,
		}),
		cookie: {
			sameSite: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: parseInt(process.env.SESS_LIFETIME)
		},
	})
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Global Variables
app.use(function (req, res, next) {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	next();
});

// Routes
app.use("/", indexRouter);

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}

app.listen(port, function () {
	console.log("Server has started in port 3000 successfully");
});
