export type CompatibilityGroup = {
  label: string;
  description: string;
  models: string[];
};

// Panasonic's current Image App compatibility page is the closest published
// model matrix for this legacy cam.cgi + UPnP media flow. GF10 is verified in
// this project; the other entries still need a camera-by-camera smoke test.
export const compatibilityGroups: CompatibilityGroup[] = [
  {
    label: '系统相机 / System Camera',
    description: '最接近 GF10 的协议路径：cam.cgi、回放目录和 50001 媒体文件。',
    models: [
      'DC-G90 / G91 / G95 / G95D',
      'DC-GX9',
      'DC-GF10',
      'DC-GH5S',
      'DC-G9',
      'DC-GH5',
      'DC-GF9 / GX800 / GX850',
      'DMC-G80 / G81 / G85',
      'DMC-GX80 / GX85',
      'DMC-GF8',
      'DMC-GX8',
      'DMC-G7 / G70',
      'DMC-GF7',
      'DMC-GM5',
      'DMC-GM1S',
      'DMC-GH4',
      'DMC-GM1',
      'DMC-GX7',
      'DMC-G6',
      'DMC-GF6',
    ],
  },
  {
    label: '便携相机 / Compact Camera',
    description: '官方 Image App 兼容；照片媒体服务的具体返回格式需逐台确认。',
    models: [
      'DC-TZ300 / ZS300',
      'DC-TZ99 / ZS99',
      'DC-TZ95 / TZ95D / TZ96 / TZ96D / TZ97 / ZS80 / ZS80D',
      'DC-FZ1000M2 / FZ10002',
      'DC-LX100M2',
      'DC-TZ200 / TZ200D / TZ202 / TZ202D / TZ220 / TZ220D / ZS200 / ZS200D / ZS220 / ZS220D',
      'DC-TZ90 / TZ91 / TZ92 / TZ93 / ZS70',
      'DC-FZ80 / FZ82',
      'DMC-FZ2000 / FZ2500 / LX9 / LX10 / LX15',
      'DMC-TZ100 / TZ101 / TZ110 / ZS100 / ZS110',
      'DMC-TZ80 / TZ81 / ZS60',
      'DMC-FZ300 / FZ330',
      'DMC-FT7 / TS7',
      'DMC-LX100 / FZ1000',
      'DMC-TZ55 / TZ56 / ZS35 / TZ60 / TZ61 / ZS40 / SZ8',
      'DMC-TZ40 / TZ41 / TZ37 / ZS30 / ZS27 / FT5 / TS5 / SZ9',
    ],
  },
  {
    label: '摄像机 / Video Camera',
    description: '官方 Image App 兼容，但本项目暂以照片浏览为主，未将视频目录单独适配。',
    models: [
      'HC-VX3',
      'HC-WXF1 / WXF1M / VXF1 / VXF11 / VX1 / VX11',
      'HC-WXF995 / WXF995M / VXF995 / VX985 / VX985M',
      'HC-WXF990 / WXF991 / WXF990M / VXF990 / VXF999 / VX980 / VX981 / VX989 / VX980M',
      'HC-WX970 / WX979 / WX970M / VX870 / VX878 / VX870M',
      'HC-V900 / V800 / V808 / W585 / W585M / V785 / V385',
      'HC-W580 / W580M / V380 / V770 / V777 / V770M / W570 / W570M',
      'HC-V270 / W850 / W858 / W850M / V750 / V757 / V750M / V550 / V550M / V250',
      'HC-X920 / X929 / X920M / V520 / V520M / V720 / V727 / V720M / V727M',
      'HC-X1000',
    ],
  },
  {
    label: '其他 / Wearable & Dual',
    description: '官方列表中的其他 Image App 设备，暂不承诺照片网格兼容。',
    models: ['HX-A1M / A1H / A500 / A100', 'HX-WA30'],
  },
];

export const verifiedModels = ['DC-GF10'];
