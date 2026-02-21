#!/bin/bash

# Local deployment script for testing Docker setup
# Usage: ./scripts/deploy-local.sh

set -e

echo "🚀 FinDash Local Deployment"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production not found!${NC}"
    echo "Please copy .env.production.example to .env.production and fill in the values"
    exit 1
fi

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

echo -e "\n${YELLOW}🏗️  Building application...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build completed${NC}"

echo -e "\n${YELLOW}🐳 Building Docker image...${NC}"
docker-compose build --no-cache || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "\n${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}"

echo -e "\n${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d || {
    echo -e "${RED}❌ Container startup failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Services started${NC}"

echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check database
echo -n "Checking database... "
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U findash_user &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC}"
        echo -e "${RED}❌ Database failed to start${NC}"
        docker-compose logs postgres
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Check Redis
echo -n "Checking Redis... "
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC}"
        echo -e "${RED}❌ Redis failed to start${NC}"
        docker-compose logs redis
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Check application
echo -n "Checking application... "
for i in {1..30}; do
    if docker-compose exec -T app curl -f http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC}"
        echo -e "${RED}❌ Application failed to start${NC}"
        docker-compose logs app
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo -e "\n${GREEN}=================================="
echo "✅ Deployment completed successfully!"
echo "===================================${NC}"
echo ""
echo "🔗 Application URLs:"
echo "   - HTTP:  http://localhost"
echo "   - HTTPS: https://localhost (with self-signed cert)"
echo ""
echo "📊 Services:"
echo "   - Next.js App: http://localhost:3000"
echo "   - PostgreSQL:  localhost:5432"
echo "   - Redis:       localhost:6379"
echo "   - Nginx:       localhost:80/443"
echo ""
echo "🔍 Useful commands:"
echo "   - View logs:   docker-compose logs -f app"
echo "   - Bash shell:  docker-compose exec app sh"
echo "   - psql:        docker-compose exec postgres psql -U findash_user -d findash"
echo "   - Redis CLI:   docker-compose exec redis redis-cli"
echo "   - Stop:        docker-compose down"
echo ""
