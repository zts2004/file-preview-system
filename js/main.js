// 阿里云OSS配置
const ossConfig = {
    region: 'oss-cn-chengdu',
    accessKeyId: 'LTAI5tB9DURsU9J6GRAaqE5G',
    accessKeySecret: 'wOTFYVoEk8qZmJxyzduriGkrozn5L8',
    bucket: 'qqzts',
    secure: true,
    timeout: 60000,
    cname: false,
    endpoint: 'oss-cn-chengdu.aliyuncs.com',
    // 强制使用v4签名
    signatureVersion: 'v4',
    cors: true, // 开启CORS
    headers: {
        'x-oss-security-token': undefined // 不使用STS Token
    }
};

// 初始化OSS客户端
let client = null;
try {
    console.log('正在初始化OSS客户端，配置:', JSON.stringify({
        region: ossConfig.region,
        bucket: ossConfig.bucket,
        endpoint: ossConfig.endpoint,
        secure: ossConfig.secure,
        cors: ossConfig.cors
    }));
    client = new OSS(ossConfig);
    console.log('OSS客户端初始化成功');
} catch (error) {
    console.error('OSS初始化失败:', error);
    alert('OSS初始化失败，请检查配置和网络连接');
}

// 文件类型映射
const fileTypes = {
    attachment1: 'attachment1', // 附件一
    attachment2: 'attachment2', // 附件二
    attachment3: 'attachment3', // 附件三
    attachment4: 'attachment4', // 附件四
    video: 'video' // 视频
};

// 显示文件列表
async function showFiles(type) {
    console.log('开始显示文件列表，类型:', type);
    const previewContent = document.getElementById('preview-content');
    const previewTitle = document.getElementById('preview-title');
    const filePreview = document.getElementById('file-preview');
    
    try {
        if (!client) {
            console.error('OSS客户端未初始化');
            throw new Error('OSS客户端未初始化，请检查配置');
        }

        // 显示加载状态
        previewContent.innerHTML = '<div class="loading">加载中...</div>';
        filePreview.classList.remove('hidden');
        
        console.log('正在获取文件列表...');
        // 获取文件列表
        const files = await listFiles(type);
        console.log('获取到的文件列表:', files);
        
        // 更新标题
        previewTitle.textContent = getTypeName(type);
        
        // 渲染文件列表
        renderFiles(files, previewContent);
    } catch (error) {
        console.error('显示文件列表失败:', error);
        previewContent.innerHTML = `<div class="error">
            <p>加载失败</p>
            <p class="error-message">${error.message}</p>
            <p class="error-hint">请检查：</p>
            <ul class="error-list">
                <li>网络连接是否正常</li>
                <li>OSS配置是否正确</li>
                <li>Bucket权限是否配置</li>
                <li>CORS规则是否设置</li>
            </ul>
        </div>`;
    }
}

// 获取文件列表
async function listFiles(type) {
    try {
        if (!client) {
            throw new Error('OSS客户端未初始化');
        }

        const prefix = `${fileTypes[type]}/`;
        console.log('正在获取文件列表:', prefix);

        // 添加重试机制
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const result = await client.list({
                    prefix: prefix,
                    delimiter: '/',
                    'max-keys': 1000
                });

                console.log('获取到的文件列表:', result);

                // 处理文件夹
                const folders = (result.prefixes || []).map(prefix => ({
                    name: prefix,
                    isFolder: true,
                    size: 0
                }));

                // 处理文件
                const files = (result.objects || [])
                    .filter(file => file.name !== prefix && !file.name.endsWith('/'))
                    .map(file => ({
                        ...file,
                        isFolder: false
                    }));

                // 合并文件夹和文件
                return [...folders, ...files];

            } catch (err) {
                console.error(`第${retryCount + 1}次尝试失败:`, err);
                retryCount++;
                if (retryCount === maxRetries) {
                    throw err;
                }
                // 等待1秒后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('获取文件列表失败:', error);
        let errorMessage = '获取文件列表失败: ';
        
        if (error.name === 'ConnectionTimeoutError') {
            errorMessage += '连接超时，请检查网络';
        } else if (error.status === 403) {
            errorMessage += '没有访问权限，请检查AccessKey权限和Bucket配置';
        } else if (error.code === 'CORS_ERROR') {
            errorMessage += '跨域请求被拒绝，请检查CORS设置';
        } else if (error.code === 'InvalidArgument') {
            errorMessage += '参数错误，请检查文件路径';
        } else {
            errorMessage += error.message || '未知错误';
        }
        
        throw new Error(errorMessage);
    }
}

