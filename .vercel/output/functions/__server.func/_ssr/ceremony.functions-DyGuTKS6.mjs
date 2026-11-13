import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, o as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ceremony.functions-DyGuTKS6.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loadHome_createServerFn_handler = createServerRpc({
	id: "a20f5ed8e2e18c9b8460311d4e0f5d5dab65ec86e828bf8426a1c56b7b8365d2",
	name: "loadHome",
	filename: "src/lib/ceremony.functions.ts"
}, (opts) => loadHome.__executeServer(opts));
var loadHome = createServerFn({ method: "GET" }).handler(loadHome_createServerFn_handler, async () => {
	const { readHome } = await import("./ceremony.server-CdIo1X9d.mjs");
	return readHome();
});
var enterVault_createServerFn_handler = createServerRpc({
	id: "e73dae4ec986fa41c705c29a0b29691bc6aa81c6be63d41f23d23c7ce5b0cfda",
	name: "enterVault",
	filename: "src/lib/ceremony.functions.ts"
}, (opts) => enterVault.__executeServer(opts));
var enterVault = createServerFn({ method: "POST" }).validator(object({
	email: string().trim().max(120),
	password: string().max(80)
})).handler(enterVault_createServerFn_handler, async ({ data }) => {
	const { enterVault: enter } = await import("./ceremony.server-CdIo1X9d.mjs");
	return enter(data.email, data.password);
});
var leaveVault_createServerFn_handler = createServerRpc({
	id: "5c3b5db30fe6229a1d1d00c8ee872ebd46bf82869b39eb062b8993f4a3e88104",
	name: "leaveVault",
	filename: "src/lib/ceremony.functions.ts"
}, (opts) => leaveVault.__executeServer(opts));
var leaveVault = createServerFn({ method: "POST" }).handler(leaveVault_createServerFn_handler, async () => {
	const { leaveVault: leave } = await import("./ceremony.server-CdIo1X9d.mjs");
	return leave();
});
var saveCeremony_createServerFn_handler = createServerRpc({
	id: "37058c0bb67ec7245a7b1b37c7e66ff00a6fcb8923a587e8010a9f73cb8f8bf8",
	name: "saveCeremony",
	filename: "src/lib/ceremony.functions.ts"
}, (opts) => saveCeremony.__executeServer(opts));
var saveCeremony = createServerFn({ method: "POST" }).validator((input) => input).handler(saveCeremony_createServerFn_handler, async ({ data }) => {
	const { saveCeremony: save } = await import("./ceremony.server-CdIo1X9d.mjs");
	return save(data);
});
//#endregion
export { enterVault_createServerFn_handler, leaveVault_createServerFn_handler, loadHome_createServerFn_handler, saveCeremony_createServerFn_handler };
