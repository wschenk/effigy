import { blobSetSub } from "./blob.ts";
import { DenoStore } from "./deno_files.ts";
import { parse } from "./deps.ts";

const args = parse(Deno.args);

switch (args._[0]) {
  case "snap":
    if (typeof args._[1] === "string") {
      await snap(args._[1]);
    }
    break;
  case "keys":
    if (typeof args._[1] === "string") {
      await keys(args._[1]);
    }
    break;
  case "diff":
    if (typeof args._[1] === "string" && typeof args._[2] === "string") {
      await diff(args._[1], args._[2]);
    } else {
      console.log("Not enough arguments");
    }
    break;
  default:
    console.log("Unknown command");
    break;
}

export async function snap(dir = "workspace") {
  console.log(`Snapping ${dir}`);

  const store = new DenoStore("/Users/wschenk/.effigy");
  const blob = await store.createBlobFromDirectory(dir);

  console.log(blob);
}

export async function keys(hash: string) {
  const store = new DenoStore("/Users/wschenk/.effigy");

  const meta = await store.getBlobAsMeta({ hash });

  if (meta) {
    console.log(await store.allSubKeys(meta));
  }
}

export async function diff(first: string, second: string) {
  const store = new DenoStore("/Users/wschenk/.effigy");

  const firstMeta = await store.getBlobAsMeta({ hash: first });
  const firstKeys = await store.allSubKeys(firstMeta);
  const secondMeta = await store.getBlobAsMeta({ hash: second });
  const secondKeys = await store.allSubKeys(secondMeta);

  console.log("Newer Set");
  console.log(secondKeys);

  console.log("Previous set");
  console.log(firstKeys);
  console.log("Difference:");
  console.log(blobSetSub(secondKeys, firstKeys));
}
