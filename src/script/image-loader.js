// Automatic image loader utility
class ImageLoader {
  constructor() {
    this.imageCache = new Map();
    this.loadedImages = [];
  }

  // Standard icon sizes for PWA
  static ICON_SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
  
  // Additional sizes for splash screens and other purposes
  static SPLASH_SIZES = [640, 750, 828, 1125, 1242, 1536, 1668, 2048];

  /**
   * Automatically load all available icons from the img directory
   * @returns {Promise<Array>} Array of loaded image objects
   */
  async loadAllIcons() {
    const loadPromises = [];
    
    // Load standard icons
    for (const size of ImageLoader.ICON_SIZES) {
      const iconPath = `./src/img/icon-${size}x${size}.png`;
      loadPromises.push(this.loadImageSafely(iconPath, size));
    }

    // Load favicon
    loadPromises.push(this.loadImageSafely('./src/img/favicon.ico', 'favicon'));
    
    // Load SVG icon if available
    loadPromises.push(this.loadImageSafely('./src/img/icon-forge.svg', 'svg'));

    const results = await Promise.allSettled(loadPromises);
    this.loadedImages = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    console.log(`Loaded ${this.loadedImages.length} images successfully`);
    return this.loadedImages;
  }

  /**
   * Safely load an image without throwing errors if it doesn't exist
   * @param {string} path - Image path
   * @param {string|number} identifier - Size or identifier for the image
   * @returns {Promise<Object|null>} Image object or null if failed
   */
  async loadImageSafely(path, identifier) {
    try {
      const exists = await this.checkImageExists(path);
      if (!exists) {
        console.warn(`Image not found: ${path}`);
        return null;
      }

      const imageData = await this.loadImage(path);
      return {
        path,
        identifier,
        size: typeof identifier === 'number' ? identifier : null,
        data: imageData,
        element: imageData
      };
    } catch (error) {
      console.warn(`Failed to load image ${path}:`, error);
      return null;
    }
  }

  /**
   * Check if an image exists by attempting to load it
   * @param {string} path - Image path
   * @returns {Promise<boolean>} True if image exists
   */
  async checkImageExists(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = path;
    });
  }

  /**
   * Load a single image
   * @param {string} path - Image path
   * @returns {Promise<HTMLImageElement>} Loaded image element
   */
  async loadImage(path) {
    if (this.imageCache.has(path)) {
      return this.imageCache.get(path);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      img.src = path;
    });
  }

  /**
   * Get all loaded images
   * @returns {Array} Array of loaded image objects
   */
  getLoadedImages() {
    return this.loadedImages;
  }

  /**
   * Get images by size
   * @param {number} size - Image size
   * @returns {Object|null} Image object or null
   */
  getImageBySize(size) {
    return this.loadedImages.find(img => img.size === size) || null;
  }

  /**
   * Get all available sizes
   * @returns {Array<number>} Array of available sizes
   */
  getAvailableSizes() {
    return this.loadedImages
      .filter(img => img.size !== null)
      .map(img => img.size)
      .sort((a, b) => a - b);
  }

  /**
   * Generate manifest icons array automatically
   * @returns {Array} Array of icon objects for manifest.json
   */
  generateManifestIcons() {
    return this.loadedImages
      .filter(img => img.size !== null && img.path.endsWith('.png'))
      .map(img => ({
        src: img.path.replace('./', ''),
        sizes: `${img.size}x${img.size}`,
        type: 'image/png',
        purpose: 'any maskable'
      }));
  }

  /**
   * Preload all images for better performance
   * @returns {Promise<void>}
   */
  async preloadImages() {
    await this.loadAllIcons();
    console.log('All images preloaded successfully');
  }
}

// Create global instance
window.imageLoader = new ImageLoader();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.imageLoader.preloadImages().catch(console.error);
});
