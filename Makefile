APP_NAME=zendesk-mcp-server
PORT=8080
ENV_FILE=.env

# Build Docker image
build:
	sudo docker build -t $(APP_NAME) .

# Run Docker container
start:
	sudo docker run --env-file $(ENV_FILE) -d -p $(PORT):$(PORT) --name $(APP_NAME)-container $(APP_NAME)

# Stop running container
stop:
	sudo docker stop $(APP_NAME)-container || true
	sudo docker rm $(APP_NAME)-container || true

# Restart container (without rebuild)
restart: stop start

# Rebuild and run
rebuild: stop build start

# Show running containers
ps:
	sudo docker ps

# Show all containers
psa:
	sudo docker ps -a

# Show images
images:
	sudo docker images

# Remove image
rmi:
	sudo docker rmi -f $(APP_NAME)

# Clean everything (containers + image)
clean: stop
	sudo docker rmi $(APP_NAME) || true