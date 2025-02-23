// Função para buscar o perfil do jogador
const fetchProfile = (username) => {
  fetch(`https://api.chess.com/pub/player/${username}`)
    .then(response => response.json())
    .then(profile => {
      const profileDiv = document.getElementById('profile-info');
      const errorMessageDiv = document.getElementById('error-message');
      const profileCard = document.getElementById('profile');
      const gamesCard = document.getElementById('games');
      const statsCard = document.getElementById('stats');
      const welcomePage = document.getElementById('welcome-page');
      const playBotBtn = document.getElementById('play-bot-btn');

      // Limpa qualquer conteúdo das seções
      errorMessageDiv.style.display = 'none';
      profileCard.style.display = 'none';
      gamesCard.style.display = 'none';
      statsCard.style.display = 'none';
      welcomePage.style.display = 'none';  // Esconde a página de boas-vindas

      // Caso o perfil não exista
      if (profile.error || !profile) {
        errorMessageDiv.style.display = 'block';  // Exibe mensagem de erro
        playBotBtn.style.display = 'block';  // Exibe o botão "Jogar com Bot"
      } else {
        // Exibe as informações de perfil
        profileDiv.innerHTML = `
          <img src="${profile.avatar}" alt="${profile.username}" style="border-radius: 50%; width: 120px; height: 120px;" />
          <p><strong>Nome:</strong> ${profile.name || 'Não disponível'}</p>
          <p><strong>Status:</strong> ${profile.status || 'Não disponível'}</p>
        `;

        // Exibe o perfil
        profileCard.style.display = 'block';

        // Exibe o botão de "Jogar com Bot"
        playBotBtn.style.display = 'block';

        // Chama as funções para buscar jogos e estatísticas
        fetchGames(username);
        fetchStats(username);
      }
    })
    .catch(err => {
      alert('Erro ao buscar perfil: ' + err);
    });
};

// Função para converter time control em uma unidade legível (minutos, segundos, horas, ou dias)
const convertTimeControl = (timeControl) => {
  const timeInSeconds = parseInt(timeControl.split(' ')[0]);  // Pegamos o número da string
  if (timeInSeconds < 60) {
    return `${timeInSeconds} seconds`;
  } else if (timeInSeconds >= 60 && timeInSeconds < 3600) {
    return `${(timeInSeconds / 60).toFixed(0)} minutes`;
  } else if (timeInSeconds >= 3600 && timeInSeconds < 86400) {
    return `${(timeInSeconds / 3600).toFixed(0)} hours`;
  } else {
    return `${(timeInSeconds / 86400).toFixed(0)} days`;
  }
};

// Função para buscar as últimas 3 partidas de um jogador no mês atual
const fetchGames = (username) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');  // Mês atual

  // URL para buscar os jogos do mês atual
  fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
    .then(response => response.json())
    .then(games => {
      const gamesDiv = document.getElementById('games-list');
      const gamesCard = document.getElementById('games');
      gamesDiv.innerHTML = ''; // Limpa as partidas anteriores

      if (!games.games || games.games.length === 0) {
        gamesDiv.innerHTML = '<p>No games available for this month.</p>';
      } else {
        const lastThreeGames = games.games.slice(0, 3);

        lastThreeGames.forEach(game => {
          const gameDiv = document.createElement('div');
          gameDiv.classList.add('game-card');
          const result = game.result ? game.result : 'Pending';

          gameDiv.innerHTML = `
            <div class="game-header">
              <p><strong>Result:</strong> ${result}</p>
              <p><strong>Time Control:</strong> ${convertTimeControl(game.time_control)}</p>
            </div>
            <div class="game-details">
              <p><strong>Players:</strong> ${game.white.username} (White) vs ${game.black.username} (Black)</p>
              <p><a href="${game.url}" target="_blank">View full game</a></p>
            </div>
          `;
          gamesDiv.appendChild(gameDiv);
        });
      }

      if (gamesDiv.innerHTML !== '') {
        gamesCard.style.display = 'block';
      }
    })
    .catch(err => {
      alert('Error fetching games: ' + err);
    });
};



