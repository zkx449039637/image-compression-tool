/**
 * 图片压缩工具的主要JavaScript逻辑
 * @author Your Name
 * @version 1.0.0
 */

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.querySelector('.preview-container');
const comparisonContainer = document.getElementById('comparisonContainer');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const togglePreviewBtn = document.getElementById('togglePreviewBtn');

// 配置
const MAX_PREVIEW_ITEMS = 5; // 默认显示的预览图数量

// 存储上传的图片
let uploadedImages = [];

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', handleFileDrop);
    
    // 点击上传
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // 质量滑块
    qualitySlider.addEventListener('input', updateQualityValue);
    
    // 下载按钮
    downloadBtn.addEventListener('click', downloadCompressedImages);

    // 添加展开/收起按钮事件
    togglePreviewBtn.addEventListener('click', () => {
        previewContainer.classList.toggle('expanded');
        togglePreviewBtn.classList.toggle('active');
    });
}

/**
 * 处理文件拖放
 * @param {DragEvent} e - 拖放事件对象
 */
function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
        processFiles(files);
    }
}

/**
 * 处理文件选择
 * @param {Event} e - 文件选择事件对象
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
        processFiles(files);
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 创建对比元素
 * @param {Object} imageData - 图片数据对象
 */
async function createComparisonElement(imageData) {
    const { original, compressed, element } = imageData;
    
    // 创建临时URL
    const originalUrl = URL.createObjectURL(original);
    const compressedUrl = URL.createObjectURL(compressed);
    
    // 创建对比容器
    const comparisonItem = document.createElement('div');
    comparisonItem.className = 'comparison-item';
    
    // 原图部分
    const originalSide = document.createElement('div');
    originalSide.className = 'comparison-side';
    originalSide.innerHTML = `
        <h3>原始图片</h3>
        <img src="${originalUrl}" class="comparison-image" alt="原图" onload="URL.revokeObjectURL('${originalUrl}')">
        <div class="size-info">
            <span>大小：${formatFileSize(original.size)}</span>
        </div>
    `;
    
    // 压缩图部分
    const compressedSide = document.createElement('div');
    compressedSide.className = 'comparison-side';
    compressedSide.innerHTML = `
        <h3>压缩后</h3>
        <img src="${compressedUrl}" class="comparison-image" alt="压缩图" onload="URL.revokeObjectURL('${compressedUrl}')">
        <div class="size-info">
            <span>大小：${formatFileSize(compressed.size)}</span>
            <span class="size-reduction">(-${Math.round((1 - compressed.size / original.size) * 100)}%)</span>
        </div>
    `;
    
    comparisonItem.appendChild(originalSide);
    comparisonItem.appendChild(compressedSide);
    comparisonContainer.appendChild(comparisonItem);
}

/**
 * 处理上传的文件
 * @param {File[]} files - 文件数组
 */
async function processFiles(files) {
    // 清理之前的资源
    cleanup();
    
    for (const file of files) {
        try {
            const imageData = await loadImage(file);
            uploadedImages.push({
                original: file,
                compressed: null,
                element: await createPreviewElement(imageData, file.name)
            });
        } catch (error) {
            console.error('处理图片时出错:', error);
            alert(`处理图片 ${file.name} 时出错`);
        }
    }
    
    // 根据图片数量显示/隐藏展开按钮
    togglePreviewBtn.style.display = uploadedImages.length > MAX_PREVIEW_ITEMS ? '' : 'none';
    
    downloadBtn.disabled = false;
    compressAllImages();
}

/**
 * 加载图片文件
 * @param {File} file - 图片文件
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 创建预览元素
 * @param {HTMLImageElement} img - 图片元素
 * @param {string} filename - 文件名
 * @returns {Promise<HTMLElement>} 预览元素
 */
async function createPreviewElement(img, filename) {
    const container = document.createElement('div');
    container.className = 'preview-item';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置预览图大小
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'filename';
    nameLabel.textContent = filename;
    
    container.appendChild(canvas);
    container.appendChild(nameLabel);
    previewContainer.appendChild(container);
    
    return container;
}

/**
 * 压缩所有图片
 */
