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

## Building

To recreate `src/requirements.txt`, recompute dependencies with pip:

```bash
python -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/pip freeze > src/requirements.txt
```

Finally, build with `npm`:

```
npm run build
```