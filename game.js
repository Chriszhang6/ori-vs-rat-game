// Doodle Jump 平台生成器
class PlatformGenerator {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.platformSpacing = 100;  // 平台之间的垂直距离
        this.minPlatformWidth = 70;
        this.maxPlatformWidth = 140;
        this.colors = ['#FFB6C1', '#98FB98', '#87CEFA', '#DDA0DD', '#F0E68C', '#FFA07A'];
        this.highestPlatformY = 0;
    }

    generateInitialPlatforms() {
        const platforms = [];
        // 在底部创建起始平台
        const startPlatform = {
            x: this.canvasWidth / 2 - 60,
            y: this.canvasHeight - 150,
            width: 150,
            height: 18,
            velocityX: 0,
            color: '#98FB98',
            borderRadius: 10,
            type: 'normal',
            isStart: true
        };
        platforms.push(startPlatform);

        // 向上生成约12个平台
        for (let i = 1; i < 12; i++) {
            platforms.push(this.createPlatform(
                this.canvasHeight - 150 - (i * this.platformSpacing)
            ));
        }
        this.highestPlatformY = platforms[platforms.length - 1].y;
        return platforms;
    }

    createPlatform(y) {
        const type = this.getRandomType();
        const width = this.minPlatformWidth + Math.random() * (this.maxPlatformWidth - this.minPlatformWidth);
        const hasVelocityX = type === 'moving';

        return {
            x: Math.random() * (this.canvasWidth - width),
            y: y,
            width: width,
            height: 18,
            velocityX: hasVelocityX ? (Math.random() - 0.5) * 3 : 0,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            borderRadius: 10,
            type: type,
            opacity: type === 'disappearing' ? 1.0 : null,
            disappearing: false
        };
    }

    getRandomType() {
        const rand = Math.random();
        if (rand < 0.08) return 'moving';       // 8% 移动平台
        if (rand < 0.12) return 'disappearing'; // 4% 消失平台
        return 'normal';                         // 88% 普通平台
    }

    shouldGeneratePlatform(highestPlatformY, cameraY) {
        // 当最高平台距离相机顶部小于200px时生成新平台
        return highestPlatformY > cameraY - 300;
    }

    generateNextPlatform() {
        // 添加一些随机性到间距
        this.highestPlatformY -= (this.platformSpacing + Math.random() * 30 - 15);
        return this.createPlatform(this.highestPlatformY);
    }
}

class PlatformerGame {
    constructor() {
        console.log('Platformer Game initializing...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Doodle Jump 风格：竖屏画布
        this.canvas.width = 450;
        this.canvas.height = 800;

        // 相机系统 - 只向上移动
        this.camera = {
            y: 0,
            targetY: 0,
            smoothness: 0.08
        };

        // 天空背景配置 - 根据高度变化
        this.skyThemes = [
            { height: 0, name: '黎明', gradient: ['#FFE4B5', '#FFDAB9', '#FFA07A'] },
            { height: 300, name: '清晨', gradient: ['#87CEEB', '#B0E0E6', '#E0F7FA'] },
            { height: 600, name: '白天', gradient: ['#87CEEB', '#ADD8E6', '#E0F7FA'] },
            { height: 1200, name: '黄昏', gradient: ['#FF7E5F', '#FEB47B', '#FFD700'] },
            { height: 1800, name: '日落', gradient: ['#FF6B6B', '#FF8E53', '#FCA5A5'] },
            { height: 2400, name: '傍晚', gradient: ['#4A00E0', '#8E2DE2', '#2C1B4E'] },
            { height: 3000, name: '夜晚', gradient: ['#0f0c29', '#302b63', '#24243e'] },
            { height: 4000, name: '星空', gradient: ['#000000', '#0f0c29', '#1a1a2e'] }
        ];
        this.currentSkyGradient = null;

        // 计分与视觉状态
        this.score = 0;
        this.highScore = Number(localStorage.getItem('oriVsRatHighScore')) || 0;
        this.scorePerSecond = 10;
        this.startTime = null;
        this.endTime = null;
        this.lastScoreTimestamp = null;
        this.maxLevelReached = 0;
        this.scorePopups = [];
        this.scoreFinalized = false;
        this.lastSkyTheme = null;  // 记录上次的天空主题
        this.ambientParticles = this.createAmbientParticles(36);
        this.difficulty = {
            level: 1,
            obstacleSpawnChance: 0.4,
            obstacleSpeedBoost: 0,
            platformSpeedMultiplier: 1,
            oriSpawnChance: 0.15,
            oriSpeedMultiplier: 1
 };
        // Doodle Jump：无尽模式，无出口

        // 游戏状态
        this.gameStarted = false;  // 添加游戏开始状态
        this.gameOver = false;
        this.obstacleInterval = null;
        this.imagesLoaded = false;  // 添加图片加载状态

        // 添加标题图片
        this.titleImages = {
            ori: new Image(),
            rat: new Image()
        };

        // 计数器跟踪加载的图片数量
        let loadedImages = 0;
        const totalImages = Object.keys(this.titleImages).length;

        // 为每个图片添加加载事件
        Object.values(this.titleImages).forEach(img => {
            img.onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    this.imagesLoaded = true;
                    this.showStartScreen();  // 所有图片加载完成后显示开始界面
                    console.log('All title images loaded successfully');
                }
            };
            img.onerror = (e) => {
                console.error('Error loading image:', e);
            };
        });

