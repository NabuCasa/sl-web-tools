import { mdiMulticast, mdiZigbee } from '@mdi/js';

export const mdiFirmware =
  'M9.5,8.5L11,10L8,13L11,16L9.5,17.5L5,13L9.5,8.5M14.5,17.5L13,16L16,13L13,10L14.5,8.5L19,13L14.5,17.5M21,2H3A2,2 0 0,0 1,4V20A2,2 0 0,0 3,22H21A2,2 0 0,0 23,20V4A2,2 0 0,0 21,2M21,20H3V6H21V20Z';

export const mdiThread =
  'M27.5-.019C12.335-.019 0 12.317 0 27.48c0 15.06 12.17 27.326 27.191 27.492V27.504h-9a4.858 4.858 0 0 0-4.852 4.853 4.857 4.857 0 0 0 4.851 4.85v5.994c-5.98 0-10.844-4.865-10.844-10.844 0-5.981 4.865-10.847 10.844-10.847h9.001V18.48c0-4.978 4.049-9.027 9.025-9.027 4.977 0 9.027 4.05 9.027 9.027 0 4.977-4.05 9.026-9.027 9.026h-3.032v26.88C45.63 51.76 55 40.695 55 27.48 55 12.317 42.663-.019 27.5-.019Z M39.25 18.479a3.037 3.037 0 0 0-3.034-3.033 3.036 3.036 0 0 0-3.032 3.033v3.032h3.032a3.036 3.036 0 0 0 3.033-3.032z';

export enum ApplicationType {
  GECKO_BOOTLOADER = 'bootloader',
  CPC = 'cpc',
  EZSP = 'ezsp',
  SPINEL = 'spinel',
}

export const ApplicationNames = {
  [ApplicationType.GECKO_BOOTLOADER]: 'Bootloader (recovery)',
  [ApplicationType.CPC]: 'Multi-PAN (RCP)',
  [ApplicationType.EZSP]: 'Zigbee (EZSP)',
  [ApplicationType.SPINEL]: 'OpenThread (RCP)',
};

export enum FirmwareType {
  NCP_UART_HW = 'ncp-uart-hw',
  RCP_UART_802154 = 'rcp-uart-802154',
  ZIGBEE_NCP_RCP_UART_802154 = 'zigbee-ncp-rcp-uart-802154',
  OT_RCP = 'ot-rcp',
}

export const FirmwareIcons = {
  [FirmwareType.NCP_UART_HW]: mdiZigbee,
  [FirmwareType.RCP_UART_802154]: mdiMulticast,
  [FirmwareType.ZIGBEE_NCP_RCP_UART_802154]: mdiMulticast,
  [FirmwareType.OT_RCP]: mdiThread,
};

export const FirmwareNames = {
  [FirmwareType.NCP_UART_HW]: 'Zigbee (EZSP)',
  [FirmwareType.RCP_UART_802154]: 'Multi-PAN (RCP)',
  [FirmwareType.ZIGBEE_NCP_RCP_UART_802154]:
    'Multi-PAN (Zigbee NCP & Thread RCP)',
  [FirmwareType.OT_RCP]: 'OpenThread (RCP)',
};

export const ApplicationTypeToFirmwareType = {
  [ApplicationType.CPC]: FirmwareType.RCP_UART_802154,
  [ApplicationType.EZSP]: FirmwareType.NCP_UART_HW,
  [ApplicationType.SPINEL]: FirmwareType.OT_RCP,
  [ApplicationType.GECKO_BOOTLOADER]: undefined,
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

export interface Manifest {
  product_name: string;
  bootloader_baudrate: number;
  application_baudrate: number;
  usb_filters: USBFilter[];
  firmwares: Firmware[];
  allow_custom_firmware_upload: boolean;
}
