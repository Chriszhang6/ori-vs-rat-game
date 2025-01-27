class PlatformerGame {
    constructor() {
        console.log('Platformer Game initializing...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.canvas.width = 1000;
        this.canvas.height = 800;
        
        // 游戏状态
        this.gameStarted = false;  // 添加游戏开始状态
        this.gameWon = false;
        this.gameOver = false;
        this.obstacleInterval = null;
        this.soundsLoaded = false;  // 添加音频加载状态

        // 添加标题图片
        this.titleImages = {
            ori: new Image(),
            vs: new Image(),
            rat: new Image()
        };
        this.titleImages.ori.src = './images/ori.jpeg';
        this.titleImages.vs.src = './images/vs.png';  // 需要添加一个vs图片
        this.titleImages.rat.src = './images/rat.jpeg';

        // 添加按钮状态
        this.startButton = {
            isPressed: false,
            pressStartTime: 0,
            pressDuration: 300  // 按压动画持续300ms
        };

        // 初始化音效
        this.sounds = {
            start: new Audio('../sounds/game_start.wav'),
            jump: new Audio('../sounds/mouse_jump.wav'),
            poison: new Audio('../sounds/mouse_hurt.wav'),
            hit: new Audio('../sounds/tom_hit.wav'),
            win: new Audio('../sounds/mouse_win.wav')
        };

        // 添加音频加载错误处理的详细日志
        Object.entries(this.sounds).forEach(([name, sound]) => {
            sound.addEventListener('error', (e) => {
                console.error(`Error loading sound ${name}:`, e);
                console.log('Source:', sound.src);
            });
        });

        // 预加载所有音效
        let loadedSounds = 0;
        const totalSounds = Object.keys(this.sounds).length;
        
        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('canplaythrough', () => {
                loadedSounds++;
                console.log(`Loaded sound ${loadedSounds}/${totalSounds}`);
                if (loadedSounds === totalSounds) {
                    this.soundsLoaded = true;
                    console.log('All sounds loaded successfully');
                }
            });
            sound.addEventListener('error', (e) => {
                console.error('Error loading sound:', e);
            });
            sound.load();
            sound.volume = 0.5;
        });

        // 添加播放音效的方法
        this.playSound = (soundName) => {
            if (this.soundsLoaded && this.sounds[soundName]) {
                try {
                    const sound = this.sounds[soundName];
                    sound.currentTime = 0;
                    sound.play().catch(e => console.error('Error playing sound:', e));
                } catch (e) {
                    console.error('Error playing sound:', e);
                }
            }
        };

        // 添加播放跳跃音效的方法
        this.playJumpSound = () => {
            if (this.soundsLoaded) {
                const sound = this.sounds.jump;
                sound.currentTime = 0;
                sound.play()
                    .then(() => {
                        setTimeout(() => {
                            sound.pause();
                            sound.currentTime = 0;
                        }, 300);  // 减少到300毫秒
                    })
                    .catch(e => console.error('Error playing jump sound:', e));
            }
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
        // 播放开始音效
        this.playSound('start');
        
        // 初始化游戏对象
        this.platforms = this.generatePlatforms();

        // 初始化出口
        this.exit = {
            x: this.canvas.width - 100,
            y: this.canvas.height - 7 * 100 - 100,
            width: 80,
            height: 80,
            image: new Image()
        };
        this.exit.image.src = './images/door.png';

        // 初始化障碍物
        this.obstacles = {
            poison: {
                list: [],
                image: new Image(),
                damage: 10
            }
        };
        this.obstacles.poison.image.src = './images/rat poison.png';

        // 初始化Ori数组
        this.oris = this.platforms.slice(3, 6).map((platform, index) => ({
            x: -100,
            y: platform.y - 80,
            width: 80,
            height: 80,
            speed: 8,
            active: false,
            platform: index + 3,
            image: new Image()
        }));
        
        // 加载Ori图片
        this.oris.forEach(ori => {
            ori.image.src = './images/ori.jpeg';
        });

        // 初始化老鼠
        this.rat = {
            x: 0,
            y: this.canvas.height - 80,
            width: 80,
            height: 80,
            speed: 7,
            jumpStrength: 23,
            velocityY: 0,
            onGround: true,
            health: 100,
            image: new Image()
        };
        this.rat.image.src = './images/rat.jpeg';
        
        // 添加按键状态跟踪
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowRight: false,
            ArrowLeft: false,
            Space: false
        };

        // 设置键盘控制
        this.setupControls();
        
        // 生成初始障碍物
        this.generateObstacles();
        
        // 开始游戏循环
        this.startGameLoop();

        // 开始Ori的随机出现
        this.startOriMovement();
    }

    generatePlatforms() {
        const platforms = [];
        const platformHeight = 25;
        const platformSpacing = 100;
        const shortPlatformWidth = 150;
        
        // 定义可爱的柔和颜色数组
        const platformColors = [
            '#FFB6C1',  // 浅粉红
            '#98FB98',  // 浅绿色
            '#87CEFA',  // 浅蓝色
            '#DDA0DD',  // 梅红色
            '#F0E68C',  // 浅黄色
            '#FFB6C1'   // 浅粉红
        ];

        // 生成6个短平台
        for (let i = 0; i < 6; i++) {
            platforms.push({
                x: Math.random() * (this.canvas.width - shortPlatformWidth),
                y: this.canvas.height - (i + 1) * platformSpacing,
                width: shortPlatformWidth,
                height: platformHeight,
                velocityX: (Math.random() - 0.5) * 3 * 2.5,
                color: platformColors[i],
                borderRadius: 12
            });
        }

        // 添加最后的长平台（第7级）- 特殊设计
        const finalPlatform = {
            x: 0,
            y: this.canvas.height - 7 * platformSpacing,
            width: this.canvas.width,
            height: platformHeight * 1.5,  // 稍微加高
            velocityX: 0,
            color: '#FF69B4',  // 明亮的粉色
            borderRadius: 15,  // 更大的圆角
            isSpecial: true    // 标记为特殊平台
        };
        platforms.push(finalPlatform);

        return platforms;
    }

    generateObstacles() {
        // 保存计时器引用
        this.obstacleInterval = setInterval(() => {
            if (Math.random() < 0.4) {  // 40%的概率生成老鼠药
                const obstacle = {
                    x: Math.random() * (this.canvas.width - 80),
                    y: 0,
                    width: 80,
                    height: 80,
                    velocityX: (Math.random() - 0.5) * 5,
                    velocityY: 3 + Math.random() * 2
                };
                this.obstacles.poison.list.push(obstacle);
            }
        }, 500);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
            if (e.key === ' ') {  // 处理空格字符
                this.keys.Space = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
            if (e.key === ' ') {  // 处理空格字符
                this.keys.Space = false;
            }
        });
    }

    startGameLoop() {
        if (this.gameStarted) {
        this.updateInterval = setInterval(() => {
            this.updateMovement();
        }, 16);  // 约60fps的更新频率
        this.gameLoop();
        }
    }

    updateMovement() {
        // 移除麻痹状态检查，直接进行移动更新
        let onPlatform = false;
        
        // 更新水平移动
        if (this.keys.ArrowRight) {
            this.rat.x += this.rat.speed;
        }
        if (this.keys.ArrowLeft) {
            this.rat.x -= this.rat.speed;
        }

        // 更新垂直移动和跳跃
        if (this.keys.Space && this.rat.onGround) {
            // 只有在真正起跳时才播放音效
            if (this.rat.velocityY >= 0) {  // 确保不是在空中按空格
                this.playJumpSound();  // 使用新的播放方法
                console.log('Space key detected, jumping!');
            }
            this.rat.velocityY = -this.rat.jumpStrength;
            this.rat.onGround = false;
            this.rat.y -= 1;
        }

        // 应用重力
        this.rat.velocityY += 0.7;
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

                    if (this.rat.health <= 0) {
                        console.log('Game Over!');
                        this.gameOver = true;
                        clearInterval(this.updateInterval);
                        clearInterval(this.obstacleInterval);
                        this.obstacles.poison.list = [];
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

        // 更新平台位置
        this.platforms.forEach(platform => {
            platform.x += platform.velocityX;
            if (platform.x < 0 || platform.x + platform.width > this.canvas.width) {
                platform.velocityX *= -1;
            }
        });

        // 重置onGround状态
        this.rat.onGround = false;

        // 检查平台碰撞
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.rat, platform)) {
                // 只有当老鼠从上方落下时才能站在平台上
                const ratBottom = this.rat.y + this.rat.height;
                const ratPrevBottom = ratBottom - this.rat.velocityY;
                const platformTop = platform.y;

                if (this.rat.velocityY >= 0 && ratPrevBottom <= platformTop + 10) {
                    // 从上方落下，停在平台上
                    this.rat.y = platform.y - this.rat.height;
                    this.rat.velocityY = 0;
                    this.rat.onGround = true;
                    
                    // 只在非麻痹状态下跟随平台移动
                    if (!this.keys.ArrowRight && !this.keys.ArrowLeft) {
                        this.rat.x += platform.velocityX;
                    }
                }
            }
        });

        // 限制跳跃高度不超过一级台阶
        const platformSpacing = 100; // 台阶之间的间距
        const maxJumpHeight = platformSpacing + 20; // 允许稍微超过一点以确保能跳上去
        
        // 如果向上速度太大，限制它
        if (this.rat.velocityY < -Math.sqrt(2 * maxJumpHeight)) {
            this.rat.velocityY = -Math.sqrt(2 * maxJumpHeight);
        }

        // 更新Ori的位置
        this.oris.forEach(ori => {
            if (ori.active) {
                ori.x += ori.speed;
                
                // 检查与老鼠的碰撞
                if (this.checkCollision(this.rat, ori)) {
                    this.playSound('hit');
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

        // 限制老鼠在画布内
        if (this.rat.x < 0) this.rat.x = 0;
        if (this.rat.x + this.rat.width > this.canvas.width) this.rat.x = this.canvas.width - this.rat.width;
        if (this.rat.y + this.rat.height > this.canvas.height) {
            this.rat.y = this.canvas.height - this.rat.height;
            this.rat.velocityY = 0;
            this.rat.onGround = true;
        }

        // 检查是否到达出口
        if (this.checkCollision(this.rat, this.exit)) {
            this.playSound('win');
            console.log('You win!');
            this.gameWon = true;
            // 清除所有游戏循环和障碍物生成
            clearInterval(this.updateInterval);
            clearInterval(this.obstacleInterval);
            // 清除所有现有障碍物
            this.obstacles.poison.list = [];
        }
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

    draw() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#E0F7FA');  // 浅蓝色
        gradient.addColorStop(1, '#B2EBF2');  // 更深的浅蓝色
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制装饰性的云朵
        this.drawCloud(100, 100, 80);
        this.drawCloud(400, 200, 100);
        this.drawCloud(700, 150, 90);

        // 绘制平台
        this.platforms.forEach(platform => {
            // 添加平台阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetY = 4;
            
            // 绘制圆角矩形平台
            this.ctx.beginPath();
            this.ctx.roundRect(
                platform.x, 
                platform.y, 
                platform.width, 
                platform.height, 
                platform.borderRadius
            );
            
            // 创建渐变填充
            const gradient = this.ctx.createLinearGradient(
                platform.x, 
                platform.y, 
                platform.x, 
                platform.y + platform.height
            );

            if (platform.isSpecial) {
                // 为最终平台创建特殊的渐变效果
                gradient.addColorStop(0, '#FF69B4');  // 明亮的粉色
                gradient.addColorStop(0.5, '#FFB6C1'); // 浅粉色
                gradient.addColorStop(1, '#FF69B4');  // 明亮的粉色
                
                // 添加星星装饰
                for (let i = 0; i < 10; i++) {
                    const starX = platform.x + (platform.width / 10) * i + 20;
                    const starY = platform.y + platform.height / 2;
                    this.drawStar(starX, starY, 8, '#FFD700');
                }
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
                platform.y + 2, 
                platform.width - 4, 
                platform.height / 3, 
                platform.borderRadius
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fill();

            // 重置阴影
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
        });

        // 绘制障碍物（圆形）
        Object.keys(this.obstacles).forEach(type => {
            this.obstacles[type].list.forEach(obstacle => {
                this.drawCircularImage(
                    this.obstacles[type].image,
                    obstacle.x,
                    obstacle.y,
                    obstacle.width
                );
            });
        });

        // 绘制出口（圆形）
        this.drawCircularImage(
            this.exit.image,
            this.exit.x,
            this.exit.y,
            this.exit.width
        );

        // 绘制老鼠（圆形）
        this.drawCircularImage(
            this.rat.image,
            this.rat.x,
            this.rat.y,
            this.rat.width
        );

        // 绘制Ori
        this.oris.forEach(ori => {
            if (ori.active) {
                this.drawCircularImage(
                    ori.image,
                    ori.x,
                    ori.y,
                    ori.width
                );
            }
        });

        // 绘制血条
        this.drawHealthBar();

        // 如果游戏胜利，显示胜利消息
        if (this.gameWon) {
            this.showEndMessage('Mouse Escaped Successfully!');
        }

        // 如果游戏失败，显示失败消息
        if (this.gameOver) {
            this.showEndMessage('Game Over!');
        }
    }

    drawHealthBar() {
        const barWidth = 100;
        const barHeight = 10;
        const padding = 5;
        
        const x = this.rat.x + (this.rat.width - barWidth) / 2;
        const y = this.rat.y - barHeight - padding;

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
        
        // Display only English message
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);

        // 绘制重玩按钮
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = this.canvas.height / 2 + 50;

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
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
                    (this.gameWon || this.gameOver)) {
                    // 重新开始游戏
                    new PlatformerGame();
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
            if (inactiveOris.length > 0 && Math.random() < 0.15) {  // 降低到15%的概率（原来是30%）
                const ori = inactiveOris[Math.floor(Math.random() * inactiveOris.length)];
                ori.active = true;
                ori.x = -100;  // 从屏幕左侧开始
            }
        }, 1000);  // 增加到1000ms检查一次（原来是500ms）
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
}

// 当页面加载完成后启动游戏
window.onload = () => {
    new PlatformerGame();
}; 