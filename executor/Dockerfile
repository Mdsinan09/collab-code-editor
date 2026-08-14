FROM node:20-bullseye

WORKDIR /app

# Install language runtimes/compilers
RUN apt-get update && apt-get install -y \
    python3 \
    default-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Create non-root user for safer execution
RUN useradd -m -s /bin/bash executor && \
    mkdir -p /tmp/executor && \
    chown -R executor:executor /tmp/executor /app

USER executor

EXPOSE 5002

CMD ["node", "server.js"]