// 渲染文件列表
function renderFiles(files, container) {
    if (files.length === 0) {
        container.innerHTML = '<div class="no-files">暂无文件</div>';
        return;
    }

    const fileList = document.createElement('div');
    fileList.className = 'file-list';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${file.isFolder ? 'folder-item' : ''}`;
        
        const fileName = file.name.split('/').pop() || file.name.split('/').slice(-2, -1)[0];
        const fileType = file.isFolder ? 'folder' : getFileType(fileName);
        
        fileItem.innerHTML = `
            <div class="file-icon">${getFileIcon(fileType)}</div>
            <div class="file-info">
                <div class="file-name">${fileName}</div>
                ${!file.isFolder ? `<div class="file-size">${formatFileSize(file.size)}</div>` : ''}
            </div>
            ${!file.isFolder ? `<button class="preview-btn" onclick="previewFile('${file.name}')">预览</button>` : ''}
        `;

        if (file.isFolder) {
            fileItem.onclick = async () => {
                try {
                    const result = await client.list({
                        prefix: file.name,
                        delimiter: '/',
                        'max-keys': 1000
                    });
                    
                    const files = (result.objects || [])
                        .filter(f => f.name !== file.name)
                        .map(f => ({
                            ...f,
                            isFolder: f.name.endsWith('/')
                        }));
                        
                    renderFiles(files, container);
                    
                    // 更新标题显示当前路径
                    const pathParts = file.name.split('/').filter(Boolean);
                    document.getElementById('preview-title').textContent = 
                        `${getTypeName(currentType)} / ${pathParts.join(' / ')}`;
                    
                    // 添加返回按钮
                    const backButton = document.createElement('div');
                    backButton.className = 'back-button';
                    backButton.innerHTML = '← 返回上级';
                    backButton.onclick = () => showFiles(currentType);
                    container.insertBefore(backButton, container.firstChild);
                } catch (error) {
                    console.error('Error loading folder:', error);
                    alert('加载文件夹失败，请稍后重试');
                }
            };
        }
        
        fileList.appendChild(fileItem);
    });

    container.innerHTML = '';
    container.appendChild(fileList);
}

// 预览文件
async function previewFile(fileName) {
    try {
        const url = await client.signatureUrl(fileName);
        const fileType = getFileType(fileName);
        const previewContent = document.getElementById('preview-content');
        
        // 根据文件类型选择预览方式
        switch(fileType) {
            case 'pdf':
                // PDF文件使用iframe预览
                previewContent.innerHTML = `
                    <div class="preview-container">
                        <iframe src="${url}" width="100%" height="800px" frameborder="0"></iframe>
                    </div>
                `;
                break;
                
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                // 图片文件直接显示
                previewContent.innerHTML = `
                    <div class="preview-container">
                        <img src="${url}" alt="预览图片" style="max-width: 100%; max-height: 800px;">
                    </div>
                `;
                break;
                
            case 'mp4':
            case 'webm':
            case 'ogg':
                // 视频文件使用video标签预览
                previewContent.innerHTML = `
                    <div class="preview-container">
                        <video controls width="100%" style="max-height: 800px;">
                            <source src="${url}" type="video/mp4">
                            您的浏览器不支持视频播放
                        </video>
                    </div>
                `;
                break;
                
            case 'doc':
            case 'docx':
            case 'xls':
            case 'xlsx':
                // Office文件使用在线预览服务
                previewContent.innerHTML = `
                    <div class="preview-container">
                        <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}" 
                                width="100%" height="800px" frameborder="0"></iframe>
                    </div>
                `;
                break;
                
            default:
                // 其他文件类型使用默认预览方式
                window.open(url, '_blank');
        }
        
        // 显示预览区域
        document.getElementById('file-preview').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error previewing file:', error);
        alert('预览失败，请稍后重试');
    }
}

// 关闭预览
function closePreview() {
    document.getElementById('file-preview').classList.add('hidden');
}

// 获取文件类型图标
function getFileIcon(fileType) {
    const icons = {
        folder: '📁',
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        mp4: '🎥',
        avi: '🎥',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        zip: '📦',
        rar: '📦'
    };
    return icons[fileType] || '📄';
}

// 获取文件类型
function getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    return ext;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取类型名称
function getTypeName(type) {
    const names = {
        attachment1: '附件一',
        attachment2: '附件二',
        attachment3: '附件三',
        attachment4: '附件四',
        video: '视频'
    };
    return names[type] || type;
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
.loading {
    text-align: center;
    padding: 20px;
    color: var(--text-color);
}

.loading::after {
    content: '';
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--secondary-color);
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-left: 10px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error {
    text-align: center;
    padding: 20px;
    color: #ff4444;
}

.error-message {
    font-size: 0.9em;
    margin-top: 10px;
    color: #ff6666;
}

.no-files {
    text-align: center;
    padding: 20px;
    color: var(--text-color);
    font-style: italic;
}

.folder-item {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.02);
}

.folder-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.back-button {
    padding: 10px;
    margin-bottom: 10px;
    cursor: pointer;
    color: #666;
    font-weight: bold;
}

.back-button:hover {
    color: #333;
}
`;
document.head.appendChild(style);

// 添加预览相关样式
const previewStyle = document.createElement('style');
previewStyle.textContent = `
.preview-container {
    width: 100%;
    height: 800px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background: white;
    padding: 20px;
    box-sizing: border-box;
}

.preview-container iframe {
    width: 100%;
    height: 100%;
    border: none;
}

.preview-container img {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-container video {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
}
`;
document.head.appendChild(previewStyle);
