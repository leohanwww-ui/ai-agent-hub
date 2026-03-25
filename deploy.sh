#!/bin/bash
# ═══════════════════════════════════════════
#  AI Agent Hub - Oracle Cloud 一键部署脚本
#  适用于 Ubuntu 22.04/24.04 ARM 实例
# ═══════════════════════════════════════════
set -e

echo "=========================================="
echo "  AI Agent Hub 部署脚本"
echo "  Oracle Cloud ARM Instance"
echo "=========================================="

# ── 颜色 ───────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 1. 检查 root 权限 ──────────────────────
[ "$(id -u)" -eq 0 ] || error "请用 root 运行: sudo bash deploy.sh"

# ── 2. 安装 Docker ─────────────────────────
if ! command -v docker &>/dev/null; then
    info "安装 Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    info "Docker 安装完成: $(docker --version)"
else
    info "Docker 已安装: $(docker --version)"
fi

# ── 3. 安装 Git ────────────────────────────
if ! command -v git &>/dev/null; then
    info "安装 Git..."
    apt-get install -y -qq git
fi

# ── 4. 防火墙放行端口 ─────────────────────
info "配置防火墙..."
if command -v ufw &>/dev/null; then
    ufw allow 80/tcp    comment 'HTTP - Frontend'
    ufw allow 443/tcp   comment 'HTTPS - Frontend'
    ufw allow 22/tcp    comment 'SSH'
    ufw --force enable
fi
warn "Oracle Cloud 控制台还需在「子网安全列表」中放行 80/443 端口！"

# ── 5. 配置环境变量 ────────────────────────
ENV_FILE="$(dirname "$0")/.env.deploy"

if [ ! -f "$ENV_FILE" ]; then
    info "生成环境变量文件..."
    cat > "$ENV_FILE" <<'ENVFILE'
# ── AI Agent Hub 部署环境变量 ─────────────
# 生成随机密码
MYSQL_ROOT_PASSWORD=
DB_PASSWORD=
JWT_SECRET=
FRONTEND_URL=
ENVFILE

    # 生成随机密码
    MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
    DB_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 48)
    FRONTEND_URL="http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost')"

    sed -i "s/^MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD/" "$ENV_FILE"
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" "$ENV_FILE"

    info "已生成 .env.deploy（随机密码和密钥）"
    info "访问地址: $FRONTEND_URL"
fi

# ── 6. 构建并启动 ─────────────────────────
info "构建 Docker 镜像（首次约需 3-5 分钟）..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

docker compose -f "$(dirname "$0")/docker-compose.yml" --env-file "$ENV_FILE" up -d --build

# ── 7. 等待服务就绪 ───────────────────────
info "等待服务启动..."
sleep 10

# 检查容器状态
if docker compose -f "$(dirname "$0")/docker-compose.yml" ps | grep -q "unhealthy\|Exit"; then
    warn "部分容器未正常启动，查看日志:"
    docker compose -f "$(dirname "$0")/docker-compose.yml" logs --tail=30
else
    info "所有容器运行正常 ✅"
fi

# ── 8. 完成 ────────────────────────────────
IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "  访问地址: http://$IP"
echo ""
echo "  常用命令:"
echo "    查看状态: docker compose ps"
echo "    查看日志: docker compose logs -f"
echo "    重启服务: docker compose restart"
echo "    停止服务: docker compose down"
echo ""
echo "  数据库密码保存在: $ENV_FILE"
echo "  请妥善保管此文件！"
echo ""
echo -e "${YELLOW}⚠  Oracle Cloud 安全列表记得放行 80/443 端口${NC}"
echo "=========================================="
