# HMTool - CLI-based mod managing tool with SSE tooling

HMTool is CLI-based mod managing tool primarily made for SSE, with optional tooling that allows to isolate Nemesis patches.

## Configuration

Mod collection for `HMTool` is described in single `mods.yaml` file,

```yaml
output: "C:\\Skyrim Virtual Installation" # location of virtual folder where modded game will be available
base: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Skyrim Special Edition" # location of a base game
sse:
  plugins: load-order.txt # if specified, `hmtool deploy` will overwrite plugins.txt file with this file
  nemesis_patch: "mods\\nemesis-output" # location of nemesis patch generated with `hmtool nemesis-patch` command
mods:
  - path: "Mods\\skse64_2_02_03\\skse64_2_02_03\\skse64_1_6_640.dll" # mod folder or file
    prefix: skse64_1_6_640.dll # where to put this folder or file in virtual folder
  - path: "Mods\\skse64_2_02_03\\skse64_2_02_03\\skse64_loader.exe"
    prefix: skse64_loader.exe 
```

## How to use

Note: you can omit path to `mods.yaml` if it is named `mods.yaml` and is located in working directory where tool is executed.

### Deploying

```
hmtool deploy [mods.yaml location]
```

This command will create new folder `config.output` and create hardlinks of base game files and all mod files there. If such folder exists, it is purged completely and recreated from scratch each time this command is run. This is more akin to what MO2 does with its USVFS, than to hardlink deployment strategy of Vortex, because main goal is to keep base game installation untouched.

### Patching registry

```
hmtool registry [mods.yaml location]
```

This command will add virtual installation directory to `HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Bethesda Softworks\Skyrim Special Edition` key, `installed path` parameter. This is very important for tools like SSEEdit, DynDOLOD or TexGen to be able to see your modded installation. If you don't use such tools, you can omit this step.

### Isolating nemesis changes

```
hmtool nemesis-snapshot [mods.yaml location]
```

This command backups all `.txt`, `.pex` and `.hkx` files from virtual installation directory to `C:\Users\<username>\AppData\Local\hmtool\nemesis-snapshot`. It is presumed that Nemesis writes this files only during it's operation. I've still got no response from the author of Nemesis, if this assumption is incorrect, then it is incorrect 🤷‍♀️.

```
hmtool nemesis-patch [mods.yaml location]
```

This command walks over all `.txt`, `.pex` and `.hkx` files at virtual installation directory and compares them to backup files created previously. All detected changes are then copied to `config.sse.nemesis_patch` directory, which should be added to `config.mods` to be deployed on next run. This **includes** Nemesis own files overwritten by engine update or normal operation, **including** its logs, but limited to `.txt`, `.pex` and `.hkx` files.

All files for which changes are detected are then either purged if they are new, or overwritten **at their original location** (in your mod collection folder and consequently at virtuall installation directory) since Nemesis does the same to them.

<p style="background-color: red; border-radius: 4px; padding: 4px; color: white;">It is vital to run commands in strict order: <code>nemesis-snapshot</code>, then Nemesis itself, then <code>nemesis-patch</code>, then <code>deploy</code> with generated patch folder added to mods list in config. If done incorrectly, it can corrupt your mods! (For example, <code>nemesis-snapshot</code> after Nemesis was run will assume that changed files are original).</p>

## How to build

1. Install NodeJS 20 or later. Previous versions don't support creating single executable out of script.
2. Clone this repository
3. Install dependencies with `npm install` command
4. Run `npm run build`
5. Grab `hmtool.exe` and `hmtool.js` from `dist/` folder.
