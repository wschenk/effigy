import {
  Blob,
  BlobMeta,
  BlobStore,
  createBlobFromData,
  decodeMeta,
  encodeMeta,
} from "./blob.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

export class DenoStore extends BlobStore {
  dir: string;
  constructor(dir: string) {
    super();
    this.dir = dir;
    Deno.mkdir(dir, { recursive: true });
  }

  async hasBlob(blob: Blob): Promise<boolean> {
    return await exists(`${this.dir}/${blob.hash}`);
  }

  async writeData(data: Uint8Array): Promise<Blob> {
    const blob = await createBlobFromData(data);
    await Deno.writeFile(`${this.dir}/${blob.hash}`, data);

    return blob;
  }

  async writeMeta(meta: BlobMeta): Promise<Blob> {
    const data = await encodeMeta(meta);
    return this.writeData(data);
  }

  async getBlobAsData(blob: Blob): Promise<Uint8Array> {
    return await Deno.readFile(`${this.dir}/${blob.hash}`);
  }

  async getBlobAsMeta(blob: Blob): Promise<BlobMeta> {
    const data = await this.getBlobAsData(blob);
    return decodeMeta(data);
  }

  // Specific deno stuff
  async createBlobFromDirectory(
    dir: string,
    name?: string,
  ): Promise<Blob> {
    const entries = new Array<Blob>();

    console.log(`create from directory - ${dir}`);

    for await (const entry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${entry.name}`;
      const stat = await Deno.stat(fullPath);
      if (entry.isFile) {
        const blobMeta = await this.createBlobMetaFromFile(
          dir,
          entry.name,
          stat.size,
          stat.mtime,
        );

        const blob = await this.writeMeta(blobMeta);
        entries.push(blob);
        console.log(`${blob.hash} - ${fullPath}`);
      }

      if (entry.isDirectory) {
        const blob = await this.createBlobFromDirectory(
          fullPath,
          entry.name,
        );

        entries.push(blob);
      }
    }

    let mtime: Date | undefined = undefined;
    let dirStat = undefined;
    // if (name) {
    // dirStat = await Deno.stat(`${dir}/${name}`);
    // } else {
    dirStat = await Deno.stat(dir);
    // }

    if (dirStat && dirStat.mtime) {
      mtime = dirStat.mtime;
    }

    const meta = {
      name: name || ".",
      size: entries.length,
      hashes: entries,
      collection: true,
      contentType: "directory",
      mtime,
    };

    const hash = await this.writeMeta(meta);
    console.log(`${hash.hash} - ${dir}`);
    return hash;
  }

  async createBlobMetaFromFile(
    dir: string,
    name: string,
    size: number,
    mtime: Date | null,
  ): Promise<BlobMeta> {
    const data = await Deno.readFile(`${dir}/${name}`);

    // TODO split up large files
    const hashes = new Array<Blob>();
    const hash = await this.writeData(data);
    hashes.push(hash);

    let time: Date | undefined = undefined;

    if (mtime) {
      time = mtime;
    }

    return {
      name,
      size,
      mtime: time,
      collection: false,
      hashes,
    };
  }
}
