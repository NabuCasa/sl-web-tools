import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Manifest } from './const';

import '@material/mwc-button';

@customElement('nabucasa-zigbee-flasher')
export class NabuCasaSilabsFlasher extends LitElement {
  @property()
  public manifest!: string;

  async openFlasherDialog() {
    import('./flashing-dialog');
    const response = await fetch(this.manifest);
    const manifest: Manifest = await response.json();

    if (manifest.application_baudrate !== undefined) {
      console.error(
        'The `application_baudrate` manifest attribute is deprecated and has been replaced with `cpc_baudrate`, `ezsp_baudrate`, and `spinel_baudrate`. It will be removed in a future release, please update your manifest.'
      );

      manifest.cpc_baudrate ??= manifest.application_baudrate;
      manifest.ezsp_baudrate ??= manifest.application_baudrate;
      manifest.spinel_baudrate ??= manifest.application_baudrate;
    }

    const dialog = document.createElement('flashing-dialog');
    dialog.manifest = manifest;
    document.body.appendChild(dialog);
  }

  render() {
    const supportsWebSerial = 'serial' in navigator;

    return html`
      ${supportsWebSerial
        ? html`<mwc-button raised @click=${this.openFlasherDialog}
            ><slot name="button">Connect</slot></mwc-button
          >`
        : html`<slot name="no-webserial"
            ><strong>
              Unfortunately, your browser does not support Web Serial. Open this
              page in Google Chrome or Microsoft Edge.
            </strong></slot
          >`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nabucasa-zigbee-flasher': NabuCasaSilabsFlasher;
  }
}
