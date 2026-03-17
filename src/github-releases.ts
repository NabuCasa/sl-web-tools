import { FirmwareType, ReleaseFwTypeToFirmwareType } from './const';
import type {
  AssetUrlTransformer,
  Firmware,
  GitHubRelease,
  GitHubReleaseAsset,
  Manifest,
  ReleaseManifest,
  ReleaseManifestFirmwareMetadata,
} from './const';

const ReleaseFirmwareNames: Partial<Record<FirmwareType, string>> = {
  [FirmwareType.ZIGBEE_NCP]: 'Zigbee Coordinator',
  [FirmwareType.OPENTHREAD_RCP]: 'Thread',
  [FirmwareType.ZIGBEE_ROUTER]: 'Zigbee Router (alpha)',
};

const FIRMWARE_TYPE_ORDER: FirmwareType[] = [
  FirmwareType.ZIGBEE_NCP,
  FirmwareType.OPENTHREAD_RCP,
  FirmwareType.ZIGBEE_ROUTER,
  FirmwareType.BOOTLOADER,
  FirmwareType.MULTIPAN,
];

function getVersion(metadata: ReleaseManifestFirmwareMetadata): string {
  switch (metadata.fw_type) {
    case 'zigbee_ncp':
    case 'zigbee_router':
      return metadata.ezsp_version ?? metadata.sdk_version;
    case 'openthread_rcp':
      return metadata.ot_rcp_version ?? metadata.sdk_version;
    case 'gecko-bootloader':
      return metadata.gecko_bootloader_version ?? metadata.sdk_version;
    default:
      return metadata.sdk_version;
  }
}

async function fetchLatestGitHubRelease(
  apiUrl: string
): Promise<GitHubRelease> {
  const response = await fetch(`${apiUrl}/latest`);
  return response.json();
}

function convertReleaseManifest(
  releaseManifest: ReleaseManifest,
  release: GitHubRelease,
  firmwareRegex: RegExp,
  urlTransformer: AssetUrlTransformer
): Firmware[] {
  const assetsByName = new Map<string, GitHubReleaseAsset>();

  for (const asset of release.assets) {
    assetsByName.set(asset.name, asset);
  }

  const firmwares: Firmware[] = [];

  for (const fw of releaseManifest.firmwares) {
    if (!firmwareRegex.test(fw.filename)) {
      continue;
    }

    if (fw.metadata === null) {
      continue;
    }

    const firmwareType = ReleaseFwTypeToFirmwareType[fw.metadata.fw_type];

    if (firmwareType === undefined) {
      continue;
    }

    const asset = assetsByName.get(fw.filename);

    if (asset === undefined) {
      continue;
    }

    const name = ReleaseFirmwareNames[firmwareType];

    if (name === undefined) {
      continue;
    }

    firmwares.push({
      name,
      url: urlTransformer(asset.browser_download_url),
      type: firmwareType,
      version: getVersion(fw.metadata),
      checksum: fw.checksum,
    });
  }

  firmwares.sort(
    (a, b) =>
      FIRMWARE_TYPE_ORDER.indexOf(a.type) - FIRMWARE_TYPE_ORDER.indexOf(b.type)
  );

  return firmwares;
}

export async function buildManifestFromGitHubReleases(
  deviceConfig: Manifest,
  releasesApiUrl: string,
  firmwareRegex: RegExp,
  urlTransformer: AssetUrlTransformer
): Promise<Manifest> {
  const release = await fetchLatestGitHubRelease(releasesApiUrl);

  const manifestAsset = release.assets.find(a => a.name === 'manifest.json');
  const manifestUrl = urlTransformer(manifestAsset!.browser_download_url);
  const manifestResponse = await fetch(manifestUrl);
  const releaseManifest: ReleaseManifest = await manifestResponse.json();

  const firmwares = convertReleaseManifest(
    releaseManifest,
    release,
    firmwareRegex,
    urlTransformer
  );

  return {
    ...deviceConfig,
    firmwares: [...firmwares, ...deviceConfig.firmwares],
  };
}
