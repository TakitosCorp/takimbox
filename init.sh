docker stop takimbox
docker compose down --rmi all
docker compose -f docker-compose.yml up --build -d
