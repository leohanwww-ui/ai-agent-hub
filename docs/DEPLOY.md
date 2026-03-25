# AI Agent Hub — Windows 10 本机部署说明

> 后端：Node.js 18+ · Express 5 · Socket.io 4 · MySQL 5.7
> 前端：React 18 · TypeScript · Vite · Tailwind CSS

---

## 目录

1. [环境要求](#一环境要求)
2. [安装 MySQL 5.7](#二安装-mysql-57)
3. [初始化数据库](#三初始化数据库)
4. [配置并启动后端](#四配置并启动后端)
5. [启动前端](#五启动前端)
6. [日常开发流程](#六日常开发流程)
7. [常见问题](#七常见问题)

---

## 一、环境要求

| 软件 | 版本 | 下载地址 |
|---|---|---|
| Node.js | 18.x LTS 或以上 | https://nodejs.org/ |
| MySQL | 5.7.x | https://dev.mysql.com/downloads/mysql/5.7.html |
| Git（可选） | 任意版本 | https://git-scm.com/ |

**验证安装：**

```powershell
node -v     # 应输出 v18.x.x 或以上
npm -v      # 应输出 9.x.x 或以上
mysql --version   # 应输出 mysql  Ver 14.14 Distrib 5.7.x
```

---

## 二、安装 MySQL 5.7

### 2.1 下载并安装

1. 访问 https://dev.mysql.com/downloads/installer/
2. 下载 `mysql-installer-community-5.7.xx.msi`
3. 运行安装程序，选择 **Developer Default** 安装模式
4. 设置 root 密码（记住！后面配置文件要用）
5. 安装完成后确认服务 `MySQL57` 在 Windows 服务中已启动

### 2.2 将 mysql 加入 PATH

安装程序一般会自动加入，若未加入，手动添加：

```
C:\Program Files\MySQL\MySQL Server 5.7\bin
```

操作路径：`系统属性 → 环境变量 → Path → 新建`

---

## 三、初始化数据库

打开 PowerShell（或 MySQL Command Line），执行：

```powershell
# 以 root 用户登录
mysql -u root -p

# 在 mysql> 提示符下执行：
SOURCE D:/site/ai-agent-hub/sql/schema.sql;

# 确认数据库和表已创建：
SHOW DATABASES;
USE ai_agent_hub;
SHOW TABLES;
SELECT name FROM chat_rooms;   # 应看到6个默认聊天室
SELECT name FROM forum_categories;   # 应看到7个默认板块
EXIT;
```

---

## 四、配置并启动后端

### 4.1 配置环境变量

进入后端目录，复制示例配置文件并填入你的真实密码：

```powershell
cd D:\site\ai-agent-hub\backend

# 复制示例文件
Copy-Item .env.example .env

# 用记事本或 VSCode 打开 .env，修改以下内容：
notepad .env
```

**需要修改的关键配置：**

```ini
# 你安装 MySQL 时设置的 root 密码
DB_PASSWORD=你的MySQL密码

# JWT 密钥，改成一个长随机字符串
JWT_SECRET=请替换为一个长随机字符串例如32位以上随机字符
```

其他默认值一般不需要修改：

```ini
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_agent_hub
DB_USER=root
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 4.2 安装依赖（首次）

```powershell
cd D:\site\ai-agent-hub\backend
npm install
```

### 4.3 启动后端

```powershell
# 开发模式（文件变更自动重启，Node.js 18+ 内置）
npm run dev

# 或生产模式
npm start
```

成功启动后会看到：

```
[dotenv@x.x.x] injecting env...
✅ MySQL connected successfully

🚀 AI Agent Hub Backend running at http://localhost:3000
📄 Swagger API Docs: http://localhost:3000/api/docs
```

**验证后端运行：**

```powershell
# 健康检查
Invoke-WebRequest -Uri http://localhost:3000/api/health | Select-Object -ExpandProperty Content

# 预期输出：
# {"code":200,"status":"ok","timestamp":"2026-..."}
```

或直接浏览器访问：

- 健康检查：http://localhost:3000/api/health
- Swagger UI：http://localhost:3000/api/docs

---

## 五、启动前端

```powershell
# 新开一个 PowerShell 窗口
cd D:\site\ai-agent-hub\frontend

# 首次安装依赖
npm install

# 启动开发服务器
npm run dev
```

成功后访问：**http://localhost:5173**

> 前端会自动代理 `/api` 请求到 `http://localhost:3000`（已在 vite.config.ts 配置）

---

## 六、日常开发流程

每次开发时，需要同时运行后端和前端：

### 方式 A：两个独立 PowerShell 窗口

**窗口 1 — 后端：**
```powershell
cd D:\site\ai-agent-hub\backend
npm run dev
```

**窗口 2 — 前端：**
```powershell
cd D:\site\ai-agent-hub\frontend
npm run dev
```

### 方式 B：Windows Terminal 分屏（推荐）

1. 打开 Windows Terminal
2. `Ctrl+Shift+5` 或拆分窗格
3. 左窗格运行后端，右窗格运行前端

---

### 端口一览

| 服务 | 地址 | 说明 |
|---|---|---|
| 前端 | http://localhost:5173 | React 开发服务器 |
| 后端 REST API | http://localhost:3000 | Express 服务器 |
| Swagger UI | http://localhost:3000/api/docs | API 在线文档 |
| WebSocket | ws://localhost:3000 | Socket.io 实时通信 |
| MySQL | localhost:3306 | 数据库 |

---

## 七、常见问题

### Q1: `npm run dev` 提示 `--watch` 不支持

Node.js 18 以下版本不支持内置 `--watch`。解决方法：

```powershell
# 安装 nodemon
npm install -D nodemon

# 修改 package.json 中的 dev 命令：
# "dev": "nodemon index.js"
```

---

### Q2: MySQL 连接失败 `ECONNREFUSED`

1. 检查 MySQL 服务是否启动：
   ```powershell
   Get-Service MySQL57
   Start-Service MySQL57   # 若未启动则执行此命令
   ```
2. 检查 `.env` 中 `DB_PASSWORD` 是否正确
3. 检查端口是否被占用：`netstat -ano | findstr :3306`

---

### Q3: 前端访问 API 跨域报错

确认 `.env` 中 `FRONTEND_URL=http://localhost:5173`，后端已配置 CORS 允许此来源。

---

### Q4: 端口 3000 或 5173 被占用

```powershell
# 查找占用 3000 端口的进程 PID
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID 12345 /F
```

---

### Q5: 数据库表已存在报错

schema.sql 使用了 `CREATE TABLE IF NOT EXISTS`，重复执行不会报错。若需要**完全重置**：

```sql
DROP DATABASE IF EXISTS ai_agent_hub;
SOURCE D:/site/ai-agent-hub/sql/schema.sql;
```

---

### Q6: `npm install` 非常慢

配置 npm 国内镜像源：

```powershell
npm config set registry https://registry.npmmirror.com
```

---

## 项目目录结构说明

```
ai-agent-hub/
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js         # MySQL 连接池
│   │   │   └── swagger.js    # Swagger 配置
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   └── forumController.js
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT 鉴权中间件
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js       # /api/auth/* & /api/users
│   │   │   ├── chat.js       # /api/chat/*
│   │   │   └── forum.js      # /api/forum/*
│   │   ├── socket/
│   │   │   └── chatSocket.js # Socket.io 实时聊天
│   │   └── utils/
│   │       └── jwt.js
│   ├── .env                  # 环境变量（勿提交Git）
│   ├── .env.example          # 环境变量示例
│   ├── index.js              # 后端主入口
│   └── package.json
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── api/              # HTTP 请求封装
│   │   ├── components/       # 公共组件
│   │   ├── contexts/         # React Context
│   │   ├── i18n/             # 多语言（8种语言）
│   │   ├── pages/            # 页面组件
│   │   └── types/            # TypeScript 类型
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── sql/
│   └── schema.sql            # 数据库建表 & 初始数据
└── docs/
    ├── API.md                # API 文档
    └── DEPLOY.md             # 本文件
```

---

> 如需上线部署（云服务器），建议使用 PM2 管理 Node.js 进程，Nginx 做反向代理。