        // 设置图片源
        this.titleImages.ori.src = './images/ori.jpeg';
        this.titleImages.rat.src = './images/rat.jpeg';

        // 添加按钮状态
        this.startButton = {
            isPressed: false,
            pressStartTime: 0,
            pressDuration: 300  // 按压动画持续300ms
        };

        // 初始化合成音效（Web Audio）
        this.audioCtx = null;
        this.soundEnabled = true;

        this.initAudioContext = () => {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        };

        this.playTone = (config) => {
            if (!this.soundEnabled) return;
            this.initAudioContext();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = config.type || 'sine';
            osc.frequency.setValueAtTime(config.frequency || 440, now);
            if (config.sweep) {
                osc.frequency.exponentialRampToValueAtTime(config.sweep, now + (config.duration || 0.2));
            }

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(config.volume || 0.2, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + (config.duration || 0.2));

            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + (config.duration || 0.2));
        };

        this.playSound = (soundName) => {
            switch (soundName) {
                case 'start':
                    this.playTone({ type: 'triangle', frequency: 440, sweep: 660, duration: 0.35, volume: 0.18 });
                    break;
                case 'poison':
                    this.playTone({ type: 'square', frequency: 260, sweep: 180, duration: 0.25, volume: 0.2 });
                    break;
                case 'hit':
                    this.playTone({ type: 'sawtooth', frequency: 180, sweep: 90, duration: 0.2, volume: 0.22 });
                    break;
                case 'win':
                    this.playTone({ type: 'triangle', frequency: 523.25, sweep: 783.99, duration: 0.45, volume: 0.2 });
                    this.playTone({ type: 'triangle', frequency: 659.25, sweep: 987.77, duration: 0.45, volume: 0.18 });
                    break;
                default:
                    break;
            }
        };

        this.playJumpSound = () => {
            this.playTone({ type: 'sine', frequency: 520, sweep: 880, duration: 0.22, volume: 0.16 });
        };

        // 显示开始界面
        this.showStartScreen();

        // 修改点击事件
        this.canvas.addEventListener('mousedown', (event) => {
            if (!this.gameStarted) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const distance = Math.sqrt(
                    Math.pow(x - this.startButtonBounds.x, 2) +
                    Math.pow(y - this.startButtonBounds.y, 2)
                );

                if (distance <= this.startButtonBounds.radius) {
                    this.startButton.isPressed = true;
                    this.startButton.pressStartTime = Date.now();
                    // 重绘开始界面以显示按压效果
                    this.showStartScreen();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (event) => {
            if (!this.gameStarted && this.startButton.isPressed) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const distance = Math.sqrt(
                    Math.pow(x - this.startButtonBounds.x, 2) +
                    Math.pow(y - this.startButtonBounds.y, 2)
                );

                if (distance <= this.startButtonBounds.radius) {
                    // 等待按压动画完成后开始游戏
                    setTimeout(() => this.startGame(), 
                        Math.max(0, this.startButton.pressDuration - (Date.now() - this.startButton.pressStartTime)));
                }
                this.startButton.isPressed = false;
            }
        });
    }

    // 添加显示开始界面的方法
    showStartScreen() {
        if (!this.imagesLoaded) {
            // 如果图片未加载完成，显示加载中的信息
            this.ctx.fillStyle = '#E0F7FA';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#E0F7FA');
        gradient.addColorStop(1, '#B2EBF2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制装饰性的云朵
        this.drawCloud(100, 100, 80);
        this.drawCloud(400, 200, 100);
        this.drawCloud(700, 150, 90);

        // 绘制圆形开始按钮
        const buttonRadius = 60;
        const buttonX = this.canvas.width / 2;
        const buttonY = this.canvas.height / 2;

        // 绘制Ori和老鼠图片
        const characterSize = 160;  // 增大到2倍
        const spacing = 200;  // 增加间距

        // 绘制Ori（左侧）
        this.drawCircularImage(
            this.titleImages.ori,
            buttonX - spacing - characterSize,
            buttonY - characterSize/2,
            characterSize
        );
        
        // 绘制老鼠（右侧）
        this.drawCircularImage(
            this.titleImages.rat,
            buttonX + spacing,
            buttonY - characterSize/2,
            characterSize
        );

        // 计算按压效果
        let scale = 1;
        let alpha = 1;
        if (this.startButton.isPressed) {
            const elapsed = Date.now() - this.startButton.pressStartTime;
            const progress = Math.min(elapsed / this.startButton.pressDuration, 1);
            scale = 1 - 0.1 * progress;  // 按下时缩小到90%
            alpha = 0.8;  // 按下时降低透明度
        }

        // 外圈光晕效果
        const glowGradient = this.ctx.createRadialGradient(
            buttonX, buttonY, buttonRadius * scale - 10,
            buttonX, buttonY, buttonRadius * scale + 10
        );
        glowGradient.addColorStop(0, `rgba(255, 182, 193, ${0.6 * alpha})`);
        glowGradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(buttonX, buttonY, buttonRadius * scale + 10, 0, Math.PI * 2);
        this.ctx.fill();

        // 按钮主体渐变
        const buttonGradient = this.ctx.createRadialGradient(
            buttonX - buttonRadius * scale/3, 
            buttonY - buttonRadius * scale/3, 
            buttonRadius * scale/4,
            buttonX, buttonY, buttonRadius * scale
        );
        buttonGradient.addColorStop(0, `rgba(255, 182, 193, ${alpha})`);
        buttonGradient.addColorStop(1, `rgba(255, 105, 180, ${alpha})`);

        // 按钮阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = this.startButton.isPressed ? 5 : 10;
        this.ctx.shadowOffsetY = this.startButton.isPressed ? 2 : 5;

        // 绘制圆形按钮
        this.ctx.fillStyle = buttonGradient;
        this.ctx.beginPath();
        this.ctx.arc(buttonX, buttonY, buttonRadius * scale, 0, Math.PI * 2);
        this.ctx.fill();

        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;

        // 按钮文字
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${24 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Start', buttonX, buttonY + 8 * scale);

        // 更新点击检测区域
        this.startButtonBounds = {
            x: buttonX,
            y: buttonY,
            radius: buttonRadius
        };

        // 如果按钮被按下，继续更新动画
        if (this.startButton.isPressed) {
            requestAnimationFrame(() => this.showStartScreen());
        }
    }

    // 添加开始游戏的方法
    startGame() {
        this.gameStarted = true;
        this.playSound('start');

        // 计分初始化
        this.score = 0;
        this.startTime = Date.now();
        this.endTime = null;
        this.lastScoreTimestamp = performance.now();
        this.maxLevelReached = 0;
        this.scorePopups = [];
        this.scoreFinalized = false;
        this.difficulty.level = 1;

        // Doodle Jump：使用无尽平台生成器
        this.platformGenerator = new PlatformGenerator(this.canvas.width, this.canvas.height);
        this.platforms = this.platformGenerator.generateInitialPlatforms();

        // 初始化障碍物 - 调整大小
        this.obstacles = {
            poison: {
                list: [],
                image: new Image(),
                damage: 10
            }
        };
        this.obstacles.poison.image.src = './images/rat poison.png';

        // Doodle Jump：暂时禁用Ori敌人（无尽模式）
        this.oris = [];
        /* 保留原代码供参考
        this.oris = this.platforms.slice(3, 6).map((platform, index) => ({
            x: -80,
            y: platform.y - 60,
            width: 60,
            height: 60,
            speed: 6,
            active: false,
            platform: index + 3,
            image: new Image()
        }));

        // 加载Ori图片
        this.oris.forEach(ori => {
            ori.image.src = './images/ori.jpeg';
        });
        */

        // 初始化老鼠 - Doodle Jump 风格
        this.rat = {
            x: this.canvas.width / 2 - 25,  // 从中间开始
            y: this.canvas.height - 150 - 50,  // 在第一个平台上方
            width: 50,
            height: 50,
            speed: 6,
            bounceStrength: -17,  // Doodle Jump 风格自动弹跳
            velocityY: 0,
            onGround: true,  // 初始在平台上
            health: 100,
            image: new Image()
        };
        this.rat.image.src = './images/rat.jpeg';
        
        // 添加按键状态跟踪（Doodle Jump 只需要左右移动）
        this.keys = {
            ArrowRight: false,
            ArrowLeft: false
        };

        // 设置键盘控制
        this.setupControls();
        
        // 生成初始障碍物
        this.generateObstacles();

        // 开始游戏循环
        this.startGameLoop();

        // Doodle Jump：暂时禁用Ori敌人
        // this.startOriMovement();
    }

    // Doodle Jump：动态管理平台（添加和移除）
    managePlatforms() {
        // 生成新平台
        if (this.platformGenerator.shouldGeneratePlatform(
            this.platformGenerator.highestPlatformY,
            this.camera.y
        )) {
            this.platforms.push(this.platformGenerator.generateNextPlatform());
        }

        // 移除相机下方的平台以优化性能
        const removeThreshold = this.camera.y + this.canvas.height + 100;
        this.platforms = this.platforms.filter(platform => {
            // 检查是否是消失平台
            if (platform.type === 'disappearing' && platform.disappearing) {
                platform.opacity -= 0.03;
                if (platform.opacity <= 0) {
                    return false;
                }
            }
            return platform.y < removeThreshold;
        });
    }

    generateObstacles() {
        // 保存计时器引用
        this.obstacleInterval = setInterval(() => {
            const spawnChance = this.difficulty?.obstacleSpawnChance ?? 0.4;
            if (Math.random() < spawnChance) {  // 动态概率生成老鼠药
                const speedBoost = this.difficulty?.obstacleSpeedBoost ?? 0;
                const obstacle = {
                    x: Math.random() * (this.canvas.width - 50),
                    y: 0,
                    width: 50,
                    height: 50,
                    velocityX: (Math.random() - 0.5) * (5 + speedBoost),
                    velocityY: 3 + Math.random() * (2 + speedBoost)
                };
                this.obstacles.poison.list.push(obstacle);
            }
        }, 500);
    }

    setupControls() {
        // Doodle Jump 只需要左右控制
        this.keydownHandler = (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        };

        this.keyupHandler = (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);

        // Doodle Jump：移动端触摸控制
        this.setupTouchControls();
    }

    setupTouchControls() {
        // 触摸开始
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const tapX = touch.clientX - rect.left;

            // 左侧向左，右侧向右
            if (tapX < this.canvas.width / 2) {
                this.keys.ArrowLeft = true;
                this.keys.ArrowRight = false;
            } else {
                this.keys.ArrowRight = true;
                this.keys.ArrowLeft = false;
            }
        }, { passive: false });

        // 触摸移动
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;

            // 根据手指位置更新方向
            this.keys.ArrowLeft = currentX < this.canvas.width / 2;
            this.keys.ArrowRight = currentX >= this.canvas.width / 2;
        }, { passive: false });

        // 触摸结束
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
        }, { passive: false });

        // 触摸取消
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
        }, { passive: false });
    }

    startGameLoop() {
        if (this.gameStarted) {
        this.updateInterval = setInterval(() => {
            this.updateMovement();
        }, 16);  // 约60fps的更新频率
        this.gameLoop();
        }
    }

    // Doodle Jump 相机系统：只向上移动
    updateCamera() {
        const playerScreenY = this.rat.y - this.camera.y;
        const triggerHeight = this.canvas.height * 0.45;  // 玩家到达屏幕上方45%时相机移动

        if (playerScreenY < triggerHeight) {
            this.camera.targetY = this.rat.y - triggerHeight;
        }

        // 相机只向上移动（y值变小），不向下
        if (this.camera.targetY < this.camera.y) {
            this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothness;
        }
    }

    // 根据高度获取当前天空渐变
    getCurrentSkyGradient() {
        const currentHeight = this.maxLevelReached * 100;  // 转换为像素

        // 找到当前高度对应的天空主题
        for (let i = this.skyThemes.length - 1; i >= 0; i--) {
            if (currentHeight >= this.skyThemes[i].height) {
                return this.skyThemes[i];
            }
        }
        return this.skyThemes[0];  // 默认返回第一个主题
    }

    // 混合两个颜色
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    updateMovement() {
        // Doodle Jump：首先更新相机
        this.updateCamera();

        // 管理平台（动态生成和移除）
        this.managePlatforms();

        // 移除麻痹状态检查，直接进行移动更新
        let onPlatform = false;

        // Doodle Jump 计分：基于高度
        const currentHeight = Math.floor(Math.abs(this.camera.y) / 100);
        if (currentHeight > this.maxLevelReached) {
            const heightBonus = (currentHeight - this.maxLevelReached) * 100;
            this.addScore(heightBonus, this.rat.x + this.rat.width / 2, this.rat.y);
            this.maxLevelReached = currentHeight;

            // 检查是否切换到新的天空主题
            const currentSkyTheme = this.getCurrentSkyGradient();
            if (this.lastSkyTheme !== currentSkyTheme.name) {
                this.lastSkyTheme = currentSkyTheme.name;
                // 显示天空主题变化通知
                this.showSkyThemeNotification(currentSkyTheme);
            }
        }

        // 保持分数增长基于时间
        const now = performance.now();
        if (this.lastScoreTimestamp === null) {
            this.lastScoreTimestamp = now;
        }
        const deltaSeconds = (now - this.lastScoreTimestamp) / 1000;
        this.lastScoreTimestamp = now;
        if (!this.gameOver) {
            this.score += deltaSeconds * 5;  // 降低时间分数，主要靠高度得分
        }
        
        // 更新水平移动
        if (this.keys.ArrowRight) {
            this.rat.x += this.rat.speed;
        }
        if (this.keys.ArrowLeft) {
            this.rat.x -= this.rat.speed;
        }

        // Doodle Jump：应用重力
        this.rat.velocityY += 0.6;  // 稍微降低重力，让跳跃更轻盈
        this.rat.y += this.rat.velocityY;

        // 更新障碍物位置
        Object.keys(this.obstacles).forEach(type => {
            this.obstacles[type].list.forEach((obstacle, index) => {
                obstacle.x += obstacle.velocityX;
                obstacle.y += obstacle.velocityY;

                // 检查与老鼠的碰撞
                if (this.checkCollision(this.rat, obstacle)) {
                    this.playSound('poison');
                    this.rat.health -= this.obstacles[type].damage;
                    this.addScore(-20, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

                    if (this.rat.health <= 0) {
                        console.log('Game Over!');
                        this.gameOver = true;
                        clearInterval(this.updateInterval);
                        clearInterval(this.obstacleInterval);
                        this.obstacles.poison.list = [];
                        this.finalizeScore('lose');
                    }
                    
                    // 移除碰撞的障碍物
                    this.obstacles[type].list.splice(index, 1);
                }

                // 移除超出屏幕的障碍物
                if (obstacle.y > this.canvas.height) {
                    this.obstacles[type].list.splice(index, 1);
                }
            });
        });

        // 更新难度
        this.updateDifficulty();

        // 更新平台位置
        this.platforms.forEach(platform => {
            const speedMultiplier = this.difficulty?.platformSpeedMultiplier ?? 1;
            platform.x += platform.velocityX * speedMultiplier;
            if (platform.x < 0 || platform.x + platform.width > this.canvas.width) {
                platform.velocityX *= -1;
            }
        });

        // 重置onGround状态
        this.rat.onGround = false;

        // 检查平台碰撞 - Doodle Jump 自动弹跳
        this.platforms.forEach((platform, index) => {
            if (this.checkCollision(this.rat, platform)) {
                // 只有当老鼠从上方落下时才能弹跳
                const ratBottom = this.rat.y + this.rat.height;
                const ratPrevBottom = ratBottom - this.rat.velocityY;
                const platformTop = platform.y;

                if (this.rat.velocityY >= 0 && ratPrevBottom <= platformTop + 10) {
                    // 处理消失平台
                    if (platform.type === 'disappearing' && !platform.disappearing) {
                        platform.disappearing = true;
                    }

                    // Doodle Jump：自动弹跳！
                    this.rat.y = platform.y - this.rat.height;
                    this.rat.velocityY = this.rat.bounceStrength;
                    this.playJumpSound();

                    // 只在非移动状态下跟随平台移动
                    if (!this.keys.ArrowRight && !this.keys.ArrowLeft) {
                        this.rat.x += platform.velocityX;
                    }
                }
            }
        });

        // 更新Ori的位置（暂时保留，稍后可能移除）
        this.oris.forEach(ori => {
            if (ori.active) {
                const speedMultiplier = this.difficulty?.oriSpeedMultiplier ?? 1;
                ori.x += ori.speed * speedMultiplier;
                
                // 检查与老鼠的碰撞
                if (this.checkCollision(this.rat, ori)) {
                    this.playSound('hit');
                    this.addScore(-15, this.rat.x + this.rat.width / 2, this.rat.y);
                    // 给老鼠一个水平推力和向上的力
                    if (ori.x < this.rat.x) {
                        this.rat.x += 50;  // 减小水平推力
                        this.rat.velocityY = -2;  // 减小向上的力
                    } else {
                        this.rat.x -= 50;  // 减小水平推力
                        this.rat.velocityY = -2;  // 减小向上的力
                    }
                    
                    // 确保老鼠不会被推到最后一级台阶
                    const finalPlatformY = this.platforms[6].y;  // 最后一级台阶的Y坐标
                    if (this.rat.y < finalPlatformY) {
                        this.rat.y = finalPlatformY + 50;  // 确保老鼠在最后一级台阶下方
                    }
                    
                    this.rat.onGround = false;  // 确保老鼠会开始下落
                }

                // 如果Ori到达屏幕右侧，重置状态
                if (ori.x > this.canvas.width) {
                    ori.active = false;
                }

                // 更新Ori的Y坐标以跟随平台
                ori.y = this.platforms[ori.platform].y - ori.height;
            }
        });

        // Doodle Jump 边界处理
        // 左右穿越：从左边出去会从右边出来
        if (this.rat.x + this.rat.width < 0) {
            this.rat.x = this.canvas.width;
        } else if (this.rat.x > this.canvas.width) {
            this.rat.x = -this.rat.width;
        }

        // 掉落死亡：掉出屏幕底部（考虑相机偏移）
        if (this.rat.y > this.camera.y + this.canvas.height + 50) {
            console.log('Game Over - fell off screen!');
            this.gameOver = true;
            clearInterval(this.updateInterval);
            clearInterval(this.obstacleInterval);
            this.obstacles.poison.list = [];
            this.finalizeScore('lose');
        }

        // Doodle Jump：无胜利条件，无尽模式
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    gameLoop() {
        if (this.gameStarted) {
        this.draw();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    // 添加圆形绘制函数
    drawCircularImage(image, x, y, size) {
        this.ctx.save();
        this.ctx.beginPath();
        const radius = size / 2;
        const centerX = x + radius;
        const centerY = y + radius;
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(image, x, y, size, size);
        this.ctx.restore();
    }

    createAmbientParticles(count) {
        return Array.from({ length: count }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: 1 + Math.random() * 2.5,
            speed: 0.2 + Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.3,
            alpha: 0.2 + Math.random() * 0.5
        }));
    }

    updateAmbientParticles() {
        this.ambientParticles.forEach(particle => {
            particle.y -= particle.speed;
            particle.x += particle.drift;

            if (particle.y < -10) {
                particle.y = this.canvas.height + 10;
                particle.x = Math.random() * this.canvas.width;
            }

            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
        });
    }

    drawAmbientParticles() {
        this.ctx.save();
        this.ambientParticles.forEach(particle => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    addScore(points, x = this.rat.x + this.rat.width / 2, y = this.rat.y) {
        if (!Number.isFinite(points) || points === 0) return;
        this.score = Math.max(0, this.score + points);
        this.scorePopups.push({
            x,
            y,
            text: points > 0 ? `+${Math.round(points)}` : `${Math.round(points)}`,
            life: 60,
            alpha: 1,
            color: points > 0 ? '#4CAF50' : '#E53935'
        });
    }

    updateHighScore() {
        const current = Math.floor(this.score);
        if (current > this.highScore) {
            this.highScore = current;
            localStorage.setItem('oriVsRatHighScore', String(current));
        }
    }

    finalizeScore(result) {
        if (this.scoreFinalized) return;
        this.scoreFinalized = true;
        this.endTime = Date.now();

        // Doodle Jump：无尽模式只有失败，没有胜利
        // 健康奖励（如果有剩余血量）
        const healthBonus = Math.floor(this.rat.health * 2);
        if (healthBonus > 0) {
            this.addScore(healthBonus, this.rat.x + this.rat.width / 2, this.rat.y);
        }

        this.updateHighScore();
    }

    drawScoreHUD() {
        const padding = 14;
        const panelWidth = 180;
        const panelHeight = 85;
        const x = padding;
        const y = padding;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, panelWidth, panelHeight, 14);
        this.ctx.fill();
        this.ctx.stroke();

        const scoreValue = Math.floor(this.score);
        const heightValue = this.maxLevelReached;
        const skyTheme = this.getCurrentSkyGradient();

        this.ctx.fillStyle = '#2b2f33';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${scoreValue}`, x + 14, y + 26);

        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Best: ${this.highScore}`, x + 14, y + 48);
        this.ctx.fillText(`Height: ${heightValue}m`, x + 100, y + 48);

        // 显示当前时间/天空主题
        this.ctx.fillStyle = skyTheme.gradient[2] === '#1a1a2e' ? '#888' : '#666';
        this.ctx.font = 'bold 13px Arial';
        this.ctx.fillText(`🌅 ${skyTheme.name}`, x + 14, y + 70);
        this.ctx.restore();
    }

    drawScorePopups() {
        this.scorePopups = this.scorePopups.filter(popup => popup.life > 0);
        this.scorePopups.forEach(popup => {
            if (popup.isNotification) {
                // 通知样式：居中显示，更大字体
                popup.life -= 1;
                popup.alpha = Math.max(0, popup.alpha - 0.008);

                this.ctx.save();
                this.ctx.globalAlpha = popup.alpha;
                this.ctx.fillStyle = popup.color;
                this.ctx.font = `bold ${popup.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                // 添加发光效果
                this.ctx.shadowColor = popup.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillText(popup.text, popup.x, popup.y);
                this.ctx.restore();
            } else {
                // 普通分数弹窗
                popup.y -= 0.6;
                popup.life -= 1;
                popup.alpha = Math.max(0, popup.alpha - 0.02);

                this.ctx.save();
                this.ctx.globalAlpha = popup.alpha;
                this.ctx.fillStyle = popup.color;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                // 应用相机偏移
                this.ctx.fillText(popup.text, popup.x, popup.y - this.camera.y);
                this.ctx.restore();
            }
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    draw() {
        // Doodle Jump：绘制动态天空背景
        const skyTheme = this.getCurrentSkyGradient();
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, skyTheme.gradient[0]);
        gradient.addColorStop(0.5, skyTheme.gradient[1]);
        gradient.addColorStop(1, skyTheme.gradient[2]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 环境粒子
        this.updateAmbientParticles();
        this.drawAmbientParticles();

        // Doodle Jump：根据时间阶段绘制装饰
        if (skyTheme.name === '星空') {
            // 星空模式：绘制星星
            this.drawStars();
        } else {
            // 其他模式：绘制云朵
            this.drawCloud(100, 100, 80);
            this.drawCloud(400, 200, 100);
            this.drawCloud(700, 150, 90);
        }

        // 轻微暗角提升层次感
        const vignette = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.canvas.height / 3,
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.canvas.height
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制平台（应用相机偏移）
        this.platforms.forEach(platform => {
            const screenY = platform.y - this.camera.y;
            // 只绘制屏幕内的平台
            if (screenY > -50 && screenY < this.canvas.height + 50) {
                // Doodle Jump：应用透明度（用于消失平台）
                if (platform.opacity !== null) {
                    this.ctx.globalAlpha = platform.opacity;
                }

                // 添加平台阴影
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowOffsetY = 4;
            
            // 绘制圆角矩形平台
            this.ctx.beginPath();
            this.ctx.roundRect(
                platform.x,
                screenY,
                platform.width,
                platform.height,
                platform.borderRadius
            );

            // 创建渐变填充
            const gradient = this.ctx.createLinearGradient(
                platform.x,
                screenY,
                platform.x,
                screenY + platform.height
            );

            if (platform.isSpecial) {
                // 为最终平台创建特殊的渐变效果
                gradient.addColorStop(0, '#FF69B4');  // 明亮的粉色
                gradient.addColorStop(0.5, '#FFB6C1'); // 浅粉色
                gradient.addColorStop(1, '#FF69B4');  // 明亮的粉色

                // 添加星星装饰
                for (let i = 0; i < 10; i++) {
                    const starX = platform.x + (platform.width / 10) * i + 20;
                    const starY = screenY + platform.height / 2;
                    this.drawStar(starX, starY, 8, '#FFD700');
                }
            } else if (platform.type === 'disappearing') {
                // Doodle Jump：消失平台样式
                gradient.addColorStop(0, '#FFA07A');  // 浅橙色
                gradient.addColorStop(1, '#CD5C5C');  // IndianRed
            } else if (platform.type === 'moving') {
                // Doodle Jump：移动平台样式
                gradient.addColorStop(0, '#DDA0DD');  // 梅红色
                gradient.addColorStop(1, '#BA55D3');  // MediumOrchid
            } else {
                gradient.addColorStop(0, platform.color);
                gradient.addColorStop(1, this.adjustColor(platform.color, -20));
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // 添加高光效果
            this.ctx.beginPath();
            this.ctx.roundRect(
                platform.x + 2,
                screenY + 2,
                platform.width - 4,
                platform.height / 3,
                platform.borderRadius
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fill();

            // 重置阴影和透明度
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.globalAlpha = 1;
            }
        });

        // 绘制障碍物（圆形）- 应用相机偏移
        Object.keys(this.obstacles).forEach(type => {
            this.obstacles[type].list.forEach(obstacle => {
                const screenY = obstacle.y - this.camera.y;
                if (screenY > -50 && screenY < this.canvas.height + 50) {
                    this.drawCircularImage(
                        this.obstacles[type].image,
                        obstacle.x,
                        screenY,
                        obstacle.width
                    );
                }
            });
        });

        // Doodle Jump：暂不绘制出口（无尽模式）
        // this.drawCircularImage(
        //     this.exit.image,
        //     this.exit.x,
        //     this.exit.y - this.camera.y,
        //     this.exit.width
        // );

        // 绘制老鼠（圆形）- 应用相机偏移
        this.drawCircularImage(
            this.rat.image,
            this.rat.x,
            this.rat.y - this.camera.y,
            this.rat.width
        );

        // 绘制Ori - 应用相机偏移
        this.oris.forEach(ori => {
            if (ori.active) {
                this.drawCircularImage(
                    ori.image,
                    ori.x,
                    ori.y - this.camera.y,
                    ori.width
                );
            }
        });

        // 绘制血条
        this.drawHealthBar();

        // Doodle Jump：绘制触摸控制指示器
        this.drawTouchControls();

        // 绘制分数HUD与得分浮动
        this.drawScoreHUD();
        this.drawScorePopups();

        // Doodle Jump：无尽模式只有游戏结束
        if (this.gameOver) {
            this.showEndMessage('Game Over!');
        }
    }

    drawHealthBar() {
        const barWidth = 80;
        const barHeight = 8;
        const padding = 5;

        const x = this.rat.x + (this.rat.width - barWidth) / 2;
        const y = this.rat.y - this.camera.y - barHeight - padding;

        // 绘制圆角血条背景
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, barHeight/2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
        
        // 绘制圆角当前血量
        const healthWidth = (this.rat.health / 100) * (barWidth - 4);
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, healthWidth, barHeight - 4, (barHeight-4)/2);
        
        // 根据血量设置渐变色
        let gradient;
        if (this.rat.health > 60) {
            gradient = this.ctx.createLinearGradient(x, y, x + healthWidth, y);
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#8BC34A');
        } else if (this.rat.health > 30) {
            gradient = this.ctx.createLinearGradient(x, y, x + healthWidth, y);
            gradient.addColorStop(0, '#FFC107');
            gradient.addColorStop(1, '#FFE082');
        } else {
            gradient = this.ctx.createLinearGradient(x, y, x + healthWidth, y);
            gradient.addColorStop(0, '#f44336');
            gradient.addColorStop(1, '#ef9a9a');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 添加心形图标
        const heartSize = barHeight;
        this.ctx.fillStyle = '#FF69B4';
        this.drawHeart(x - heartSize - 2, y, heartSize);

        // 添加血量百分比文字
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.ceil(this.rat.health)}%`, 
                         x + barWidth / 2, 
                         y + barHeight / 2 + 4);
    }

    // 添加绘制心形的方法
    drawHeart(x, y, size) {
        this.ctx.save();
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        
        // 绘制心形
        this.ctx.moveTo(x + size/2, y + size);
        // 左边曲线
        this.ctx.bezierCurveTo(
            x, y + size * 0.7,    // 控制点1
            x, y + topCurveHeight,  // 控制点2
            x + size/2, y          // 终点
        );
        // 右边曲线
        this.ctx.bezierCurveTo(
            x + size, y + topCurveHeight,  // 控制点1
            x + size, y + size * 0.7,    // 控制点2
            x + size/2, y + size        // 终点
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // Doodle Jump：绘制触摸控制指示器
    drawTouchControls() {
        // 只在触摸设备上显示
        if (!('ontouchstart' in window)) return;

        const alpha = 0.25;
        const radius = 45;
        const bottomOffset = 70;

        // 左侧控制指示器
        if (this.keys.ArrowLeft) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(radius + 25, this.canvas.height - bottomOffset, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 箭头图标
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('←', radius + 25, this.canvas.height - bottomOffset);
            this.ctx.restore();
        }

        // 右侧控制指示器
        if (this.keys.ArrowRight) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width - radius - 25, this.canvas.height - bottomOffset, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 箭头图标
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('→', this.canvas.width - radius - 25, this.canvas.height - bottomOffset);
            this.ctx.restore();
        }
    }

    // 添加显示结束消息的方法
    showEndMessage(message) {
        // 半透明黑色背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 显示消息
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Doodle Jump：显示游戏结束消息和高度
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 50);

        // 显示高度信息
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(`You reached ${this.maxLevelReached}m!`, this.canvas.width / 2, this.canvas.height / 2);

        // 显示分数信息
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.fillText(`Best: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 63);

        // 绘制重玩按钮
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height / 2 + 70;

        // 绘制按钮背景
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
        this.ctx.fill();
        
        // 绘制按钮文字
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Replay', this.canvas.width / 2, buttonY + buttonHeight / 2);

        // 如果还没有添加点击事件监听器，则添加
        if (!this.replayButtonAdded) {
            this.canvas.addEventListener('click', (event) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                // 检查点击是否在按钮范围内
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight &&
                    this.gameOver) {
                    // 清除所有定时器
                    clearInterval(this.updateInterval);
                    clearInterval(this.obstacleInterval);
                    
                    // 移除所有事件监听器
                    document.removeEventListener('keydown', this.keydownHandler);
                    document.removeEventListener('keyup', this.keyupHandler);
                    
                    // 重置游戏状态
                    this.gameStarted = false;
                    this.gameOver = false;
                    
                    // 创建新的游戏实例
                    const game = new PlatformerGame();
                    // 显示开始界面
                    game.showStartScreen();
                }
            });
            this.replayButtonAdded = true;
        }
    }

    // 添加Ori移动控制方法
    startOriMovement() {
        setInterval(() => {
            // 随机选择一个未激活的Ori
            const inactiveOris = this.oris.filter(ori => !ori.active);
            const spawnChance = this.difficulty?.oriSpawnChance ?? 0.15;
            if (inactiveOris.length > 0 && Math.random() < spawnChance) {  // 动态概率
                const ori = inactiveOris[Math.floor(Math.random() * inactiveOris.length)];
                ori.active = true;
                ori.x = -100;  // 从屏幕左侧开始
            }
        }, 1000);  // 增加到1000ms检查一次（原来是500ms）
    }

    updateDifficulty() {
        if (this.gameOver) return;
        // Doodle Jump：基于高度的难度缩放
        const height = this.maxLevelReached;
        const level = Math.min(10, 1 + Math.floor(height / 50));

        this.difficulty.level = level;
        this.difficulty.obstacleSpawnChance = Math.min(0.6, 0.3 + level * 0.03);
        this.difficulty.obstacleSpeedBoost = Math.min(3, level * 0.3);
        this.difficulty.platformSpeedMultiplier = Math.min(2.0, 1 + level * 0.1);
        this.difficulty.oriSpawnChance = Math.min(0.3, 0.1 + level * 0.02);
        this.difficulty.oriSpeedMultiplier = Math.min(1.8, 1 + level * 0.08);
    }

    // 添加辅助方法来调整颜色亮度
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(Math.min(parseInt(hex.substring(0, 2), 16) + amount, 255), 0);
        const g = Math.max(Math.min(parseInt(hex.substring(2, 4), 16) + amount, 255), 0);
        const b = Math.max(Math.min(parseInt(hex.substring(4, 6), 16) + amount, 255), 0);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // 添加绘制云朵的方法
    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size/3, 0, Math.PI * 2);
        this.ctx.arc(x + size/3, y - size/4, size/3, 0, Math.PI * 2);
        this.ctx.arc(x + size/1.5, y, size/3, 0, Math.PI * 2);
        this.ctx.arc(x + size/3, y + size/4, size/3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 添加绘制星星的方法
    drawStar(cx, cy, size, color) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = color;

        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * size;
            const y = cy + Math.sin(angle) * size;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // Doodle Jump：绘制星空背景
    drawStars() {
        const starCount = 50;
        // 使用固定的种子生成星星位置，确保星星位置稳定
        if (!this.starPositions) {
            this.starPositions = [];
            for (let i = 0; i < starCount; i++) {
                this.starPositions.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: 1 + Math.random() * 2,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        }

        this.starPositions.forEach((star, index) => {
            star.twinkle += 0.05;
            const alpha = 0.5 + Math.sin(star.twinkle) * 0.5;

            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // 显示天空主题变化通知
    showSkyThemeNotification(skyTheme) {
        const emoji = {
            '黎明': '🌅',
            '清晨': '🌄',
            '白天': '☀️',
            '黄昏': '🌆',
            '日落': '🌇',
            '傍晚': '🌆',
            '夜晚': '🌙',
            '星空': '✨'
        }[skyTheme.name] || '🌈';

        this.scorePopups.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 3,
            text: `${emoji} ${skyTheme.name}`,
            life: 120,  // 显示更长时间
            alpha: 1,
            color: '#FFD700',
            size: 28,
            isNotification: true
        });
    }
}

// 当页面加载完成后启动游戏
window.onload = () => {
    new PlatformerGame();
}; 