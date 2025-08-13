// Automatic manifest generator utility
class ManifestGenerator {
  constructor() {
    this.baseManifest = {
      name: "Icon Forge Generator PWA",
      short_name: "IconForge",
      description: "Icon Forge Generator PWA - PWA приложение для создания иконок",
      start_url: "./",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#007bff",
      orientation: "any",
      scope: "./",
      lang: "ru",
      categories: ["productivity", "utilities"]
    };
  }

  /**
   * Generate manifest.json automatically based on available images
   * @param {Array} availableImages - Array of available image objects
   * @returns {Object} Complete manifest object
   */
  generateManifest(availableImages = []) {
    const manifest = { ...this.baseManifest };
    
    // Generate icons array
    manifest.icons = this.generateIconsArray(availableImages);
    
    // Generate shortcuts
    manifest.shortcuts = this.generateShortcuts(availableImages);
    
    return manifest;
  }

  /**
   * Generate icons array for manifest
   * @param {Array} availableImages - Array of available image objects
   * @returns {Array} Icons array for manifest
   */
  generateIconsArray(availableImages) {
    const icons = [];
    
    // Standard icon sizes
    const standardSizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
    
    standardSizes.forEach(size => {
      const image = availableImages.find(img => 
        img.path.includes(`icon-${size}x${size}.png`)
      );
      
      if (image) {
        icons.push({
          src: image.path.replace('./', ''),
          sizes: `${size}x${size}`,
          type: "image/png",
          purpose: "any maskable"
        });
      }
    });

    // Add splash screen images
    const splashImages = availableImages.filter(img => 
      img.path.includes('splash-')
    );
    
    splashImages.forEach(image => {
      const sizeMatch = image.path.match(/splash-(\d+)x(\d+)/);
      if (sizeMatch) {
        const width = sizeMatch[1];
        const height = sizeMatch[2];
        icons.push({
          src: image.path.replace('./', ''),
          sizes: `${width}x${height}`,
          type: "image/png",
          purpose: "any"
        });
      }
    });

    return icons;
  }

  /**
   * Generate shortcuts for manifest
   * @param {Array} availableImages - Array of available image objects
   * @returns {Array} Shortcuts array for manifest
   */
  generateShortcuts(availableImages) {
    const icon96 = availableImages.find(img => 
      img.path.includes('icon-96x96.png')
    );

    if (!icon96) return [];

    return [
      {
        name: "Новый документ",
        short_name: "Новый",
        description: "Создать новый документ",
        url: "/?action=new",
        icons: [
          {
            src: icon96.path.replace('./', ''),
            sizes: "96x96",
            type: "image/png"
          }
        ]
      }
    ];
  }

  /**
   * Update manifest with custom settings
   * @param {Object} customSettings - Custom settings to override defaults
   * @returns {Object} Updated manifest object
   */
  updateManifest(customSettings = {}) {
    return { ...this.baseManifest, ...customSettings };
  }

  /**
   * Generate manifest JSON string
   * @param {Array} availableImages - Array of available image objects
   * @param {Object} customSettings - Custom settings to override defaults
   * @returns {string} Formatted JSON string
   */
  generateManifestJSON(availableImages = [], customSettings = {}) {
    const manifest = this.generateManifest(availableImages);
    const updatedManifest = { ...manifest, ...customSettings };
    return JSON.stringify(updatedManifest, null, 2);
  }

  /**
   * Download manifest as file
   * @param {Array} availableImages - Array of available image objects
   * @param {Object} customSettings - Custom settings to override defaults
   */
  downloadManifest(availableImages = [], customSettings = {}) {
    const manifestJSON = this.generateManifestJSON(availableImages, customSettings);
    const blob = new Blob([manifestJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy manifest to clipboard
   * @param {Array} availableImages - Array of available image objects
   * @param {Object} customSettings - Custom settings to override defaults
   */
  async copyManifestToClipboard(availableImages = [], customSettings = {}) {
    const manifestJSON = this.generateManifestJSON(availableImages, customSettings);
    
    try {
      await navigator.clipboard.writeText(manifestJSON);
      console.log('Manifest copied to clipboard');
      return true;
    } catch (err) {
      console.error('Failed to copy manifest to clipboard:', err);
      return false;
    }
  }

  /**
   * Validate manifest structure
   * @param {Object} manifest - Manifest object to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['name', 'start_url', 'display'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Icons validation
    if (!manifest.icons || manifest.icons.length === 0) {
      warnings.push('No icons specified');
    } else {
      // Check for recommended icon sizes
      const recommendedSizes = ['192x192', '512x512'];
      recommendedSizes.forEach(size => {
        const hasSize = manifest.icons.some(icon => icon.sizes === size);
        if (!hasSize) {
          warnings.push(`Missing recommended icon size: ${size}`);
        }
      });
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }
}

// Create global instance
window.manifestGenerator = new ManifestGenerator();

// Integration with image loader
document.addEventListener('DOMContentLoaded', () => {
  // Wait for image loader to be ready
  setTimeout(() => {
    if (window.imageLoader) {
      window.imageLoader.loadAllIcons().then(images => {
        const manifest = window.manifestGenerator.generateManifest(images);
        console.log('Generated manifest:', manifest);
      });
    }
  }, 1000);
});
