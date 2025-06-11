import { mdiMulticast, mdiZigbee, mdiRouter } from '@mdi/js';

export const mdiFirmware =
  'M9.5,8.5L11,10L8,13L11,16L9.5,17.5L5,13L9.5,8.5M14.5,17.5L13,16L16,13L13,10L14.5,8.5L19,13L14.5,17.5M21,2H3A2,2 0 0,0 1,4V20A2,2 0 0,0 3,22H21A2,2 0 0,0 23,20V4A2,2 0 0,0 21,2M21,20H3V6H21V20Z';

export const mdiThread =
  'M12 0C5.383 0 0 5.384 0 12.002 0 18.574 5.31 23.928 11.865 24V12.012H7.938A2.12 2.12 0 0 0 5.82 14.13a2.12 2.12 0 0 0 2.116 2.117v2.616a4.738 4.738 0 0 1-4.731-4.733 4.738 4.738 0 0 1 4.731-4.734h3.928V8.074a3.943 3.943 0 0 1 3.938-3.94 3.944 3.944 0 0 1 3.94 3.94 3.944 3.944 0 0 1-3.94 3.939H14.48v11.731C19.911 22.598 24 17.77 24 12.002 24 5.384 18.617 0 12 0Zm5.127 8.073a1.325 1.325 0 0 0-1.324-1.324 1.325 1.325 0 0 0-1.323 1.324v1.323h1.323a1.325 1.325 0 0 0 1.324-1.323z';

export enum ApplicationType {
  GECKO_BOOTLOADER = 'bootloader',
  CPC = 'cpc',
  EZSP = 'ezsp',
  SPINEL = 'spinel',
  ROUTER = 'router',
}

export const ApplicationNames = {
  [ApplicationType.GECKO_BOOTLOADER]: 'Bootloader (recovery)',
  [ApplicationType.CPC]: 'Multi-PAN (RCP)',
  [ApplicationType.EZSP]: 'Zigbee (EZSP)',
  [ApplicationType.SPINEL]: 'OpenThread (RCP)',
  [ApplicationType.ROUTER]: 'Zigbee Router',
};

export enum FirmwareType {
  ZIGBEE_NCP = 'zigbee_ncp',
  ZIGBEE_ROUTER = 'zigbee_router',
  OPENTHREAD_RCP = 'openthread_rcp',
  BOOTLOADER = 'bootloader',
  MULTIPAN = 'multipan',

  UNKNOWN = 'unknown',
}

export enum BootloaderGpioReset {
  RTS_DTR = 'rts_dtr',
}

export const LegacyTypeToFirmwareType = {
  'ncp-uart-hw': FirmwareType.ZIGBEE_NCP,
  'ncp-uart-sw': FirmwareType.ZIGBEE_NCP,
  'rcp-uart-802154': FirmwareType.MULTIPAN,
  'ot-rcp': FirmwareType.OPENTHREAD_RCP,
  'gecko-bootloader': FirmwareType.BOOTLOADER,
};

export const FirmwareIcons = {
  [FirmwareType.ZIGBEE_NCP]: mdiZigbee,
  [FirmwareType.ZIGBEE_ROUTER]: mdiRouter,
  [FirmwareType.MULTIPAN]: mdiMulticast,
  [FirmwareType.OPENTHREAD_RCP]: mdiThread,
  [FirmwareType.BOOTLOADER]: mdiFirmware,
  [FirmwareType.UNKNOWN]: mdiFirmware,
};

export const FirmwareNames = {
  [FirmwareType.ZIGBEE_NCP]: 'Zigbee (EZSP)',
  [FirmwareType.ZIGBEE_ROUTER]: 'Zigbee Router',
  [FirmwareType.MULTIPAN]: 'Multi-PAN (RCP)',
  [FirmwareType.OPENTHREAD_RCP]: 'OpenThread (RCP)',
  [FirmwareType.BOOTLOADER]: 'Gecko Bootloader',
  [FirmwareType.UNKNOWN]: 'Unknown',
};

export const ApplicationTypeToFirmwareType = {
  [ApplicationType.CPC]: FirmwareType.MULTIPAN,
  [ApplicationType.EZSP]: FirmwareType.ZIGBEE_NCP,
  [ApplicationType.ROUTER]: FirmwareType.ZIGBEE_ROUTER,
  [ApplicationType.SPINEL]: FirmwareType.OPENTHREAD_RCP,
  [ApplicationType.GECKO_BOOTLOADER]: FirmwareType.BOOTLOADER,
};

export interface USBFilter {
  pid: number;
  vid: number;
}

export interface Firmware {
  name: string;
  url: string;
  type: FirmwareType;
  version: string;
}

export interface ManifestBaudrates {
  bootloader: number[];
  cpc: number[];
  ezsp: number[];
  spinel: number[];
  router: number[];
}

export interface Manifest {
  product_name: string;
  baudrates: ManifestBaudrates;
  usb_filters: USBFilter[];
  firmwares: Firmware[];
  bootloader_gpio_reset?: BootloaderGpioReset;
  allow_custom_firmware_upload: boolean;
}
