# Ori大战鼠鼠

一个有趣的网页小游戏，由HTML5 Canvas开发。

## 目录结构

```
ori-vs-rat-game/
├── index.html          # 游戏主页面
├── game.js            # 游戏逻辑代码
├── images/            # 图片资源目录
│   ├── door.png      # 出口门图片
│   ├── rat poison.png # 老鼠药图片
│   ├── ori.jpeg      # Ori角色图片
│   └── rat.jpeg      # 老鼠角色图片
├── README.md          # 项目说明文档
└── LICENSE           # MIT许可证
```

## 游戏说明

- 使用 ← → 键左右移动
- 使用空格键跳跃（每次只能跳一级台阶）
- 躲避老鼠药（会扣除10%生命值）
- 小心Ori（会将老鼠撞飞并掉落）
- 通过7级台阶到达终点获得胜利

## 游戏截图

[游戏截图将在这里展示]

## 如何运行

1. 克隆此仓库
2. 确保所有图片文件都在 `images` 目录中
3. 使用任意Web服务器运行（比如Python的 `python -m http.server 8000`）
4. 在浏览器中访问 `http://localhost:8000`

## 在线试玩

[游戏链接将在GitHub Pages部署后更新]

## 技术栈

- HTML5 Canvas
- JavaScript
- CSS3

## 许可证

MIT License 