# COMP4121 - SecondLife Full Stack Project

This project contains:
- Backend: FastAPI + MongoDB (runs with Docker)
- Frontend: Next.js (runs with npm)
- One-click launcher: run.sh (starts both backend and frontend)

If you are new to programming, follow this guide from top to bottom.

## 1) Prerequisites

You need these installed:
- Docker Desktop (Windows/macOS) OR Docker Engine (Linux)
- Node.js 18+ and npm
- Git

Check versions:

	docker --version
	docker compose version
	node --version
	npm --version
	git --version

If any command says not found, install that tool first.

## 2) Start Docker Engine

The project cannot run unless Docker Engine is running.

### Windows
- Open Docker Desktop and wait until it shows Docker is running.
- Verify in terminal:

	docker info

### macOS
- Open Docker Desktop and wait until it shows Docker is running.
- Verify in terminal:

	docker info

### Linux (Ubuntu/Debian)

	sudo systemctl start docker
	sudo systemctl enable docker
	sudo systemctl status docker

Optional (avoid typing sudo for docker every time):

	sudo usermod -aG docker $USER
	newgrp docker

Then verify:

	docker info
	docker run --rm hello-world

### GitHub Codespaces (important)

Codespaces runs inside a container, so `systemd` is usually not available.
Do not use:

	sudo systemctl start docker

Use this check first:

	docker info

If `docker info` works, Docker is already ready and you can run the project directly.

If your Codespace image supports service management, try:

	sudo service docker start

If you get `docker: unrecognized service`, that is also normal for some Codespaces images.
In that case, rely on `docker info` as the source of truth.

## 3) Clone the repository (if you have not done this)

	git clone https://github.com/wingkin2003/COMP4121.git
	cd COMP4121

If you already have the repository, just go to the project root:

	cd COMP4121

## 4) Run the whole project

From the project root (same folder as run.sh):

	chmod +x ./run.sh
	./run.sh

What run.sh does automatically:
- Creates backend/.env if missing
- Starts backend with docker compose on port 8000
- Installs frontend packages if missing
- Creates second-hand-web-next/.env.local if missing
- Starts Next.js frontend on port 3000

## 5) Open the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

Demo account:
- Username: demo_user
- Password: demo1234

## 6) Stop the project

From the project root:

	./run.sh stop

## 7) Common problems and quick fixes

### Problem: Docker daemon is not running
Run:

	docker info

If it fails, start Docker Engine (see Section 2), then try again.

### Problem: Permission denied on Docker (Linux)
Run:

	sudo usermod -aG docker $USER
	newgrp docker
	docker info

### Problem: Port 3000 or 8000 already in use
Find process:

	lsof -i :3000
	lsof -i :8000

Stop existing services first, then run again:

	./run.sh stop
	./run.sh

### Problem: Backend failed to start
Check backend logs:

	cd backend
	docker compose logs -f

### Problem: Frontend dependency issues
Reinstall frontend packages:

	cd second-hand-web-next
	rm -rf node_modules package-lock.json
	npm install
	cd ..
	./run.sh

## 8) Manual start (advanced)

If you do not want run.sh, you can start services manually.

Backend:

	cd backend
	docker compose up --build -d

Frontend:

	cd second-hand-web-next
	npm install
	npm run dev

## 9) Environment notes

Default backend .env values created by run.sh include:
- MONGODB_URI using the provided MongoDB Atlas cluster
- JWT settings for local development

You can edit backend/.env later if needed.

## 10) Notes for GitHub Codespaces Development

Set Visibility of Server with Port 8000 (API Server) to public, or You wouldn't be able to login due to CORS