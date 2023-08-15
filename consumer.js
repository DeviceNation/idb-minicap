var net = require("net");

var MjpegConsumer = require("mjpeg-consumer");
var FileOnWrite = require("file-on-write");

var client = new net.Socket();
var i = 0;

var writer = new FileOnWrite({
	path: "./images",
	ext: ".jpg",
	filename: function (data) {
		i = i + 1;
		return `image_${i}`;
	},
});
var consumer = new MjpegConsumer();

client.connect(9100, "localhost", function () {
	console.log("Connected");
	client.write(JSON.stringify("hello"));
});

client.pipe(consumer).pipe(writer);

client.on("close", function () {
	console.log("Connection closed");
});
