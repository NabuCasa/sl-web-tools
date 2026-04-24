import dummyModuleLoaderPy from './dummy_module_loader.py';
import venvRequirementsTxt from './requirements.txt';
import { loadPyodide, type PyodideInterface } from 'pyodide';

interface PythonPackageSpec {
  // The PyPI package name can differ from the module name
  package: string;
  module: string;
  version?: string;
  code?: string;
}

const MOCKED_MODULES: PythonPackageSpec[] = [
  // These dependencies shouldn't be mocked
  // {package: 'async-timeout', module: 'async_timeout'},
  // {package: 'coloredlogs', module: 'coloredlogs'},
  // {package: 'humanfriendly', module: 'humanfriendly'},

  // Dependencies and sub-dependencies
  { package: 'aiosignal', module: 'aiosignal' },
  { package: 'aiohttp', module: 'aiohttp' },
  { package: 'aiohappyeyeballs', module: 'aiohappyeyeballs' },
  { package: 'cffi', module: 'cffi' },
  { package: 'aiosqlite', module: 'aiosqlite' },
  { package: 'cryptography', module: 'cryptography' },
  { package: 'frozenlist', module: 'frozenlist' },
  { package: 'multidict', module: 'multidict' },
  { package: 'pycparser', module: 'pycparser' },
  { package: 'yarl', module: 'yarl' },
  { package: 'jsonschema', module: 'jsonschema' },
  { package: 'jsonschema-specifications', module: 'jsonschema_specifications' },
  { package: 'click', module: 'click' },
  { package: 'click-log', module: 'click_log' },
  { package: 'pure-pcapy3', module: 'pure_pcapy3' },
  { package: 'idna', module: 'idna' },
  { package: 'typing_extensions', module: 'typing_extensions' },
  { package: 'gpiod', module: 'gpiod' },
  { package: 'rpds', module: 'rpds' },
  { package: 'rpds-py', module: 'rpds-py' },
  { package: 'referencing', module: 'referencing' },

  // Internal modules not bundled by default with pyodide
  { package: 'ssl', module: 'ssl', version: '1.0.0' },

  {
    package: 'sqlite3',
    module: 'sqlite3',
    code: `
    class MockSqlite3:
        sqlite_version = "3.31.1"
        sqlite_version_info = (3, 31, 1)
`,
  },
];

export enum PyodideLoadState {
  LOADING_PYODIDE = 0,
  INSTALLING_DEPENDENCIES = 1,
  READY = 2,
}

function parseRequirementsTxt(requirementsTxt: string): Map<string, string> {
  // Decode base64 URIs used by some bundlers
  if (requirementsTxt.startsWith('data:text/plain;base64,')) {
    requirementsTxt = atob(
      requirementsTxt.substring('data:text/plain;base64,'.length)
    );
  }

  const packages = new Map<string, string>();
  const lineEnding = requirementsTxt.includes('\r\n') ? '\r\n' : '\n';

  for (const line of requirementsTxt.trim().split(lineEnding)) {
    let pkg, version;

    if (!line.startsWith('./')) {
      [pkg, version] = line.split('==');
    } else {
      // Local dependencies
      pkg = line.trim();
      version = '0.0.0';
    }

    packages.set(pkg, version);
  }

  return packages;
}

export async function setupPyodide(
  onStateChange: (newState: PyodideLoadState) => any
): Promise<PyodideInterface> {
  onStateChange(PyodideLoadState.LOADING_PYODIDE);
  const pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
  });

  onStateChange(PyodideLoadState.INSTALLING_DEPENDENCIES);
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');

  const requirementsTxt = parseRequirementsTxt(venvRequirementsTxt);

  // Mock unnecessary packages to significantly reduce the download size
  for (const mod of MOCKED_MODULES) {
    micropip.add_mock_package.callKwargs({
      name: mod.package,
      version: mod.version || requirementsTxt.get(mod.package),
      modules: new Map([[mod.module, mod.code || dummyModuleLoaderPy]]),
    });
  }

  // Filter mocked packages from requirements
  const requirements: string[] = [];

  for (const [pkg, version] of requirementsTxt) {
    if (!MOCKED_MODULES.find(m => m.package === pkg)) {
      if (!pkg.startsWith('./')) {
        requirements.push(`${pkg}==${version}`);
      } else {
        const url = new URL(pkg, window.location.href);
        requirements.push(url.href);
      }
    }
  }

  // Install all packages to recreate the venv
  await micropip.install.callKwargs({
    requirements: requirements,
    deps: false,
  });

  // Set up debug logging
  const coloredlogs = pyodide.pyimport('coloredlogs');
  coloredlogs.install.callKwargs({ level: 'DEBUG' });

  onStateChange(PyodideLoadState.READY);

  return pyodide;
}
