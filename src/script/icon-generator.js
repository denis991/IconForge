// PWA Icon Generator - JavaScript functionality
// Generates complete icon sets from uploaded images

class IconGenerator {
    constructor() {
        this.originalImage = null;
        this.generatedIcons = new Map();
        this.manifestData = null;
        this.faviconIco = null;

        // Standard PWA icon sizes
        this.iconSizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateRangeValues();
    }

    setupEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Range inputs
        document.getElementById('cornerRadius').addEventListener('input', (e) => {
            document.getElementById('radiusValue').textContent = e.target.value + '%';
        });

        document.getElementById('padding').addEventListener('input', (e) => {
            document.getElementById('paddingValue').textContent = e.target.value + '%';
        });

        // Real-time preview updates
        ['appName', 'shortName', 'themeColor', 'backgroundColor', 'cornerRadius', 'padding'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                if (this.generatedIcons.size > 0) {
                    this.updateManifestPreview();
                }
            });
        });
    }

    setupDragAndDrop() {
        const uploadSection = document.getElementById('uploadSection');

        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Click to upload
        uploadSection.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    updateRangeValues() {
        document.getElementById('radiusValue').textContent = 
            document.getElementById('cornerRadius').value + '%';
        document.getElementById('paddingValue').textContent = 
            document.getElementById('padding').value + '%';
    }

    async handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showStatus('Пожалуйста, выберите файл изображения', 'error');
            return;
        }

        try {
            this.showStatus('Загрузка изображения...', 'info');
            
            const img = await this.loadImage(file);
            this.originalImage = img;
            
            this.displayOriginalImage(img, file);
            this.showPreviewSection();
            
            this.showStatus('Изображение загружено успешно!', 'success');
        } catch (error) {
            console.error('Error loading image:', error);
            this.showStatus('Ошибка при загрузке изображения', 'error');
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    displayOriginalImage(img, file) {
        const originalImage = document.getElementById('originalImage');
        const imageInfo = document.getElementById('imageInfo');
        
        originalImage.src = img.src;
        imageInfo.innerHTML = `
            <p><strong>Размер:</strong> ${img.width} × ${img.height} px</p>
            <p><strong>Файл:</strong> ${file.name}</p>
            <p><strong>Размер файла:</strong> ${this.formatFileSize(file.size)}</p>
        `;
    }

    showPreviewSection() {
        document.getElementById('previewSection').style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.className = `status-message status-${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');

        progressBar.style.display = 'block';
        progressFill.style.width = percentage + '%';

        if (percentage >= 100) {
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 1000);
        }
    }

    generateIcon(size, cornerRadius, padding, backgroundColor) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = size;
        canvas.height = size;

        // Calculate dimensions
        const paddingPx = (size * padding) / 100;
        const imageSize = size - (paddingPx * 2);
        const radiusPx = (size * cornerRadius) / 100;

        // Fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);

        // Create rounded rectangle mask
        if (radiusPx > 0) {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            this.roundRect(ctx, 0, 0, size, size, radiusPx);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw image
        ctx.drawImage(
            this.originalImage,
            paddingPx, paddingPx,
            imageSize, imageSize
        );

        return canvas;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    createIconItem(size, canvas) {
        const iconItem = document.createElement('div');
        iconItem.className = 'icon-item';

        const displayCanvas = document.createElement('canvas');
        displayCanvas.className = 'icon-canvas';
        displayCanvas.width = 80;
        displayCanvas.height = 80;

        const displayCtx = displayCanvas.getContext('2d');
        displayCtx.drawImage(canvas, 0, 0, 80, 80);

        iconItem.innerHTML = `
            <div class="icon-size">${size}×${size}</div>
            <button class="btn btn-secondary" onclick="iconGenerator.downloadSingleIcon(${size})">
                📥 Скачать
            </button>
        `;

        iconItem.insertBefore(displayCanvas, iconItem.firstChild.nextSibling);

        return iconItem;
    }

    downloadSingleIcon(size) {
        const canvas = this.generatedIcons.get(size);
        if (!canvas) return;

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `icon-${size}x${size}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    showDownloadActions() {
        document.getElementById('downloadActions').style.display = 'block';
    }

    async generateFaviconIco() {
        try {
            // Get 16x16 and 32x32 icons for favicon
            const icon16 = this.generatedIcons.get(16);
            const icon32 = this.generatedIcons.get(32);

            if (!icon16 || !icon32) {
                throw new Error('16x16 and 32x32 icons are required for favicon.ico');
            }

            // Convert canvases to PNG blobs
            const blob16 = await this.canvasToBlob(icon16);
            const blob32 = await this.canvasToBlob(icon32);

            // Use PNG2ICOjs to create ICO file
            const converter = new PngIcoConverter();
            const inputs = [
                { png: blob16 },
                { png: blob32 }
            ];

            const icoBlob = await converter.convertToBlobAsync(inputs);
            this.faviconIco = icoBlob;

            return icoBlob;
        } catch (error) {
            console.error('Error generating favicon.ico:', error);
            throw error;
        }
    }

    async downloadAllAsZip() {
        try {
            this.showStatus('Подготовка ZIP архива...', 'info');

            if (typeof JSZip === 'undefined') {
                // Fallback to individual downloads
                this.downloadAllIndividually();
                return;
            }

            const zip = new JSZip();
            const iconsFolder = zip.folder('icons');

            // Add icons to zip
            for (const [size, canvas] of this.generatedIcons) {
                const blob = await this.canvasToBlob(canvas);
                iconsFolder.file(`icon-${size}x${size}.png`, blob);
            }

            // Generate and add favicon.ico
            try {
                const faviconBlob = await this.generateFaviconIco();
                zip.file('favicon.ico', faviconBlob);
            } catch (error) {
                console.warn('Could not generate favicon.ico:', error);
            }

            // Add manifest
            zip.file('manifest.json', this.generateManifestJSON());

            // Add README
            zip.file('README.md', this.generateReadme());

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(zipBlob, 'pwa-icons.zip');

            this.showStatus('ZIP архив скачан!', 'success');

        } catch (error) {
            console.error('Error creating ZIP:', error);
            this.showStatus('Ошибка при создании архива', 'error');
        }
    }

    canvasToBlob(canvas) {
        return new Promise(resolve => {
            canvas.toBlob(resolve);
        });
    }

    downloadAllIndividually() {
        this.showStatus('Скачивание файлов по отдельности...', 'info');

        let delay = 0;

        // Download icons
        for (const [size] of this.generatedIcons) {
            setTimeout(() => {
                this.downloadSingleIcon(size);
            }, delay);
            delay += 500;
        }

        // Download manifest
        setTimeout(() => {
            this.downloadManifest();
        }, delay);

        this.showStatus('Все файлы скачаны!', 'success');
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateReadme() {
        const appName = document.getElementById('appName').value;

        return `# ${appName} - PWA Icons

Этот архив содержит полный набор иконок для PWA приложения "${appName}".

## Содержимое

### Иконки (папка icons/)
${this.iconSizes.map(size => `- icon-${size}x${size}.png`).join('\n')}

### Файлы конфигурации
- manifest.json - Манифест PWA приложения
- favicon.ico - Favicon для браузеров (16x16, 32x32)

## Установка

1. Скопируйте папку \`icons/\` в корень вашего проекта
2. Скопируйте \`manifest.json\` в корень проекта
3. Скопируйте \`favicon.ico\` в корень проекта
4. Добавьте в HTML:
   \`\`\`html
   <link rel="manifest" href="/manifest.json">
   <link rel="icon" href="/favicon.ico" type="image/x-icon">
   \`\`\`

## Размеры иконок

- **16x16, 32x32** - Favicon (также включены в favicon.ico)
- **48x48, 72x72, 96x96** - Android Chrome
- **128x128, 144x144, 152x152** - Android/Windows
- **192x192, 384x384, 512x512** - PWA стандарт

## Favicon

Файл \`favicon.ico\` содержит иконки размером 16x16 и 32x32 пикселей в формате ICO для максимальной совместимости с браузерами.

## Поддержка

Иконки созданы с помощью PWA Icon Generator для MarkMirror Mobile.
`;
    }

    generateManifestJSON() {
        const appName = document.getElementById('appName').value;
        const shortName = document.getElementById('shortName').value;
        const themeColor = document.getElementById('themeColor').value;
        const backgroundColor = document.getElementById('backgroundColor').value;

        const manifest = {
            name: appName,
            short_name: shortName,
            description: `${appName} - PWA приложение`,
            start_url: "/",
            display: "standalone",
            background_color: backgroundColor,
            theme_color: themeColor,
            orientation: "any",
            scope: "/",
            lang: "ru",
            icons: []
        };

        // Add icons
        this.iconSizes.forEach(size => {
            manifest.icons.push({
                src: `icons/icon-${size}x${size}.png`,
                sizes: `${size}x${size}`,
                type: "image/png",
                purpose: "any maskable"
            });
        });

        // Add shortcuts
        manifest.shortcuts = [
            {
                name: "Новый документ",
                short_name: "Новый",
                description: "Создать новый документ",
                url: "/?action=new",
                icons: [{ src: "icons/icon-96x96.png", sizes: "96x96" }]
            }
        ];

        this.manifestData = manifest;
        return JSON.stringify(manifest, null, 2);
    }

    updateManifestPreview() {
        const manifestJSON = this.generateManifestJSON();
        document.getElementById('manifestPreview').textContent = manifestJSON;
    }

    downloadManifest() {
        const manifestJSON = this.generateManifestJSON();
        const blob = new Blob([manifestJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'manifest.json';
        a.click();

        URL.revokeObjectURL(url);
        this.showStatus('manifest.json скачан!', 'success');
    }

    async downloadFavicon() {
        try {
            const faviconBlob = await this.generateFaviconIco();
            this.downloadBlob(faviconBlob, 'favicon.ico');
            this.showStatus('favicon.ico скачан!', 'success');
        } catch (error) {
            console.error('Error downloading favicon:', error);
            this.showStatus('Ошибка при создании favicon.ico', 'error');
        }
    }

    async copyManifestToClipboard() {
        try {
            const manifestJSON = this.generateManifestJSON();
            await navigator.clipboard.writeText(manifestJSON);
            this.showStatus('manifest.json скопирован в буфер обмена!', 'success');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showStatus('Ошибка при копировании в буфер обмена', 'error');
        }
    }
}

// Global functions for HTML onclick handlers
let iconGenerator;

function generateIcons() {
    if (!iconGenerator.originalImage) {
        iconGenerator.showStatus('Сначала загрузите изображение', 'error');
        return;
    }

    iconGenerator.showStatus('Генерация иконок...', 'info');
    iconGenerator.updateProgress(0);

    const iconsGrid = document.getElementById('iconsGrid');
    iconsGrid.innerHTML = '';
    iconGenerator.generatedIcons.clear();

    // Get settings
    const cornerRadius = parseInt(document.getElementById('cornerRadius').value);
    const padding = parseInt(document.getElementById('padding').value);
    const backgroundColor = document.getElementById('backgroundColor').value;

    // Generate icons
    iconGenerator.iconSizes.forEach((size, index) => {
        setTimeout(() => {
            const canvas = iconGenerator.generateIcon(size, cornerRadius, padding, backgroundColor);
            iconGenerator.generatedIcons.set(size, canvas);
            
            // Add to grid
            const iconItem = iconGenerator.createIconItem(size, canvas);
            iconsGrid.appendChild(iconItem);
            
            // Update progress
            const progress = ((index + 1) / iconGenerator.iconSizes.length) * 100;
            iconGenerator.updateProgress(progress);
            
            // Show download actions when complete
            if (index === iconGenerator.iconSizes.length - 1) {
                iconGenerator.showDownloadActions();
                iconGenerator.updateManifestPreview();
                iconGenerator.showStatus('Все иконки сгенерированы!', 'success');
            }
        }, index * 100); // Stagger generation for smooth progress
    });
}

function downloadAllIcons() {
    iconGenerator.downloadAllAsZip();
}

function downloadManifest() {
    iconGenerator.downloadManifest();
}

function copyManifest() {
    iconGenerator.copyManifestToClipboard();
}

function downloadFavicon() {
    iconGenerator.downloadFavicon();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    iconGenerator = new IconGenerator();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconGenerator;
}
