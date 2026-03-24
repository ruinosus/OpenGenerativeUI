import { ManifestInstance, bootstrapManifest } from "@ruinosus/aap-bootstrap";

const MANIFEST_PATH = ".aap/open-generative-ui";
const _mod = new ManifestInstance("open-generative-ui");

export function getLocalManifest() {
  return _mod.manifest;
}

export async function getBootstrap() {
  return bootstrapManifest(_mod, MANIFEST_PATH, { verbose: true });
}
