import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/** @type {typeof import("js-yaml")} */
const yaml = require("js-yaml");
export default yaml;
