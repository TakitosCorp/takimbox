docker compose down --rmi all
docker volume prune 
docker network prune
docker compose -f docker-compose.yml up --build