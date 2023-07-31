const http = require("http");
const path = require("path");
const { exec, spawn } = require("child_process");

const express = require("express");
const WebSocketServer = require("ws").Server;
const debug = require("debug")("example");
const { Parser } = require("minicap");

const app = express();
const PORT = process.env.PORT || 9002;

app.use(express.static(path.join(__dirname, "/public")));
let frameCount = 0;
let startTime = 0;

const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });

function checkForDeviceMinicap(ws) {
	const udid = "SET_UDID";

	this.proc = spawn("idb", [
		"video-stream",
		"--udid",
		udid,
		"--fps", //Seems doesnt work
		"60",
		"--format",
		"minicap",
		"--compression-quality",
		"1.0",
	]);

	this.proc.stderr.on("data", (stderr) => {
		//console.error('ERR: ' + stderr);
	});

	this.proc.on("exit", (code, signal) => {
		if (code) console.warn("Process exited by itself with status code : " + code);
		else console.warn("Process exited with signal  : " + signal);
	});

	this.proc.on("error", (err) => {
		console.error("Process error: " + err);
	});

	this.proc.on("close", (code) => {
		console.log("Status code: " + code);
		if (code == 1) console.error(`Minicap startup error: Device (${udid})  is not found`);
		else reject("Minicap startup error. Status: " + code);
	});

	const onBannerAvailable = (banner) => {
		console.log("Banner is available: " + JSON.stringify(banner));
		this.banner = banner;
	};

	const onFrameAvailable = (frame) => {
		if (frameCount == 0) startTime = Date.now();
		ws.send(frame.buffer, {
			binary: true,
		});
	};

	const parser = new Parser({
		onBannerAvailable,
		onFrameAvailable,
	});

	const tryParse = () => {
		for (let chunk; (chunk = this.proc.stdout.read()); ) {
			parser.parse(chunk);
		}
	};
	this.proc.stdout.on("readable", tryParse);
	tryParse();
}

wss.on("connection", async (ws) => {
	console.info("Got a client");
	checkForDeviceMinicap(ws);
	ws.on("close", () => {
		console.info("Lost a client");
	});
});

server.listen(PORT);
console.info(`Listening on port ${PORT}`);
