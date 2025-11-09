# APP DE MONITOREO DE SERVICIOS 

## PARA LEVANTAR LA APP EN MODO DEV

### Reconstruimos los modulos de node
```
npm i
```

### Renombramos el archivo .env.template a .env y asignamos las variables de entorno

### Levantamos las bases de datos con el comando
```
docker compose up -d
```

### Iniciamos la app en modo desarrollo
```
npm run dev
```