# sl-web-tools
Open source tools to allow working with USB sticks containing SL chips in the browser.
Powered by [NabuCasa/universal-silabs-flasher](https://github.com/NabuCasa/universal-silabs-flasher) and [Pyodide](https://pyodide.org/en/stable/).

## Setup

```bash
npm install @nabucasa/sl-web-tools
```

## Integration

Create a manifest to customize the flasher for your device and include the web component:

```html
<nabucasa-zigbee-flasher manifest="./assets/manifests/skyconnect.json">
  <span slot="button">Connect</span>
</nabucasa-zigbee-flasher>
```
