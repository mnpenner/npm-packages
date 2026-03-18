import { helpPlugin, versionPlugin } from "@crustjs/plugins";
import pkg from "../package.json";
import { app } from "./app.ts";
import commands from "./commands/index.ts";

let cli = app
	.use(versionPlugin(pkg.version))
	.use(helpPlugin());

for (const command of commands) {
	cli = cli.command(command);
}

await cli.execute();
