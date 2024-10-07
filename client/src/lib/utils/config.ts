import defaultConfig from "@/constants/default-config";
import { configSchema } from "@/schemas/config";
import LocalStorageWithSchema from "./local-storage-with-schema";

const Config = new LocalStorageWithSchema({
    key: "meowtype__config",
    schema: configSchema,
    fallback: defaultConfig,
});

export default Config;
