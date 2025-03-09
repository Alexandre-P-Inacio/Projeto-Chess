// Função para buscar o perfil do jogador
const fetchProfile = (username) => {
  fetch(`https://api.chess.com/pub/player/${username}`)
    .then(response => response.json())
    .then(profile => {
      const profileDiv = document.getElementById('profile-info');
      const errorMessageDiv = document.getElementById('error-message');
      const welcomePage = document.getElementById('welcome-page');
      const chessGame = document.getElementById('chess-game');
      const profileAndGames = document.querySelector('.profile-and-games');

      // Esconde todas as seções
      errorMessageDiv.style.display = 'none';
      welcomePage.style.display = 'none';
      chessGame.style.display = 'none';
      profileAndGames.style.display = 'none';

      if (profile.error || !profile) {
        errorMessageDiv.style.display = 'block';
      } else {
        // Mostra o layout de perfil e jogos
        profileAndGames.style.display = 'flex';

        // Exibe as informações de perfil
        profileDiv.innerHTML = `
          <img src="${profile.avatar}" alt="${profile.username}" style="border-radius: 50%; width: 120px; height: 120px;" />
          <p><strong>Nome:</strong> ${profile.name || 'Não disponível'}</p>
          <p><strong>Status:</strong> ${profile.status || 'Não disponível'}</p>
        `;

        // Chama as funções para buscar jogos e estatísticas
        fetchGames(username);
        fetchStats(username);
      }
    })
    .catch(err => {
      console.error('Erro ao buscar perfil:', err);
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

// Função para buscar as últimas 5 partidas de um jogador no mês atual
const fetchGames = (username) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');

  fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
    .then(response => response.json())
    .then(games => {
      const gamesDiv = document.getElementById('games-list');
      gamesDiv.innerHTML = '';

      if (!games.games || games.games.length === 0) {
        gamesDiv.innerHTML = '<p>Nenhum jogo encontrado este mês.</p>';
        return;
      }

      // Pega os últimos 5 jogos
      const lastFiveGames = games.games.slice(-5);

      lastFiveGames.forEach(game => {
          const gameDiv = document.createElement('div');
          gameDiv.classList.add('game-card');

        const result = game.white.username === username ? 
          (game.white.result === 'win' ? 'Vitória' : game.white.result === 'lost' ? 'Derrota' : 'Empate') :
          (game.black.result === 'win' ? 'Vitória' : game.black.result === 'lost' ? 'Derrota' : 'Empate');

        const resultColor = result === 'Vitória' ? '#4CAF50' : 
                          result === 'Derrota' ? '#f44336' : '#ff9800';

          gameDiv.innerHTML = `
          <div class="game-result" style="color: ${resultColor}">${result}</div>
            <div class="game-details">
            <p>Brancas: ${game.white.username}</p>
            <p>Pretas: ${game.black.username}</p>
            <p>Controle de tempo: ${convertTimeControl(game.time_control)}</p>
            <a href="${game.url}" target="_blank">Ver partida</a>
            </div>
          `;
          gamesDiv.appendChild(gameDiv);
        });
    })
    .catch(err => {
      console.error('Erro ao buscar jogos:', err);
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

// Modifique a inicialização do tabuleiro
const board = ChessBoard('board', {
  draggable: true,
    position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

const game = new Chess();
let playerColor = '';
let isPlayingWithComputer = false;

// Configurações de dificuldade
const difficultySettings = {
    '5': { // Fácil
        depth: 5,
        skipMoves: 0.4  // 40% de chance de não usar o melhor movimento
    },
    '10': { // Médio
        depth: 10,
        skipMoves: 0.2  // 20% de chance de não usar o melhor movimento
    },
    '15': { // Difícil
        depth: 15,
        skipMoves: 0.05 // 5% de chance de não usar o melhor movimento
    }
};

async function getStockfishMove(fen) {
    try {
        // Pega a dificuldade selecionada
        const difficulty = document.getElementById('difficulty').value;
        const settings = difficultySettings[difficulty];
        
        const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${settings.depth}`;
        document.getElementById('sent-fen').innerText = `FEN enviado: ${fen}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const formattedResponse = `Resposta da API:
Sucesso: ${data.success}
Avaliação: ${data.evaluation || 'N/A'}
Mate em: ${data.mate || 'N/A'}
Melhor jogada: ${data.bestmove || 'N/A'}
Continuação: ${data.continuation || 'N/A'}
Dificuldade: ${difficulty} (depth ${settings.depth})`;

        document.getElementById('api-response').innerText = formattedResponse;
        
        if (data.success && data.bestmove) {
            // Chance de escolher um movimento aleatório em vez do melhor movimento
            if (Math.random() < settings.skipMoves) {
                // Pega todos os movimentos possíveis
                const moves = game.moves({ verbose: true });
                if (moves.length > 0) {
                    // Escolhe um movimento aleatório
                    const randomMove = moves[Math.floor(Math.random() * moves.length)];
                    console.log('Movimento aleatório escolhido em vez do melhor movimento');
                    return randomMove.from + randomMove.to;
                }
            }
            return data.bestmove.split(' ')[1];
        }
        return null;
    } catch (error) {
        console.error('Erro ao consultar Stockfish:', error);
        document.getElementById('api-response').innerText = `Erro na API: ${error.message}`;
        return null;
    }
}

async function makeComputerMove() {
    if (!isPlayingWithComputer || game.game_over()) return;
    
    const fen = game.fen();
    const move = await getStockfishMove(fen);
    
    if (move) {
        game.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: move.length === 5 ? move.substring(4, 5) : undefined
        });
        board.position(game.fen());
        updateStatus();
        updateMovesList();
    }
}

function startGame(color) {
    playerColor = color;
    isPlayingWithComputer = true;
  game.reset();
  board.start();
    
    // Esconde os controles de início e mostra os de jogo
    document.querySelector('.start-controls').style.display = 'none';
    document.getElementById('resignBtn').style.display = 'block';
    document.getElementById('newGameBtn').style.display = 'none';
    
    // Mostra o histórico e limpa
    document.querySelector('.moves-history').style.display = 'flex';
    document.getElementById('moves-list').innerHTML = '';
    
  updateStatus();
    
    if (playerColor === 'b') {
        makeComputerMove();
    }
}

function endGame() {
    // Esconde o histórico
    document.querySelector('.moves-history').style.display = 'none';
    
    // Mostra os controles de início
    document.querySelector('.start-controls').style.display = 'flex';
    document.getElementById('resignBtn').style.display = 'none';
    document.getElementById('newGameBtn').style.display = 'block';
    
    isPlayingWithComputer = false;
    playerColor = '';
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over() || !isPlayingWithComputer) return false;

    if ((game.turn() === 'w' && playerColor === 'b') ||
        (game.turn() === 'b' && playerColor === 'w') ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
  }
    return true;
}

function onDrop(source, target) {
    removeHighlights();
    
  const move = game.move({
      from: source,
      to: target,
        promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();
    updateMovesList();

    if (isPlayingWithComputer && game.turn() !== playerColor) {
        setTimeout(makeComputerMove, 500);
    }
}

function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  let status = '';
    if (game.game_over()) {
  if (game.in_checkmate()) {
            status = `Xeque-mate! ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} vencem!`;
  } else if (game.in_draw()) {
            status = 'Empate!';
  } else {
            status = 'Fim de jogo!';
        }
        
        // Esconde o histórico no fim do jogo
        document.querySelector('.moves-history').style.display = 'none';
        document.querySelector('.start-controls').style.display = 'flex';
        document.getElementById('resignBtn').style.display = 'none';
        document.getElementById('newGameBtn').style.display = 'block';
        
        isPlayingWithComputer = false;
    } else {
        status = `${game.turn() === 'w' ? 'Brancas' : 'Pretas'} jogam`;
    }
  document.getElementById('status').innerText = status;
}

// Event Listeners
window.addEventListener('load', () => {
    // Adiciona div para informações da API se não existir
    if (!document.getElementById('api-info')) {
        const apiInfoDiv = `
            <div id="api-info" class="api-info">
                <div id="sent-fen">FEN enviado: </div>
                <div id="api-response">Resposta da API: </div>
            </div>
        `;
        document.getElementById('status').insertAdjacentHTML('afterend', apiInfoDiv);
    }

    // Botão de jogar contra bot
document.getElementById('play-bot-btn').addEventListener('click', () => {
        document.getElementById('welcome-page').style.display = 'none';
        document.getElementById('chess-game').style.display = 'block';
    });

    // Botões de escolha de cor
    document.getElementById('playAsWhite').addEventListener('click', () => startGame('w'));
    document.getElementById('playAsBlack').addEventListener('click', () => startGame('b'));

    // Botão de desistir
    document.getElementById('resignBtn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja desistir?')) {
            document.getElementById('status').innerText = 
                `Jogo encerrado. ${playerColor === 'w' ? 'Pretas' : 'Brancas'} vencem por desistência!`;
            
            // Esconde o histórico
            document.querySelector('.moves-history').style.display = 'none';
            
            // Mostra os controles de novo jogo
            document.querySelector('.start-controls').style.display = 'flex';
            document.getElementById('resignBtn').style.display = 'none';
            document.getElementById('newGameBtn').style.display = 'block';
            
            isPlayingWithComputer = false;
            playerColor = '';
        }
    });

    // Seletor de dificuldade
    document.getElementById('difficulty').addEventListener('change', (e) => {
        const difficulty = e.target.value;
        const settings = difficultySettings[difficulty];
        console.log(`Dificuldade alterada para: ${difficulty} (depth ${settings.depth})`);
    });

    // Botão de ajuda
    document.getElementById('helpBtn').addEventListener('click', showBestMove);

    // Event listener para o botão de novo jogo
    document.getElementById('newGameBtn').addEventListener('click', () => {
        game.reset();
        board.start();
        
        // Esconde o histórico
        document.querySelector('.moves-history').style.display = 'none';
        
        // Mostra os controles iniciais
        document.querySelector('.start-controls').style.display = 'flex';
        document.getElementById('resignBtn').style.display = 'none';
        document.getElementById('newGameBtn').style.display = 'none';
        
        document.getElementById('moves-list').innerHTML = '';
        document.getElementById('status').innerText = 'Selecione uma cor para começar';
        
        isPlayingWithComputer = false;
        playerColor = '';
    });
});

// Estilos para a informação da API
const styles = `
    .api-info {
        margin-top: 20px;
        padding: 15px;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-family: monospace;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .api-info div {
        margin: 8px 0;
        line-height: 1.4;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Adicione estilos para o seletor de dificuldade
const additionalStyles = `
    #difficulty {
        padding: 8px;
        font-size: 14px;
        border-radius: 4px;
        border: 1px solid #ccc;
        margin-right: 10px;
    }

    #difficulty option {
        padding: 4px;
    }
