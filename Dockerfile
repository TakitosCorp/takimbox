FROM node:23-alpine AS build-client

# Establece el directorio de trabajo para la construcción del cliente
WORKDIR /app/client

# Copia toda la carpeta client
COPY client ./ 

# Instala dependencias y construye el proyecto
RUN npm install && npm run build

# Etapa final
FROM node:23-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala herramientas necesarias y configura permisos
RUN apk add --no-cache tzdata python3 make g++ && \
    cp /usr/share/zoneinfo/Europe/Madrid /etc/localtime && \
    echo "Europe/Madrid" > /etc/timezone && \
    npm install --omit=dev && \
    npm cache clean --force && \
    npm rebuild --force && \
    npm rebuild better-sqlite3 --build-from-source && \
    apk del python3 make g++ && \
    mkdir -p /app/data && \
    chown -R node:node /app

USER node

# Copia solo el código fuente y no node_modules
COPY . .

# Copia los contenidos de dist a views desde la etapa de construcción
COPY --from=build-client /app/client/dist /app/views

# Establece un valor por defecto para el puerto
ARG PORT=3000
ENV PORT=$PORT

# Expone el puerto
EXPOSE $PORT

# Comando para iniciar la aplicación
CMD ["npm", "run", "start"]