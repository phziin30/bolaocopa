require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da Base de Dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necessário para o Render
});

// Criar tabela de palpites caso não exista
const initDB = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS palpites (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100),
        jogo_id INT,
        placar_casa INT,
        placar_fora INT,
        data_palpite TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
        await pool.query(query);
        console.log("Tabela de palpites verificada/criada com sucesso.");
    } catch (err) {
        console.error("Erro ao criar tabela:", err);
    }
};
initDB();

// Rota API para salvar palpites via HTTP (Frontend vai chamar esta rota)
app.post('/api/palpites', async (req, res) => {
    const { usuario, jogo_id, placar_casa, placar_fora } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO palpites (usuario, jogo_id, placar_casa, placar_fora) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario, jogo_id, placar_casa, placar_fora]
        );
        res.status(201).json({ success: true, palpite: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar palpite' });
    }
});

// Lógica de Tempo Real (Socket.io)
io.on('connection', (socket) => {
    console.log(`Novo utilizador conectado: ${socket.id}`);

    // Aqui você enviaria os dados iniciais dos jogos
    // Exemplo de dados estáticos para simular a API
    const jogosAtuais = [
        { id: 1, casa: 'Brasil', fora: 'Argentina', placarCasa: 0, placarFora: 0, status: 'Ao Vivo' },
        { id: 2, casa: 'França', fora: 'Inglaterra', placarCasa: 0, placarFora: 0, status: '15:00' }
    ];
    
    socket.emit('jogosIniciais', jogosAtuais);

    socket.on('disconnect', () => {
        console.log(`Utilizador desconectado: ${socket.id}`);
    });
});

// Simulação: Emitir atualização de placar a cada 30 segundos
// Na vida real, este evento seria disparado pelo seu script que consome a API de Futebol
setInterval(() => {
    const atualizacao = { id: 1, placarCasa: Math.floor(Math.random() * 3), placarFora: Math.floor(Math.random() * 3) };
    io.emit('placarAtualizado', atualizacao);
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});
