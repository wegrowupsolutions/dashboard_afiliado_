FROM node:18

# Cria a pasta da app dentro do container
WORKDIR /app

# Copia os arquivos do projeto para o container
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Expõe a porta usada pela sua app (ajuste se necessário)
EXPOSE 3001

# Comando padrão
CMD ["npm", "run", "dev"]
