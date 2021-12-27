import { blobSetSub } from "./blob.ts";
import { DenoStore } from "./deno_files.ts";
import { cac } from "https://unpkg.com/cac/mod.ts";

const cli = cac("effigy");

cli
  .command("snap <dir>", "Snap a directory into the repo")
  .action(async (dir: string) => {
    console.log(`Snapping ${dir}`);

    const store = new DenoStore("/Users/wschenk/.effigy");
    const blob = await store.createBlobFromDirectory(dir);

    console.log(blob);
  });

cli
  .command("keys <hash>", "Show keys referenced by a hash")
  .action(async (hash: string) => {
    const store = new DenoStore("/Users/wschenk/.effigy");

    console.log(await store.allSubKeys({ hash }));
  });

cli
  .command(
    "diff <first> <second>",
    "Show the new keys defined in the first not in the second",
  )
  .action(async (first: string, second: string) => {
    const store = new DenoStore("/Users/wschenk/.effigy");

    const firstKeys = await store.allSubKeys({ hash: first });
    const secondKeys = await store.allSubKeys({ hash: second });

    console.log("Newer Set");
    console.log(secondKeys);

    console.log("Previous set");
    console.log(firstKeys);
    console.log("Difference:");
    console.log(blobSetSub(secondKeys, firstKeys));
  });

cli
  .command(
    "write <root> <dir>",
    "Write the tree defined at root into dir",
  )
  .action(async (root: string, dir: string) => {
    const store = new DenoStore("/Users/wschenk/.effigy");

    await store.walkTree({ hash: root }, (hash, meta) => {
      console.log(`Should write ${meta.name}`);
    });
  });

cli.help();
// cli.default( () => console.log( "run help" ))
cli.parse();
