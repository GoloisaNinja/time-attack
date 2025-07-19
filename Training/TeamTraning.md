# Server Timing Attacks

Server timing attacks are not as common as they once were, but timing attacks, in general, can still be used in various ways to exploit servers, services, applications, and user machines. ASUS recently, and not surprisingly, found themselves in a swirl of controversy around their ArmoryCrate and DriverHub tools for being vulnerable, to among other things, timing attacks. Gamers Nexus has a nice little video and breakdown here:

[Gamers Nexus: The dumpster fire that is ASUS](https://www.reddit.com/r/pcmasterrace/comments/1m3lxnp/the_asus_dumpster_fire_credit_gamers_nexus/)

And here's the CVE:

[Asus Driver Hub Flaws](https://socradar.io/cve-2025-3462-cve-2025-3463-asus-driverhub-flaws)

# The basics of timing attacks

Timing attacks refer to a broad range of exploits across various systems, tools, applications, and environments where an attacker will use things like request and packet transfer timing to expose valuable information or critically sensitive systems data. Timing attacks are often coupled with other exploits and hacks as part of larger penetration attacks or malicious systems spoofs.

## The Project Demo

The scope of this topic will escape my abilities quickly and will certainly extend beyond the confines of the 5 minute presentation I intend to share here. Suffice to say that I'm speed-running this for simplicity sake and not taking certain very important factors into account. Factors such as normalizing for live internet network variability and certainly the use of very large scale high confidence mathematical tools to ensure the response timing of my demo make sense. But hey - I won't tell Data Science if you don't.

I'll be building a dead simple NodeJS server with a single API endpoint called POSTS on my localhost. This api has one job. To evaluate the incoming request body and determine if the search string the user submitted matches the post the server has on file. That's literally it.

## Let's look at the code

We start the entry point for the project which is our server.js file.

```js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

// create server

const app = express();
// init middleware
app.use(express.json());

app.get('/api/posts', (req, res) => {
	let reqpost = req.body.post;
	let serverpost =
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXAAABBBCCC';
	if (reqpost === serverpost) {
		res.status(200).json({ message: 'found post' });
	} else {
		res.status(404).json({ message: 'did not find post' });
	}
});
const PORT = process.env.PORT || 5000;
// listen for server
app.listen(PORT, () => console.log(`Server is up on ${PORT}`));
```

As you can see our server api endpoint has post title that is absolute gibberish, but no one comes to. our blog for anything of value, so it's totally fine. We'll be checking the incoming response to see if the user search matches our post title. Just dead simple JS === eval string to string.

The CURL's are as follows:
request1

```bash
#!/bin/bash
curl -H  "Content-Type: application/json"  -d  '{"post": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXAAABBBCCC"}'  -o  /dev/null  -s  -w  "@curl-timing.txt"  -X  GET  http://localhost:5000/api/posts
```

request2

```bash
#!/bin/bash
curl -H  "Content-Type: application/json"  -d  '{"post": "A"}'  -o  /dev/null  -s  -w  "@curl-timing.txt"  -X  GET  http://localhost:5000/api/posts
```

request3

```bash
#!/bin/bash

curl -H  "Content-Type: application/json"  -d  '{"post": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXAAABBBCCC"}'  -o  /dev/null  -s  -w  "@curl-timing.txt"  -X  GET  http://localhost:5000/api/posts
```

And right from the jump you might be able to see where this is going based on the post search text. I'm using a txt file for the outputs, so here's that quick format file for funsies.

curl-timing.txt

```bash
url_effective: %{url_effective}\n
http_code: %{http_code}\n
content_type: %{content_type}\n
time_namelookup: %{time_namelookup}s\n
time_connect: %{time_connect}s\n
time_appconnect: %{time_appconnect}s\n
time_pretransfer: %{time_pretransfer}s\n
time_redirect: %{time_redirect}s\n
time_starttransfer: %{time_starttransfer}s\n
==========================================\n
time_total: %{time_total}s\n
==========================================\n
```

## Expectations

As you might have noticed my request strings are set up in such a way to try and illustrate the idea around time attacks. It's inevitable that our target is likely performing some equality operations. This could be on passwords, software hashes, certificate numbers, etc., and many languages rely on a character by character approach to evaluate this - thusly, we can probably predict where this test is going. Based on my server post title, I'd expect request2 to fail immediately and send back the fastest response. Request1 should take longer than request2, and finally, request3 should ostensibly take longer than request1. Let's run the script files from terminal and see how the output looks.

```bash
golo@MacBook-Pro time-api % ./request2.sh
url_effective: http://localhost:5000/api/posts
http_code: 404
content_type: application/json; charset=utf-8
time_namelookup: 0.000018s
time_connect: 0.000226s
time_appconnect: 0.000000s
time_pretransfer: 0.000264s
time_redirect: 0.000000s
time_starttransfer: 0.001285s
==========================================
time_total: 0.001340s
==========================================
golo@MacBook-Pro time-api % ./request1.sh
url_effective: http://localhost:5000/api/posts
http_code: 404
content_type: application/json; charset=utf-8
time_namelookup: 0.000018s
time_connect: 0.000223s
time_appconnect: 0.000000s
time_pretransfer: 0.000259s
time_redirect: 0.000000s
time_starttransfer: 0.001376s
==========================================
time_total: 0.001434s
==========================================
golo@MacBook-Pro time-api % ./request3.sh
url_effective: http://localhost:5000/api/posts
http_code: 200
content_type: application/json; charset=utf-8
time_namelookup: 0.000015s
time_connect: 0.000202s
time_appconnect: 0.000000s
time_pretransfer: 0.000238s
time_redirect: 0.000000s
time_starttransfer: 0.016089s
==========================================
time_total: 0.016180s
==========================================
```

Now, remember when I said this should be way more complicated - it totally is. To really trust these results we'd want to generate them over a massive number of requests and use high confidence models to really competently make any realistic determinations here. The namelookups, pretransfers, and timeconnects all need to be heavily normalized across each request, and other factors like site traffic need to be understood as well, but hopefully for the purposes of this little demo, you get the idea. Request2 fails outright as the first character of the request string is not equal to the first character of the server's post string. Meanwhile, request1 matches all the way to roughly the middle of the server post string before hitting teh errant **"M"**, failing and getting the 404 response. Lastly, of course, our request3 is an actual match and responds with 200 while also taking the longest to evaluate.

## So what?

![Mike Myers playing Austin Powers asking what does it all mean while looking nonplussed](https://miro.medium.com/v2/resize:fit:490/1*3yhFROgELGeWA0yiWTFe6w.jpeg)

Why does this matter? Imagine our nefarious little user isn't just trying to suss out our server's post title. Imagine they are trying to guess something like a password or an important hash value on your server. A timing attack like this could expose valuable data and give attackers way more information than they ever should have had.

# Wrap Up - what can we do?

There are LOTS of suggested and industry approved ways to deal with time attacks and time attackers. For one - as I mentioned, these attacks tend to rely on large datasets of request attempts to confidently garner valuable information. A simple approach is to just use request limits on your applications. These need to be implemented wisely on large applications that receive millions of requests in order to not cause friction to users that are simply trying to access your app, but done correctly, you can identify time attacks and limit their ability to keep large scale hitting your endpoints or services. For the purposes of this demo, lets look at another dead simple solution. Request normalization is another way to mitigate time attacks. For example, there are a host of pre-built cybersecurity tools that will effectively act as middleware between incoming request and anything your server or service responds with. These tools often employ various encryption and stable time techniques to normalize your application responses across your entire application or service regardless of what is being requested. For our purposes, lets just modify our server in a very basic way.

## Good 'ol Middleware

Probably one of the best ways to mitigate time attacks is trying to ensure that time becomes a harder vector for your attacker to use against you. This is often through using middleware tools. On one hand you have middleware that can essentially encrypt the incoming traffic requests and use very stable cryptographic comparison algorithms that will effectively nullify the evaluation/calculation time of your backend processes.

> If time is a hammer, turn that hammer into a rubber chicken. - Jon Collins

Let's just take a quick look at non-cryptographic middleware possibility here. And bear in mind that NodeJS brings it's own baggage to the party here as not the best server environment for implementing time-based solutions. But nonetheless - lets build some middleware!

```js
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
```

Our server is largely the same, however we now have every incoming request nabbed by our middleware which runs the equality check and then waits for a predetermined amount of time before invoking next. Whatever result was written to request object determines how we respond just like before. But over large request sets we should expect see harder to interpret results.

```bash
golo@MacBook-Pro time-api % ./request2.sh
url_effective: http://localhost:5000/api/posts
http_code: 404
content_type: application/json; charset=utf-8
time_namelookup: 0.000016s
time_connect: 0.000232s
time_appconnect: 0.000000s
time_pretransfer: 0.000275s
time_redirect: 0.000000s
time_starttransfer: 0.263856s
==========================================
time_total: 0.263992s
==========================================
golo@MacBook-Pro time-api % ./request1.sh
url_effective: http://localhost:5000/api/posts
http_code: 404
content_type: application/json; charset=utf-8
time_namelookup: 0.000014s
time_connect: 0.000211s
time_appconnect: 0.000000s
time_pretransfer: 0.000248s
time_redirect: 0.000000s
time_starttransfer: 0.263507s
==========================================
time_total: 0.263621s
==========================================
golo@MacBook-Pro time-api % ./request3.sh
url_effective: http://localhost:5000/api/posts
http_code: 200
content_type: application/json; charset=utf-8
time_namelookup: 0.000017s
time_connect: 0.000220s
time_appconnect: 0.000000s
time_pretransfer: 0.000257s
time_redirect: 0.000000s
time_starttransfer: 0.263311s
==========================================
time_total: 0.263414s
==========================================
```

This isn't perfect. Far from it, but it should at least illustrate in a basic way that our server responses are slightly harder to interpret on their face with minimal work on the backend to accomplish that. By just introducing a delay mechanic we can try and throw off any attacker that might be looking to get meaningful data from our response times. Generally speaking, using cryptographic libraries that introduce fixed time computation across all your routes is necessary. Additionally, avoid (don't do what I did here) in using data dependent branching - using IF statements or SWITCH conditions as these will introduce weaknesses that are easy to exploit. Masking or padding techniques are also ways to mitigate calculation related vulnerabilities by obscuring and normalizing the data regardless of what the incoming request was.

# Would you like to know more?

![Rico wants to know more!](https://www.violentlittle.com/cdn/shop/products/VIOLENTLITTLE_3_1024x1024.png?v=1589245320)

### Linkies

[What is a Timing Attack](https://www.twingate.com/blog/glossary/timing%20attack)
[Understanding Timing Attacks in Cryptography](https://www.numberanalytics.com/blog/ultimate-guide-to-timing-attack-in-cryptography)
[Timing Attack Prevention Techniques](https://www.numberanalytics.com/blog/timing-attack-prevention-techniques)
[How Can I Prevent Side Channel Attacks Against Authentication](https://security.stackexchange.com/questions/220446/how-can-i-prevent-side-channel-attacks-against-authentication)
