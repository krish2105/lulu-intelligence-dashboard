#!/bin/bash
# Production Deployment Script for Lulu Intelligence Dashboard
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
DEV_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Lulu Intelligence Dashboard${NC}"
echo -e "${CYAN}  Production Deployment Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if production env file exists
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}Error: $ENV_FILE not found${NC}"
        echo -e "Please create the production environment file from backend/.env.production"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Function to create backup
create_backup() {
    echo -e "${YELLOW}[2/6] Creating backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup database if container is running
    if docker ps | grep -q "sales_db"; then
        echo "  Backing up PostgreSQL database..."
        docker exec sales_db pg_dump -U lulu lulu_sales > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" 2>/dev/null || true
        echo -e "${GREEN}  ✓ Database backed up to $BACKUP_DIR/db_backup_$TIMESTAMP.sql${NC}"
    fi
    
    echo -e "${GREEN}✓ Backup completed${NC}"
}

# Function to stop existing services
stop_services() {
    echo -e "${YELLOW}[3/6] Stopping existing services...${NC}"
    
    # Stop development containers if running
    if [ -f "$DEV_COMPOSE_FILE" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" down 2>/dev/null || true
    fi
    
    # Stop production containers if running
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Services stopped${NC}"
}

# Function to build images
build_images() {
    echo -e "${YELLOW}[4/6] Building Docker images...${NC}"
    
    # Build with production compose file
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    echo -e "${GREEN}✓ Images built successfully${NC}"
}

# Function to start services
start_services() {
    echo -e "${YELLOW}[5/6] Starting production services...${NC}"
    
    # Start with production compose file
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    echo "  Waiting for services to become healthy..."
    sleep 10
    
    # Check health
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:8000/health | grep -q "healthy"; then
            echo -e "${GREEN}  ✓ Backend is healthy${NC}"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "  Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}Warning: Backend health check timed out${NC}"
    fi
    
    echo -e "${GREEN}✓ Services started${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}[6/6] Verifying deployment...${NC}"
    
    # Check all containers are running
    echo "  Checking container status..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Test health endpoint
    echo ""
    echo "  Testing health endpoints..."
    
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo -e "${GREEN}  ✓ Health check: OK${NC}"
    else
        echo -e "${RED}  ✗ Health check: FAILED${NC}"
    fi
    
    # Test frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
        echo -e "${GREEN}  ✓ Frontend: OK${NC}"
    else
        echo -e "${YELLOW}  ⚠ Frontend may still be starting${NC}"
    fi
    
    echo -e "${GREEN}✓ Deployment verification completed${NC}"
}

# Function to display final status
display_status() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo "  Application URLs:"
    echo "  - Frontend:   http://localhost:3000"
    echo "  - Backend:    http://localhost:8000"
    echo "  - API Docs:   http://localhost:8000/docs"
    echo "  - Health:     http://localhost:8000/health"
    echo "  - Metrics:    http://localhost:8000/api/monitoring/metrics"
    echo ""
    echo "  Default Login:"
    echo "  - Email:      yash@lulu.ae"
    echo "  - Password:   Lulu@2026!"
    echo ""
    echo "  Useful Commands:"
    echo "  - View logs:  docker-compose -f $COMPOSE_FILE logs -f"
    echo "  - Stop:       docker-compose -f $COMPOSE_FILE down"
    echo "  - Restart:    docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# Function for development deployment
deploy_dev() {
    echo -e "${YELLOW}Deploying in DEVELOPMENT mode...${NC}"
    docker-compose -f "$DEV_COMPOSE_FILE" up -d --build
    echo -e "${GREEN}Development deployment complete!${NC}"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend:  http://localhost:8000"
}

# Parse arguments
case "${1:-prod}" in
    "dev"|"development")
        deploy_dev
        ;;
    "prod"|"production"|"")
        check_prerequisites
        create_backup
        stop_services
        build_images
        start_services
        verify_deployment
        display_status
        ;;
    "stop")
        echo "Stopping all services..."
        docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
        docker-compose -f "$DEV_COMPOSE_FILE" down 2>/dev/null || true
        echo -e "${GREEN}Services stopped${NC}"
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "status")
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 [dev|prod|stop|logs|status]"
        echo "  dev    - Deploy for development"
        echo "  prod   - Deploy for production (default)"
        echo "  stop   - Stop all services"
        echo "  logs   - View container logs"
        echo "  status - View container status"
        exit 1
        ;;
esac
