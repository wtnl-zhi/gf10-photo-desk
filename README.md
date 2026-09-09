# GF10 Photo Desk

[中文](#中文) · [English](#english)

## 中文

GF10 Photo Desk 是一个面向 Panasonic Lumix Wi-Fi 相机的本地照片浏览器，当前已用 Panasonic Lumix DC-GF10 完成真实相机验证。

它通过电脑上的本地桥接服务连接相机 Wi-Fi，让电脑或手机浏览器可以：

- 读取相机照片目录和缩略图
- 打开大图预览并浏览上一张/下一张
- 多选照片，选择 JPG 或 RAW 下载
- 将照片逐张下载为独立文件，不打包 ZIP
- 在没有 RAW 的照片上自动回退到 JPG
- 在桌面版中使用固定的底部下载栏

### 项目状态

| 项目 | 状态 |
| --- | --- |
| Panasonic Lumix DC-GF10 | 已验证：握手、目录、缩略图、预览、JPG、RAW |
| 其他兼容型号 | 已整理官方 Image App 兼容范围，尚未逐台验证 |
| 相机写入操作 | 不支持 |
| 视频下载 | 暂未专门适配 |
| macOS Apple Silicon | 已提供可运行桌面版 |

### 快速开始：本地网页

#### 环境要求

- macOS、Linux 或 Windows
- Node.js `>=22.13.0`
- 电脑或手机能够连接相机创建的 Wi-Fi 热点

#### 安装和启动

```bash
git clone https://github.com/wtnl-zhi/gf10-photo-desk.git
cd gf10-photo-desk
npm install
npm run local
```

在电脑上打开：

```text
http://localhost:4173
```

#### 连接相机

1. 在 GF10 上进入：`Wi-Fi → 遥控拍摄和查看`。
2. 让电脑连接 GF10 显示的 Wi-Fi 热点。
3. 打开本地网页，默认相机地址为 `192.168.54.1`。
4. 点击“开始连接”或“连接设置 → 连接相机”。
5. 如果相机出现“连接应用程序”提示，在相机上确认。
6. 页面会自动读取照片目录。

如果要用手机浏览，手机和运行本地服务的电脑都连接 GF10 Wi-Fi，然后在手机打开电脑的局域网地址，例如：

```text
http://192.168.54.10:4173
```

电脑的局域网 IP 需要根据实际网络环境替换。

### JPG 和 RAW 下载

下载栏默认选择 RAW。点击下载时：

1. 程序把 `DOxxxx.JPG` 改成同编号的 `DOxxxx.RW2` 请求。
2. 如果相机返回该 RAW 文件，则保存为 `.RW2`。
3. 如果该照片没有 RAW，则自动改回 `DOxxxx.JPG` 下载。

因此可以混合选择 RAW+JPG、纯 RAW 和纯 JPG 照片，不会因为其中一张没有 RAW 而导致整批失败。也可以在下载栏手动切换为 JPG。

GF10 的目录 XML 对纯 RAW 照片可能只返回一个伪装的 `.JPG` 条目，甚至把资源类型标记为 `UNKNOWN_DATA`。本项目在实际下载时按同编号 `.RW2` 探测，避免让目录加载阶段逐张扫描而变慢。

### macOS 桌面版

#### 直接运行源码

```bash
npm install
npm run macos
```

这会打开独立的 `GF10 Photo Desk` 窗口，并在本机启动桥接服务。

#### 构建可双击的应用

```bash
npm run package:mac
```

生成位置：

```text
release/GF10 Photo Desk-darwin-arm64/GF10 Photo Desk.app
```

当前打包目标是 macOS Apple Silicon（`darwin-arm64`）。双击 `.app` 即可启动；如果 macOS 首次拦截，请在“系统设置 → 隐私与安全性”中允许打开。

桌面版服务只监听本机 `127.0.0.1:4173`。如果需要让手机访问，请使用 `npm run local`，并让服务监听局域网地址。

### 开发命令

| 命令 | 用途 |
| --- | --- |
| `npm run local` | 以 `0.0.0.0:4173` 启动局域网网页服务 |
| `npm run dev` | 启动默认开发服务 |
| `npm run macos` | 启动 Electron 桌面版源码 |
| `npm run build` | 构建网页和 API 服务 |
| `npm run package:mac` | 打包 macOS Apple Silicon 应用 |
| `npm run lint` | 运行 Oxlint 检查 |
| `npm run format` | 使用 Oxfmt 格式化代码 |

### 网络和安全边界

- 所有相机请求由本机桥接服务转发。
- 项目不会把照片或相机地址上传到互联网。
- 支持的操作仅包括连接、状态读取、回放目录读取、缩略图/预览读取和媒体下载。
- 不包含拍照、录像、相机设置、上传、删除或格式化存储卡操作。
- 相机 Wi-Fi 服务是老式 HTTP/UPnP 服务，不能只双击一个静态 HTML 文件直接访问，因此需要本地服务转发。
- 相机原图传输速度取决于 GF10 Wi-Fi；此前实测约 `1.01 MB/s`（约 `8.1 Mbps`）。

### 故障排查

#### 页面显示连接失败或请求超时

- 确认电脑仍连接 GF10 的 Wi-Fi，而不是自动切回普通网络。
- 确认相机仍停留在“遥控拍摄和查看”或对应的 Wi-Fi 连接页面。
- 在连接设置中确认相机地址，默认一般是 `192.168.54.1`。
- 重新在相机上确认“连接应用程序”，再点击页面刷新。
- 关闭其他正在使用 Panasonic Image App 协议的设备，避免相机只接受一个控制端。

#### 只有 JPG，没有 RAW

- 确认相机存储卡中的照片本身包含 RAW；纯 JPG 照片会自动回退为 JPG。
- 下载栏选择 RAW 后，程序会先请求 `.RW2`，失败才请求同编号 `.JPG`。
- GF10 的官方手机 App 可能限制 RAW 保存，但这不代表底层媒体服务没有 RAW 文件。

#### 手机无法打开

- 手机和电脑必须同时连接 GF10 Wi-Fi。
- 使用电脑在该 Wi-Fi 下的局域网 IP，不要使用 `localhost`。
- 防火墙需要允许 Node.js 接收局域网连接。
- 桌面版只监听本机，手机访问请改用 `npm run local`。

### 兼容性

前端型号清单根据 Panasonic 官方 Image App 兼容页面整理：

<https://av.jpn.support.panasonic.com/support/global/cs/soft/image_app/>

当前代码将设备分为系统相机、便携相机、摄像机和其他 Image App 设备。DC-GF10 已完成真实测试；其他型号虽然可能使用相近的 `cam.cgi`、UPnP ContentDirectory 和 50001 媒体服务，但仍建议逐台做一次连接、目录和下载冒烟测试。

### 协议实现概览

项目当前使用以下只读流程：

```text
cam.cgi?mode=accctrl          连接/握手
cam.cgi?mode=getstate         读取状态
cam.cgi?mode=get_content_info 读取照片数量
Server0/CDS_control           UPnP Browse 读取照片目录
:50001/DO*.JPG                JPG 原图
:50001/DO*.RW2                RAW 原图
:50001/DT*.JPG                缩略图
:50001/DS*.JPG                预览图
```

相机媒体请求通过本地 `/api/media` 代理，目录和连接请求通过 `/api/bridge` 处理。

### 许可和免责声明

本项目用于个人研究、相机互操作性测试和本地照片访问。Panasonic、LUMIX、GF10 和相关型号名称属于其各自所有者。本项目不是 Panasonic 官方软件，也不保证适用于所有相机固件或所有网络环境。

## English

GF10 Photo Desk is a local photo browser for Panasonic Lumix cameras with Wi-Fi. It has been tested against a real Panasonic Lumix DC-GF10 camera.

The app runs a local bridge service on the computer and lets a desktop or mobile browser:

- Read the camera photo catalog and thumbnails
- Open full-size previews and navigate between photos
- Select multiple photos and choose JPG or RAW downloads
- Download individual files instead of creating a ZIP archive
- Fall back to JPG automatically when a selected photo has no RAW file
- Use a persistent bottom download bar in the desktop UI

### Project status

| Area | Status |
| --- | --- |
| Panasonic Lumix DC-GF10 | Verified: handshake, catalog, thumbnails, previews, JPG, and RAW |
| Other compatible models | Official Image App range is listed, but not tested model by model |
| Camera write operations | Not supported |
| Video downloads | Not specifically adapted yet |
| macOS Apple Silicon | A runnable desktop build is provided |

### Quick start: local web app

#### Requirements

- macOS, Linux, or Windows
- Node.js `>=22.13.0`
- A computer or phone that can join the Wi-Fi hotspot created by the camera

#### Install and run

```bash
git clone https://github.com/wtnl-zhi/gf10-photo-desk.git
cd gf10-photo-desk
npm install
npm run local
```

Open this URL on the computer:

```text
http://localhost:4173
```

#### Connect the camera

1. On the GF10, open `Wi-Fi → Remote Shooting & View`.
2. Connect the computer to the Wi-Fi hotspot shown by the camera.
3. Open the local web app. The default camera address is `192.168.54.1`.
4. Click `Start connection` or `Connection settings → Connect camera`.
5. Confirm the `Connect application` prompt on the camera if it appears.
6. The app will load the photo catalog.

To use a phone, connect both the phone and the computer running the bridge to the GF10 Wi-Fi, then open the computer's LAN address on the phone, for example:

```text
http://192.168.54.10:4173
```

Replace the address with the computer's actual IP on that Wi-Fi network.

### JPG and RAW downloads

RAW is selected by default in the download bar. When RAW is selected:

1. `DOxxxx.JPG` is changed to the same-numbered `DOxxxx.RW2` request.
2. If the camera serves the RAW file, it is saved with the `.RW2` extension.
3. If that photo has no RAW file, the app requests the matching `DOxxxx.JPG` instead.

This allows a mixed selection of RAW+JPG, RAW-only, and JPG-only photos without failing the whole batch. JPG can still be selected manually from the download bar.

The GF10 may expose a RAW photo in its UPnP XML as a fake `.JPG` item, or mark the resource as `UNKNOWN_DATA`. The app therefore checks the `.RW2` path only when the user downloads, avoiding a slow per-photo scan while loading the catalog.

### macOS desktop app

#### Run from source

```bash
npm install
npm run macos
```

This opens an independent `GF10 Photo Desk` window and starts the bridge service locally.

#### Build a double-clickable application

```bash
npm run package:mac
```

The app is written to:

```text
release/GF10 Photo Desk-darwin-arm64/GF10 Photo Desk.app
```

The current package targets Apple Silicon macOS (`darwin-arm64`). On the first launch, macOS may require approval in `System Settings → Privacy & Security`.

The desktop build listens only on `127.0.0.1:4173`. Use `npm run local` instead if a phone must access the service over the local network.

### Development commands

| Command | Purpose |
| --- | --- |
| `npm run local` | Start the LAN web server on `0.0.0.0:4173` |
| `npm run dev` | Start the default development server |
| `npm run macos` | Run the Electron desktop app from source |
| `npm run build` | Build the web app and API service |
| `npm run package:mac` | Package the macOS Apple Silicon app |
| `npm run lint` | Run Oxlint checks |
| `npm run format` | Format code with Oxfmt |

### Network and security boundaries

- Camera requests are forwarded by a local bridge service.
- Photos and camera addresses are not uploaded to the internet.
- Supported operations are limited to connection, state reads, playback catalog reads, thumbnail/preview reads, and media downloads.
- The project does not take photos, record video, change camera settings, upload files, delete files, or format the memory card.
- The camera uses a legacy HTTP/UPnP service, so a local bridge is required; a static HTML file cannot directly access it.
- Transfer speed depends on the camera Wi-Fi. The GF10 previously measured about `1.01 MB/s` (`8.1 Mbps`).

### Troubleshooting

#### Connection failures or timeouts

- Make sure the computer is still connected to the GF10 Wi-Fi instead of switching back to another network.
- Keep the camera on the `Remote Shooting & View` or equivalent Wi-Fi connection screen.
- Check the camera address in connection settings; `192.168.54.1` is the usual default.
- Confirm `Connect application` on the camera again, then refresh the catalog.
- Close other apps using the Panasonic Image App protocol so the camera can accept one controller.

#### JPG works but RAW does not

- Make sure the photo itself was recorded with RAW enabled. JPG-only photos intentionally fall back to JPG.
- With RAW selected, the app requests `.RW2` first and then the same-numbered `.JPG` if the RAW request fails.
- The official Panasonic phone app may restrict saving RAW files; that does not necessarily mean the underlying camera media service has no RAW path.

#### The phone cannot open the app

- The phone and computer must both be connected to the GF10 Wi-Fi.
- Use the computer's LAN IP on that Wi-Fi, not `localhost`.
- Allow Node.js to accept LAN connections through the firewall.
- The desktop build listens only on the local machine; use `npm run local` for phone access.

### Compatibility

The front-end model list is based on Panasonic's official Image App compatibility page:

<https://av.jpn.support.panasonic.com/support/global/cs/soft/image_app/>

The code groups devices into system cameras, compact cameras, video cameras, and other Image App devices. DC-GF10 has completed real-device testing. Other models may expose similar `cam.cgi`, UPnP ContentDirectory, and port 50001 media services, but each model should still receive a connection, catalog, and download smoke test.

### Protocol overview

The current implementation uses the following read-only flow:

```text
cam.cgi?mode=accctrl          connection / handshake
cam.cgi?mode=getstate         state read
cam.cgi?mode=get_content_info photo count
Server0/CDS_control           UPnP Browse catalog
:50001/DO*.JPG                JPG original
:50001/DO*.RW2                RAW original
:50001/DT*.JPG                thumbnail
:50001/DS*.JPG                preview
```

Camera media requests are proxied through local `/api/media`; connection and catalog requests are handled by `/api/bridge`.

### License and disclaimer

This project is intended for personal research, camera interoperability testing, and local photo access. Panasonic, LUMIX, GF10, and related model names belong to their respective owners. This is not Panasonic software and compatibility is not guaranteed across all camera firmware versions or network environments.