// Função para buscar as estatísticas de um jogador
const fetchStats = (username) => {
  fetch(`https://api.chess.com/pub/player/${username}/stats`)
    .then(response => response.json())
    .then(stats => {
      const statsDiv = document.getElementById('stats-info');
      const statsCard = document.getElementById('stats');
      statsDiv.innerHTML = ''; // Limpa as estatísticas anteriores
      
      // Estatísticas Blitz
      if (stats.chess_blitz) {
        statsDiv.innerHTML += `
          <p><strong>Melhor rating Blitz:</strong> ${stats.chess_blitz.best.rating}</p>
          <p><strong>Último rating Blitz:</strong> ${stats.chess_blitz.last.rating}</p>
          <p><strong>Vitórias Blitz:</strong> ${stats.chess_blitz.record.win}</p>
          <p><strong>Derrotas Blitz:</strong> ${stats.chess_blitz.record.loss}</p>
          <p><strong>Empates Blitz:</strong> ${stats.chess_blitz.record.draw}</p>
          <p><strong>Porcentagem de vitórias Blitz:</strong> ${(stats.chess_blitz.record.win / (stats.chess_blitz.record.win + stats.chess_blitz.record.loss + stats.chess_blitz.record.draw) * 100).toFixed(2)}%</p>
        `;
      }

      // Estatísticas Bullet
      if (stats.chess_bullet) {
        statsDiv.innerHTML += `
          <p><strong>Melhor rating Bullet:</strong> ${stats.chess_bullet.best.rating}</p>
          <p><strong>Último rating Bullet:</strong> ${stats.chess_bullet.last.rating}</p>
          <p><strong>Vitórias Bullet:</strong> ${stats.chess_bullet.record.win}</p>
          <p><strong>Derrotas Bullet:</strong> ${stats.chess_bullet.record.loss}</p>
          <p><strong>Empates Bullet:</strong> ${stats.chess_bullet.record.draw}</p>
          <p><strong>Porcentagem de vitórias Bullet:</strong> ${(stats.chess_bullet.record.win / (stats.chess_bullet.record.win + stats.chess_bullet.record.loss + stats.chess_bullet.record.draw) * 100).toFixed(2)}%</p>
        `;
      }

      // Estatísticas Daily (caso existam)
      if (stats.chess_daily) {
        statsDiv.innerHTML += `
          <p><strong>Melhor rating Daily:</strong> ${stats.chess_daily.best.rating}</p>
          <p><strong>Último rating Daily:</strong> ${stats.chess_daily.last.rating}</p>
          <p><strong>Vitórias Daily:</strong> ${stats.chess_daily.record.win}</p>
          <p><strong>Derrotas Daily:</strong> ${stats.chess_daily.record.loss}</p>
          <p><strong>Empates Daily:</strong> ${stats.chess_daily.record.draw}</p>
        `;
      }

      // Estatísticas de Tactics
      if (stats.tactics) {
        statsDiv.innerHTML += `
          <p><strong>Melhor rating Tactics:</strong> ${stats.tactics.highest.rating}</p>
          <p><strong>Último rating Tactics:</strong> ${stats.tactics.lowest.rating}</p>
          <p><strong>Jogos em Tactics:</strong> ${stats.tactics.total}</p>
        `;
      }

      // Estatísticas de Puzzle Rush
      if (stats.puzzle_rush) {
        statsDiv.innerHTML += `
          <p><strong>Melhor score Puzzle Rush:</strong> ${stats.puzzle_rush.best.score}</p>
          <p><strong>Total de tentativas Puzzle Rush:</strong> ${stats.puzzle_rush.total_attempts}</p>
        `;
      }

      // Estatísticas de Lessons
      if (stats.lessons) {
        statsDiv.innerHTML += `
          <p><strong>Melhor rating Lessons:</strong> ${stats.lessons.highest.rating}</p>
          <p><strong>Último rating Lessons:</strong> ${stats.lessons.lowest.rating}</p>
        `;
      }

      // Exibe as estatísticas se houver
      if (statsDiv.innerHTML !== '') {
        statsCard.style.display = 'block';
      }
    })
    .catch(err => {
      alert('Erro ao buscar estatísticas: ' + err);
    });
};


// Evento do botão de busca
document.getElementById('fetch-profile').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  if (!username) {
    alert('Por favor, insira um nome de usuário.');
    return;
  }
  
  // Busca as informações
  fetchProfile(username);
});

// Evento "JOGAR" para voltar à página inicial e recarregar a página
document.getElementById('play-link').addEventListener('click', () => {
  location.reload();  // Recarrega a página, retornando ao estado inicial
});

// Inicializa o tabuleiro de xadrez
const board = ChessBoard('board', {
  draggable: true,
  dropOffBoard: 'trash',
  sparePieces: true,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

const game = new Chess();

// Inicializa o jogo
function startGame() {
  game.reset();
  board.start();
  updateStatus();
}

// Limpa o tabuleiro
function clearGame() {
  game.clear();
  board.clear();
  document.getElementById('status').innerText = "Jogo limpo.";
  document.getElementById('fen').innerText = "";
}

// Função chamada ao iniciar o movimento
function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;

  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
  }
}

// Função chamada ao soltar a peça
function onDrop(source, target) {
  const move = game.move({
      from: source,
      to: target,
      promotion: 'q' // Sempre promove a peça para rainha
  });

  if (move === null) return 'snapback';

  updateStatus();
}

// Função chamada após cada movimento
function onSnapEnd() {
  board.position(game.fen());
}

// Atualiza o status do jogo
function updateStatus() {
  let status = '';

  const moveColor = game.turn() === 'w' ? 'Branco' : 'Preto';

  if (game.in_checkmate()) {
      status = `Fim de jogo! ${moveColor} está em xeque-mate.`;
  } else if (game.in_draw()) {
      status = 'Fim de jogo! Empate.';
  } else if (game.in_check()) {
      status = `O Rei de ${moveColor} está em xeque.`;
  } else {
      status = `${moveColor} é a vez de jogar.`;
  }

  document.getElementById('status').innerText = status;
  document.getElementById('fen').innerText = game.fen();
}

// Adiciona eventos aos botões
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('clearBtn').addEventListener('click', clearGame);

// Evento para o botão de "Jogar com Bot"
document.getElementById('play-bot-btn').addEventListener('click', () => {
  document.getElementById('welcome-page').style.display = 'none';  // Esconde a página de boas-vindas
  document.getElementById('chess-game').style.display = 'block';  // Exibe o tabuleiro de xadrez
});