async function compressAllImages() {
    const quality = qualitySlider.value / 100;
    comparisonContainer.innerHTML = '';
    
    for (const image of uploadedImages) {
        try {
            // 判断原图大小
            const originalSize = image.original.size;
            let compressed;

            // 如果原图小于200KB，使用较高的质量或直接使用原图
            if (originalSize < 200 * 1024) { // 200KB
                if (quality < 0.92) {
                    // 如果用户选择的质量太低，使用较高的质量以避免文件变大
                    compressed = await compressImage(image.original, 0.92);
                    // 如果压缩后反而变大，则使用原图
                    if (compressed.size > originalSize) {
                        compressed = image.original;
                    }
                } else {
                    compressed = await compressImage(image.original, quality);
                    // 如果压缩后变大，则使用原图
                    if (compressed.size > originalSize) {
                        compressed = image.original;
                    }
                }
            } else {
                // 大图片正常压缩
                compressed = await compressImage(image.original, quality);
            }

            image.compressed = compressed;
            
            // 创建对比预览
            await createComparisonElement(image);
            
            // 更新压缩率标签
            const compressionRate = Math.round((1 - compressed.size / originalSize) * 100);
            updateCompressionBadge(image.element, compressionRate);
        } catch (error) {
            console.error('压缩图片时出错:', error);
        }
    }
}

/**
 * 压缩单个图片
 * @param {File} file - 原始图片文件
 * @param {number} quality - 压缩质量 (0-1)
 * @returns {Promise<Blob>} 压缩后的图片数据
 */
function compressImage(file, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 绘制图片到canvas
            ctx.fillStyle = 'white'; // 设置白色背景
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // 判断图片类型和特征
            const isPNG = file.type === 'image/png';
            const isSmallFile = file.size < 200 * 1024; // 200KB
            
            // 对于PNG格式的图片，保持原格式并使用无损压缩
            if (isPNG) {
                canvas.toBlob(
                    (blob) => {
                        if (blob.size < file.size) {
                            resolve(blob);
                        } else {
                            resolve(file); // 如果压缩后更大，返回原图
                        }
                    },
                    'image/png',
                    1.0
                );
            } else if (isSmallFile) {
                // 小文件使用较高质量的JPEG压缩
                canvas.toBlob(
                    (blob) => {
                        if (blob.size < file.size) {
                            resolve(blob);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    Math.max(0.92, quality)
                );
            } else {
                // 大文件使用用户指定的质量进行JPEG压缩
                canvas.toBlob(
                    (blob) => {
                        if (blob.size < file.size) {
                            resolve(blob);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            }
        };
        img.onerror = reject;
        
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 更新质量显示值
 */
function updateQualityValue() {
    qualityValue.textContent = `${qualitySlider.value}%`;
    compressAllImages();
}

/**
 * 下载压缩后的图片
 */
async function downloadCompressedImages() {
    if (uploadedImages.length === 1) {
        // 单个文件直接下载
        const image = uploadedImages[0];
        const url = URL.createObjectURL(image.compressed);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${image.original.name}`;
        link.click();
        // 下载开始后释放URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
        // 多个文件打包下载
        const zip = new JSZip();
        
        for (const image of uploadedImages) {
            zip.file(`compressed_${image.original.name}`, image.compressed);
        }
        
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'compressed_images.zip';
        link.click();
        // 下载开始后释放URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

/**
 * 清理资源
 */
function cleanup() {
    // 清空预览和对比区域前，确保释放所有URL
    const images = document.querySelectorAll('img[src^="blob:"]');
    images.forEach(img => {
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    });
    
    // 清空容器
    previewContainer.innerHTML = '';
    comparisonContainer.innerHTML = '';
    uploadedImages = [];
}

/**
 * 更新压缩率标签
 * @param {HTMLElement} element - 预览元素
 * @param {number} compressionRate - 压缩率
 */
function updateCompressionBadge(element, compressionRate) {
    const existingBadge = element.querySelector('.compression-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    const badge = document.createElement('div');
    badge.className = 'compression-badge';
    
    // 根据压缩率显示不同的信息
    if (compressionRate <= 0) {
        badge.textContent = '已是最佳大小';
        badge.classList.add('optimal-size');
    } else {
        badge.textContent = `压缩率: ${compressionRate}%`;
    }
    
    element.appendChild(badge);
}

// 初始化应用
initializeEventListeners(); 