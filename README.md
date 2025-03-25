# 文件预览系统

这是一个基于阿里云OSS的文件预览系统，支持多种文件类型的在线预览。

## 功能特点

- 支持多种文件类型的在线预览：
  - PDF文件
  - 图片文件（jpg、jpeg、png、gif）
  - 视频文件（mp4、webm、ogg）
  - Office文件（doc、docx、xls、xlsx）
- 文件夹浏览功能
- 文件大小显示
- 响应式设计
- 动态密码验证

## 技术栈

- HTML5
- CSS3
- JavaScript
- 阿里云OSS SDK

## 使用说明

1. 配置阿里云OSS：
   - 在阿里云控制台创建Bucket
   - 配置CORS规则
   - 设置Bucket访问权限为"公共读"

2. 配置AccessKey：
   - 在`js/ossKeys.js`中配置您的AccessKey信息
   ```javascript
   const ossKeys = {
       accessKeyId: '您的AccessKey ID',
       accessKeySecret: '您的AccessKey Secret'
   };
   ```

3. 部署文件：
   - 将所有文件上传到Web服务器
   - 确保服务器支持HTTPS

4. 访问系统：
   - 打开网页
   - 输入动态密码（格式：YYYYMMDD）
   - 浏览和预览文件

## 目录结构

```
├── index.html          # 主页面
├── css/               # 样式文件
│   └── style.css
├── js/                # JavaScript文件
│   ├── main.js        # 主要逻辑
│   ├── auth.js        # 验证逻辑
│   └── ossKeys.js     # OSS配置
└── README.md          # 项目说明
```

## 注意事项

1. 请妥善保管AccessKey信息
2. 建议使用HTTPS协议
3. 定期更新AccessKey
4. 注意文件大小限制

## 许可证

MIT License 