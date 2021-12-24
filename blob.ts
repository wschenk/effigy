import { Md5 } from "./deps.ts";

export type Blob = {
  hash: string;
};

export type BlobMeta = {
  name: string;
  size: number;
  hashes: Blob[];
  collection: boolean;
  contentType?: string;
  mtime?: Date;
};

export async function createBlobFromData(data: Uint8Array): Promise<Blob> {
  const hash = await new Md5().update(data).toString();

  return { hash };
}

export async function encodeMeta(meta: BlobMeta): Promise<Uint8Array> {
  const data = JSON.stringify(meta);
  const encoder = new TextEncoder();
  return await encoder.encode(data);
}

export function decodeMeta(data: Uint8Array): BlobMeta {
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(data);
  const result = JSON.parse(jsonString);
  console.log(result);
  return {
    name: result.name,
    size: result.size,
    hashes: result.hashes,
    collection: result.collection,
    contentType: result.contentType,
    mtime: result.mtime,
  };
}

export abstract class BlobStore {
  abstract hasBlob(blob: Blob): Promise<boolean>;
  abstract writeData(data: Uint8Array): Promise<Blob>;
  abstract writeMeta(meta: BlobMeta): Promise<Blob>;
  abstract getBlobAsData(blob: Blob): Promise<Uint8Array>;
  abstract getBlobAsMeta(blob: Blob): Promise<BlobMeta>;

  async allSubKeys(root: BlobMeta): Promise<Blob[]> {
    const keys = new Array<Blob>();

    for (const blob of root.hashes) {
      keys.push(blob);

      const meta = await this.getBlobAsMeta(blob);

      if (meta.collection) {
        console.log("Not dealing with this directory");
      }

      for (const file of meta.hashes) {
        keys.push(file);
      }
    }
    return keys;
  }
}

export function blobSetSub(a: Blob[], b: Blob[]): Blob[] {
  const ret = new Array<Blob>();

  const hashSet = new Set(a.map((x) => x.hash));

  return b.filter((x) => hashSet.has(x.hash));
}
