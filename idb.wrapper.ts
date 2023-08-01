import which from "which";
import { spawn, exec } from "child_process";
const { Parser } = require("minicap");
import { WebSocket } from "ws";

const IDB_EXEC = "idb";
const IDB_COMPANION_EXEC = "idb_companion";

export const connect = async (udid: string): Promise<boolean> => {
	try {
		await which(IDB_EXEC);
	} catch (error) {
		console.error(error);
		return new Promise((r) => r(false));
	}
	const cmd = `${IDB_EXEC} connect ${udid}`;
	return new Promise((resolve, reject) => {
		exec(cmd, (error: any, stdout: any, stderr: any) => {
			if (error) return reject(error);
			if (stderr) return reject(stderr);
			resolve(stdout);
		});
	});
};

export const disconnect = async (udid: string): Promise<boolean> => {
	try {
		await which(IDB_EXEC);
	} catch (error) {
		console.error(error);
		return new Promise((r) => r(false));
	}
	const cmd = `${IDB_EXEC} disconnect ${udid}`;
	return new Promise((resolve, reject) => {
		exec(cmd, (error: any, stdout: any, stderr: any) => {
			if (error) return reject(error);
			if (stderr) return reject(stderr);
			resolve(stdout);
		});
	});
};

export const startStream = async (udid: string, ws: WebSocket) => {
	const args = ["video-stream", "--fps", "24", "--format", "minicap", "--compression-quality", "0.05", "--scale-factor", "0.0001", "--udid", udid];
	const proc = spawn(IDB_EXEC, args);

	const onBannerAvailable = (banner: any) => {
		console.log("Banner is available: " + JSON.stringify(banner));
	};

	const onFrameAvailable = (frame: any) => {
		ws.send(frame.buffer, { binary: true });
	};

	const parser = new Parser({ onBannerAvailable, onFrameAvailable });

	const tryParse = () => {
		for (let chunk; (chunk = proc.stdout.read()); ) {
			parser.parse(chunk);
		}
	};

	proc.stdout.on("readable", tryParse);

	const exitCode = await new Promise((resolve, reject) => {
		proc.on("close", resolve);
	});

	if (exitCode) {
		throw new Error(`subprocess error exit ${exitCode}`);
	}
};

export const idbStreamVideo = (udid: string, ws: WebSocket) => {
	const args = ["video-stream", "--fps", "15", "--format", "minicap", "--compression-quality", "0.05", "--scale-factor", "0.0001", "--udid", udid];
	const proc = spawn(IDB_EXEC, args);

	const onBannerAvailable = (banner: any) => {
		console.info("Banner is available: " + JSON.stringify(banner));
	};

	const onFrameAvailable = (frame: any) => {
		ws.send(frame.buffer, { binary: true });
	};

	const parser = new Parser({ onBannerAvailable, onFrameAvailable });

	const tryParse = () => {
		for (let chunk; (chunk = proc.stdout.read()); ) {
			parser.parse(chunk);
		}
	};

	proc.stdout.on("readable", tryParse);
	proc.stdout.on("data", (data) => {});

	proc.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
		ws.send("error");
	});

	proc.on("close", (code) => {
		console.log(`child process exited with code ${code}`);
		ws.send("error");
	});

	return proc;
};