`;

// Adicione os novos estilos
document.head.appendChild(
    Object.assign(document.createElement('style'), {
        textContent: additionalStyles
    })
);

// Função para mostrar a melhor jogada
async function showBestMove() {
    if (!isPlayingWithComputer || game.game_over()) return;
    
    const fen = game.fen();
    try {
        const response = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=15`);
        const data = await response.json();
        
        if (data.success && data.bestmove) {
            const bestMove = data.bestmove.split(' ')[1];
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            
            // Remove destaques anteriores
            removeHighlights();
            
            // Destaca a casa de origem e destino
            $(`#board .square-${from}`).addClass('highlight-square');
            $(`#board .square-${to}`).addClass('highlight-square');
            
            // Remove os destaques após 2 segundos
            setTimeout(removeHighlights, 2000);
            
            // Mostra a dica no status
            document.getElementById('status').innerText = 
                `Dica: Mova a peça de ${from} para ${to}`;
        }
    } catch (error) {
        console.error('Erro ao buscar melhor jogada:', error);
    }
}

// Função para remover destaques
function removeHighlights() {
    $('.highlight-square').removeClass('highlight-square');
}

// Função para atualizar o histórico de jogadas
function updateMovesList() {
    const movesList = document.getElementById('moves-list');
    const history = game.history({ verbose: true });
    movesList.innerHTML = '';
    
    for (let i = 0; i < history.length; i += 2) {
        const moveNumber = Math.floor(i/2) + 1;
        const moveDiv = document.createElement('div');
        moveDiv.className = 'move-item';
        
        const whiteMove = history[i];
        const blackMove = history[i + 1];
        
        moveDiv.innerHTML = `
            <span class="move-number">${moveNumber}.</span>
            <span class="move-white">${whiteMove.san}</span>
            ${blackMove ? `<span class="move-black">${blackMove.san}</span>` : ''}
        `;
        
        movesList.appendChild(moveDiv);
        moveDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}