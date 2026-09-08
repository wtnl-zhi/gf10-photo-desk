# GF10 Photo Desk

一个面向 Panasonic Lumix GF10 的本地网页照片浏览器：连接相机 Wi-Fi 后，可以读取缩略图、打开预览、多选照片，并将原图逐张下载为图片文件。

## 使用

1. 相机进入「Wi-Fi → 遥控拍摄和查看」，电脑或手机连接 GF10 热点。
2. 在电脑上运行：

   ```bash
   npm install
   npm run local
   ```

3. 电脑打开 `http://localhost:4173`。默认相机地址是 `192.168.54.1`。
4. 如果要用手机看：手机和运行程序的电脑都连接 GF10 Wi-Fi，然后在手机打开电脑的局域网地址，例如 `http://192.168.54.10:4173`。

网页会自动完成兼容握手；相机出现“连接应用程序”提示时，在相机上点击确认，页面会继续读取目录。

## macOS 桌面版

在 Apple Silicon Mac 上运行：

```bash
npm install
npm run macos
```

这会打开独立的 `GF10 Photo Desk` 窗口，并在本机启动照片桥接服务。需要生成可双击的 `.app` 时运行：

```bash
npm run package:mac
```

生成位置为 `release/GF10 Photo Desk-darwin-arm64/GF10 Photo Desk.app`。该桌面版的本地服务只监听本机；如果要让手机也访问，请继续使用上面的 `npm run local` 方式。

## 说明

- 这是本地网页，不会把相机地址或照片上传到互联网。
- 所有相机操作均为连接、状态读取、回放目录读取和媒体下载；不包含拍照、录像、设置、上传或删除。
- 由于 GF10 的老式 Wi-Fi 服务限制，网页需要通过本地服务转发请求，不能只双击一个 HTML 文件直接访问相机。
- 相机原图传输速度取决于 GF10 的 Wi-Fi；当前测试约 1.01 MB/s（约 8.1 Mbps）。

## 兼容型号来源

前端型号清单按 Panasonic 官方 Image App 兼容页面整理：
<https://av.jpn.support.panasonic.com/support/global/cs/soft/image_app/>

其中 DC-GF10 已用真实相机完成握手、目录读取、缩略图和原图下载验证；其余型号显示为官方兼容范围，但仍建议逐台做一次连接和目录冒烟测试。
