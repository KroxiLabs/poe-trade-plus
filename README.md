# POE Trade Pack Kroximatuz

All-in-one extension to improve the Path of Exile 1 & 2 trade experience.

## Features

- **One-Click Mod Filtering**: Add and block modifiers with a single click directly from search results
- **Auto-prefix**: Automatically adds "~" at the start of every search for approximate matching
- **Quick Access Panel**: Floating panel with buttons for most wanted mods including:
  - Total Life
  - Elemental Resistances (Cold, Fire, Lightning)
  - Total Elemental Resistance
  - Movement Speed
  - Currency filters (Chaos, Divine, Mirror)

## Installation

### From OperaGX Addon Store
*(Coming soon - once published)*

### Manual Installation (Development)
1. Download or clone this repository
2. Open OperaGX and navigate to `opera://extensions`
3. Enable "Developer Mode"
4. Click "Load unpacked" and select the extension directory
5. Navigate to [Path of Exile Trade](https://www.pathofexile.com/trade) and enjoy!

## Building for Release

This extension includes automated build pipelines for creating release-ready packages.

### Automated Build (GitHub Actions)

**Option 1: Create a Release Tag**
```bash
git tag v1.0.0
git push origin v1.0.0
```
This will automatically:
- Build the extension package
- Create a GitHub Release
- Attach the ZIP file for download

**Option 2: Manual Trigger**
1. Go to the "Actions" tab in GitHub
2. Select "Build and Release Extension"
3. Click "Run workflow"
4. Download the artifact from the workflow run

### Local Build Scripts

**For Linux/Mac (Bash):**
```bash
chmod +x build.sh
./build.sh
```

**For Windows (PowerShell):**
```powershell
.\build.ps1
```

Both scripts will:
- Validate `manifest.json`
- Copy only the necessary extension files
- Create a ZIP package in the `dist/` folder
- Display package contents and size

The generated ZIP file will be named: `poe-trade-pack-v{version}.zip`

### What's Included in the Package

The build process includes only these files:
- `manifest.json` - Extension metadata
- `cs.js` - Content script
- `bg.js` - Background service worker
- `Logo16x16.png` - Favicon icon
- `Logo48x48.png` - Extension management icon
- `Logo128x128.png` - Store and installation icon

Development files like `CLAUDE.md`, `.git/`, and `README.md` are excluded.

## Development

### Project Structure
```
extension_crhome/
├── manifest.json       # Extension manifest (Manifest V3)
├── cs.js              # Content script (isolated context)
├── bg.js              # Background service worker
├── Logo*.png          # Extension icons
├── build.sh           # Linux/Mac build script
├── build.ps1          # Windows build script
├── .github/
│   └── workflows/
│       └── release.yml # GitHub Actions workflow
└── README.md          # This file
```

### How It Works

The extension uses a two-stage injection pattern:

1. **Content Script (`cs.js`)**: Runs in the isolated content script context and sends a message to the background script
2. **Service Worker (`bg.js`)**: Listens for messages and injects the main functionality into the MAIN world context using `chrome.scripting.executeScript()`
3. **Main Script**: Runs in the page's MAIN world, accessing the Path of Exile trade site's Vue.js application (`window.app`)

The extension integrates with the trade site's Vue.js components to add filtering UI, manage mod selections, and provide quick-access buttons.

## Credits

**Developers**: Trompetin17 & KroximatuZ

**Special Thanks**: **Maxime B** and **Fuzzy** for creating the original scripts that inspired this extension.


## Support

- Become a [Patreon](https://www.patreon.com/c/kroximatuz/membership) ^_^
- See me live on [Twitch](https://www.twitch.tv/kroximatuz)
- Check out my content on [YouTube](https://www.youtube.com/@kroximatuz?sub_confirmation=1)

If you encounter any issues or have suggestions, please:
- Open an issue [here](https://github.com/KroxiLabs/poe-trade-plus/issues)

## Privacy policy

We do not save nor require any data from the end user, if this extension ever uses data from a user will be saved LOCALLY and we won't have any way whatsoever to access it.

## Changelog

### v1.0.0 (Initial Release)
- Add/block modifiers with one click
- Auto "~" prefix on searches
- Quick access panel for resistances, life, and movement speed
- Currency filters for Chaos, Divine, and Mirror
- Support for both PoE 1 and PoE 2 trade sites
