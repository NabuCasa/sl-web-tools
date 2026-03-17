import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { AssetUrlTransformer, Manifest } from './const';

import '@material/mwc-button';

@customElement('nabucasa-zigbee-flasher')
export class NabuCasaSilabsFlasher extends LitElement {
  @property()
  public manifest!: string;

  @property({ attribute: 'github-releases-api' })
  public githubReleasesApi?: string;

  @property({ attribute: 'firmware-regex' })
  public firmwareRegex?: string;

  public assetUrlTransformer: AssetUrlTransformer = url => url;

  async openFlasherDialog() {
    import('./flashing-dialog');

    let manifest: Manifest;

    if (this.githubReleasesApi && this.firmwareRegex) {
      const { buildManifestFromGitHubReleases } = await import(
        './github-releases'
      );

      const deviceConfigResponse = await fetch(this.manifest);
      const deviceConfig: Manifest = await deviceConfigResponse.json();

      manifest = await buildManifestFromGitHubReleases(
        deviceConfig,
        this.githubReleasesApi,
        new RegExp(this.firmwareRegex),
        this.assetUrlTransformer
      );
    } else {
      const response = await fetch(this.manifest);
      manifest = await response.json();
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
