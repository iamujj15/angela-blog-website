import express from "express";
import ejs from "ejs";
import _ from "lodash";
import mongoose from "mongoose";
import dotenv from "dotenv";

const homeStartingContent =
	"Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
	"Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
	"Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

app.locals._ = _;

app.set("view engine", "ejs");

app.use(express.static("public"));

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

const postSchema = {
	title: String,
	body: String,
};

const Post = mongoose.model("Post", postSchema);

const postTest = new Post({
	title: "Test",
	body: "Post to test connectivity with MongoDB.",
});

async function getPosts() {
	const posts = await Post.find({});
	return posts;
}

app.get("/", function (req, res) {
	getPosts()
		.then((posts) => {
			if (posts.length === 0) {
				Post.insertMany([postTest]);
				res.redirect("/");
			} else {
				res.render("home", {
					homeStartingContent: homeStartingContent,
					posts: posts,
				});
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get("/about", function (req, res) {
	res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
	res.render("contact", { contactContent: contactContent });
});

app.get("/compose", function (req, res) {
	res.render("compose");
});

app.post("/compose", function (req, res) {
	const sm = req.body;
	const postData = new Post({
		title: sm.postTitle,
		body: sm.postBody,
	});
	postData.save();
	res.redirect(`/posts/${sm.postTitle}`);
});

app.post("/delete", async function (req, res) {
	const pId = req.body.postId;
	await Post.findByIdAndDelete(pId);
	res.redirect("/");
});

app.get("/posts/:part", function (req, res) {
	const partData = _.lowerCase(req.params.part);
	getPosts().then((posts) => {
		for (let i = 0; i < posts.length; i++) {
			const storedTitle = _.lowerCase(posts[i].title);
			if (storedTitle === partData) {
				res.render("post", {
					post: posts[i],
				});
			}
		}
	});
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}

app.listen(port, function () {
	console.log("Server has started in port 3000 successfully");
});
