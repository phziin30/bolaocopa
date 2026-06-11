// Conecta ao servidor via WebSocket
const socket = io();

const listaJogosDiv = document.getElementById('lista-jogos');
const statusDiv = document.getElementById('status-conexao');

socket.on('connect', () => {
    statusDiv.innerHTML = "🟢 Conectado - Dados Ao Vivo";
    statusDiv.style.color = "green";
});

// Recebe a lista inicial de jogos ao entrar na página
socket.on('jogosIniciais', (jogos) => {
    listaJogosDiv.innerHTML = ''; // Limpa a div
    jogos.forEach(jogo => {
        const jogoCard = document.createElement('div');
        jogoCard.className = 'match-card';
        jogoCard.id = `jogo-${jogo.id}`;
        
        jogoCard.innerHTML = `
            <h3>${jogo.casa} <span class="score" id="placar-casa-${jogo.id}">${jogo.placarCasa}</span> x <span class="score" id="placar-fora-${jogo.id}">${jogo.placarFora}</span> ${jogo.fora}</h3>
            <p>Status: <strong>${jogo.status}</strong></p>
            <div class="inputs">
                <input type="text" id="user-${jogo.id}" placeholder="Seu Nome" required>
                <br><br>
                Palpite: 
                <input type="number" id="palpite-casa-${jogo.id}" min="0"> x 
                <input type="number" id="palpite-fora-${jogo.id}" min="0">
            </div>
            <button onclick="enviarPalpite(${jogo.id})">Salvar Palpite</button>
        `;
        listaJogosDiv.appendChild(jogoCard);
    });
});

// Escuta atualizações de placar em tempo real
socket.on('placarAtualizado', (dados) => {
    const placarCasaEl = document.getElementById(`placar-casa-${dados.id}`);
    const placarForaEl = document.getElementById(`placar-fora-${dados.id}`);
    
    if (placarCasaEl && placarForaEl) {
        placarCasaEl.innerText = dados.placarCasa;
        placarForaEl.innerText = dados.placarFora;
        // Efeito visual para mostrar que atualizou
        placarCasaEl.style.color = "blue";
        setTimeout(() => placarCasaEl.style.color = "#d32f2f", 2000);
    }
});

// Função para enviar os dados para o PostgreSQL via Fetch API
async function enviarPalpite(jogoId) {
    const usuario = document.getElementById(`user-${jogoId}`).value;
    const placarCasa = document.getElementById(`palpite-casa-${jogoId}`).value;
    const placarFora = document.getElementById(`palpite-fora-${jogoId}`).value;

    if (!usuario || placarCasa === '' || placarFora === '') {
        alert("Preencha o nome e o placar completo!");
        return;
    }

    try {
        const response = await fetch('/api/palpites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, jogo_id: jogoId, placar_casa: placarCasa, placar_fora: placarFora })
        });

        if (response.ok) {
            alert('Palpite salvo com sucesso!');
        } else {
            alert('Erro ao salvar palpite.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}
