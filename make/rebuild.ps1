docker-compose down
if ($?) {
    docker-compose build --no-cache
}
if ($?) {
    docker-compose up -d
}