import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

// create delay const
const MIN_DELAY_MS = 262;
// create server
const app = express();
// delay func
function HOOOOLLLLLDDDDDD(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve('done');
		}, ms - 50);
	});
}
// init middleware
app.use(express.json());
// shiny delay middleware
app.use(async (req, res, next) => {
	const start = Date.now(); // start time of request
	const serverPost =
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXAAABBBCCC';
	const reqpost = req.body.post;
	if (reqpost == serverPost) {
		req.ValidMatch = true;
	} else {
		req.ValidMatch = false;
	}
	let elapsed = Date.now() - start;
	let remainingDelay = MIN_DELAY_MS - elapsed;
	while (remainingDelay > 0) {
		await HOOOOLLLLLDDDDDD(remainingDelay);
		elapsed = Date.now() - start;
		remainingDelay = MIN_DELAY_MS - elapsed;
	}
	// now we've invoked King Leonidas....
	next();
});

app.get('/api/posts', async (req, res) => {
	if (req.ValidMatch) {
		res.status(200).json({ message: 'found post' });
	} else {
		res.status(404).json({ message: 'did not find post' });
	}
});

const PORT = process.env.PORT || 5000;

// listen for server
app.listen(PORT, () => console.log(`Server is up on ${PORT}`));
