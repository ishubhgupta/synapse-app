# Synapse Chrome Extension

Official Chrome extension for Synapse - Save bookmarks with one click from any webpage.

## Features

- **One-Click Save**: Click the extension icon to save the current page
- **Context Menu**: Right-click on any page, link, selection, or image to save
- **Keyboard Shortcut**: Use `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) for quick saving
- **Auto Metadata**: Automatically extracts page title, URL, and metadata
- **Popup Dashboard**: View recent bookmarks and quick actions

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory from this project
5. The Synapse extension icon should appear in your toolbar

### Authentication

The extension needs to connect to your Synapse account:

1. Make sure the Synapse web app is running (default: `http://localhost:3000`)
2. Click the extension icon
3. Click "Open Synapse" to log in to the web app
4. After logging in, click "I'm already logged in" in the extension popup
5. You're ready to save bookmarks!

## Usage

### Save Current Page

**Method 1**: Click the extension icon in the toolbar

**Method 2**: Use keyboard shortcut `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

**Method 3**: Right-click on the page and select "Save to Synapse"

### Save Selected Text

1. Select text on any webpage
2. Right-click and choose "Save selection to Synapse"
3. A note-type bookmark will be created with the selected text

### Save Links

1. Right-click on any link
2. Choose "Save link to Synapse"

### Save Images

1. Right-click on any image
2. Choose "Save image to Synapse"

## Configuration

### Environment Auto-Detection

The extension automatically detects whether to use local or production environment:

- **Development**: Uses `http://localhost:3000` (when version contains 'dev')
- **Production**: Uses `https://synapse-bookmark.vercel.app` (default)

No manual configuration needed! The extension will work with both environments automatically.

### Manual Override (if needed)

If you need to force a specific environment, edit the version in `manifest.json`:

```json
{
  "version": "1.0.0-dev"  // Use local (dev environment)
  // OR
  "version": "1.0.0"      // Use production
}
```

### Supported URLs

The extension has permissions for:
- `http://localhost:3000/*` (local development)
- `https://synapse-bookmark.vercel.app/*` (production)
- `https://*.vercel.app/*` (any Vercel deployment)

## Icons

The extension requires icons in three sizes:
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)  
- `icons/icon128.png` (128x128px)

You can create these icons or use the placeholder images provided.

## Permissions Explained

- **activeTab**: Access the current tab to get page title and URL
- **storage**: Store authentication token locally
- **contextMenus**: Add right-click menu options
- **notifications**: Show save confirmation notifications
- **host_permissions**: Connect to your Synapse API

## Troubleshooting

### "Authentication Required" Error

**Solution**: 
1. Open the Synapse web app
2. Log in with your account
3. Click the extension icon again

### "Failed to save bookmark" Error

**Possible causes**:
- API server not running
- Incorrect API URL in configuration
- Network connectivity issues
- Authentication token expired

**Solution**:
1. Verify the web app is running
2. Check browser console for errors
3. Re-authenticate in the extension popup

### Extension Not Appearing

**Solution**:
1. Check if extension is enabled in `chrome://extensions/`
2. Look for any error messages
3. Try reloading the extension

### Context Menus Not Showing

**Solution**:
1. Uninstall and reinstall the extension
2. Check if permissions are granted
3. Restart Chrome

## Publishing to Chrome Web Store

To publish this extension:

1. Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Update `manifest.json` with production API URL
3. Create proper icon files (16x16, 48x48, 128x128)
4. Prepare screenshots and promotional images
5. Zip the extension directory
6. Upload to Chrome Web Store
7. Fill in store listing information
8. Submit for review

## Development

### Testing Locally

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Synapse extension
4. Test your changes

### Debugging

- **Background Script**: Inspect from `chrome://extensions/` > Service Worker
- **Popup**: Right-click popup and select "Inspect"
- **Console Logs**: Check both extension and web app consoles

## Security

- Authentication tokens are stored locally in Chrome storage
- Tokens are sent via Authorization header
- No sensitive data is hardcoded
- HTTPS enforced in production

## Future Enhancements

- [ ] Offline support
- [ ] Batch bookmark import
- [ ] Tag suggestions
- [ ] Quick edit functionality
- [ ] Screenshot capture
- [ ] Full-page archiving

## Support

For issues and questions:
- Check this README
- Review browser console errors
- Verify API server is running
- Ensure you're logged in to Synapse

## License

MIT License - Same as main Synapse application
