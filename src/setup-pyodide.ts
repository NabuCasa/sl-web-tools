import dummyModuleLoaderPy from './dummy_module_loader.py';
import venvRequirementsTxt from './requirements.txt';
import webSerialTransportPy from './webserial_transport.py';

interface PythonPackageSpec {
  // The PyPI package name can differ from the module name
  package: string;
  module: string;
  version?: string;
}

const MOCKED_MODULES: PythonPackageSpec[] = [
  // These dependencies shouldn't be mocked
  // {package: 'async-timeout', module: 'async_timeout'},
  // {package: 'coloredlogs', module: 'coloredlogs'},
  // {package: 'humanfriendly', module: 'humanfriendly'},

  // Dependencies and sub-dependencies
  { package: 'aiosignal', module: 'aiosignal' },
  { package: 'aiohttp', module: 'aiohttp' },
  { package: 'cffi', module: 'cffi' },
  { package: 'aiosqlite', module: 'aiosqlite' },
  { package: 'cryptography', module: 'cryptography' },
  { package: 'frozenlist', module: 'frozenlist' },
  { package: 'multidict', module: 'multidict' },
  { package: 'pycparser', module: 'pycparser' },
  { package: 'yarl', module: 'yarl' },
  { package: 'click', module: 'click' },
  { package: 'click-log', module: 'click-log' },
  { package: 'pure-pcapy3', module: 'pure_pcapy3' },
  { package: 'idna', module: 'idna' },
  { package: 'typing_extensions', module: 'typing_extensions' },

  // Internal modules not bundled by default with pyodide
  { package: 'ssl', module: 'ssl', version: '1.0.0' },
];

export type Pyodide = any;

export enum PyodideLoadState {
  LOADING_PYODIDE = 0,
  INSTALLING_DEPENDENCIES = 1,
  INSTALLING_TRANSPORT = 2,
  READY = 3,
}

async function loadPyodide(): Promise<Pyodide> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.onerror = e => reject(e);
    script.onload = async () => {
      const pyodide = await (window as any).loadPyodide();
      resolve(pyodide);
    };

    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    document.body.appendChild(script);
  });
}

function writeModule(pyodide: Pyodide, moduleName: string, contents: string) {
  pyodide.FS.mkdir('modules');
  pyodide.FS.writeFile(`modules/${moduleName}.py`, contents, {
    encoding: 'utf8',
  });
}

function parseRequirementsTxt(requirementsTxt: string): Map<string, string> {
  const lines = requirementsTxt.trim().split('\n');
  const packages = new Map<string, string>();

  for (const line of lines) {
    const [pkg, version] = line.split('==');
    packages.set(pkg, version);
  }

  return packages;
}

export async function setupPyodide(
  onStateChange: (newState: PyodideLoadState) => any
): Promise<Pyodide> {
  onStateChange(PyodideLoadState.LOADING_PYODIDE);
  const pyodide = await loadPyodide();

  onStateChange(PyodideLoadState.INSTALLING_DEPENDENCIES);
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');

  const requirementsTxt = parseRequirementsTxt(venvRequirementsTxt);

  // Mock unnecessary packages to significantly reduce the download size
  for (const mod of MOCKED_MODULES) {
    micropip.add_mock_package.callKwargs({
      name: mod.package,
      version: mod.version || requirementsTxt.get(mod.package),
      modules: new Map([[mod.module, dummyModuleLoaderPy]]),
    });
  }

  // Filter mocked packages from requirements
  const requirements: string[] = [];

  for (const [pkg, version] of requirementsTxt) {
    if (!MOCKED_MODULES.find(m => m.package === pkg)) {
      requirements.push(`${pkg}==${version}`);
    }
  }

  // Install all packages to recreate the venv
  await micropip.install.callKwargs({
    requirements: requirements,
    deps: false,
  });

  onStateChange(PyodideLoadState.INSTALLING_TRANSPORT);
  // Prepare the Python path for external modules
  pyodide.runPython(`
    import coloredlogs
    coloredlogs.install(level="DEBUG")

    import sys
    sys.path.insert(0, "./modules/")
  `);

  // Include our webserial transport
  writeModule(pyodide, 'webserial_transport', webSerialTransportPy);

  // And run it
  pyodide.runPython(`
    import webserial_transport
    webserial_transport.patch_pyserial()
  `);
  onStateChange(PyodideLoadState.READY);

  return pyodide;
}
