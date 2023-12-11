# Usa una imagen base de Node.js
FROM node:latest
# Establece la zona horaria en el contenedor
ENV TZ=America/Guayaquil
# Establecer el directorio de trabajo
WORKDIR /app

# Actualizar el índice de paquetes e instalar las herramientas necesarias
RUN apt-get update
RUN apt-get install -y curl wget gnupg2 apt-utils git


# Instalar npm, TypeScript, y pm2 de forma global
RUN npm install -g npm && \
    npm install -g typescript && \
    npm install -g pm2

# Copiar el código de la aplicación
COPY . /app

# Instalar las dependencias del proyecto y compilar TypeScript
RUN npm install && \
    npx tsc

# Definir la variable de entorno PORT
ENV PORT 3000

# Exponer el puerto que la aplicación utilizará
EXPOSE 3000

# CMD se usa para especificar el comando predeterminado a ejecutar cuando el contenedor se inicia
CMD ["npm", "start"]
#docker run -p 53007:3000 --name baileys -d baileys