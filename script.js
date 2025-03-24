/*****************************************
 * fetchProfile(username)
 * Busca o perfil do jogador no Chess.com
 *****************************************/
function fetchProfile(username) {
  fetch(`https://api.chess.com/pub/player/${username}`)
    .then(r => r.json())
    .then(profile => {
      const errorDiv = document.getElementById('error-message');
      const welcomePage = document.getElementById('welcome-page');
      const chessGame = document.getElementById('chess-game');
      const profileAndGames = document.querySelector('.profile-and-games');
      const profileDiv = document.getElementById('profile-info');

      // Oculta tudo antes de mostrar resultado
      errorDiv.style.display = 'none';
      welcomePage.style.display = 'none';
      chessGame.style.display = 'none';
      profileAndGames.style.display = 'none';

      // Verifica se usuário é válido
      if (!profile || profile.error) {
        errorDiv.style.display = 'block';
      } else {
        profileAndGames.style.display = 'flex';
        profileDiv.innerHTML = `
          <img src="${profile.avatar}" alt="${profile.username}" />
          <p><strong>Nome:</strong> ${profile.name || 'N/D'}</p>
          <p><strong>Status:</strong> ${profile.status || 'N/D'}</p>
        `;
        fetchGames(username);
        fetchStats(username);
      }
    })
    .catch(err => console.error('Erro ao buscar perfil:', err));
}

/***********************************************
 * fetchGames(username)
 * Busca últimas partidas do jogador neste mês
 ***********************************************/
function fetchGames(username) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
    .then(r => r.json())
    .then(games => {
      const gamesDiv = document.getElementById('games-list');
      gamesDiv.innerHTML = '';

      if (!games.games || !games.games.length) {
        gamesDiv.innerHTML = '<p>No games found this month.</p>';
        return;
      }

      const lastFive = games.games.slice(-5);
      lastFive.forEach(g => {
        const div = document.createElement('div');
        div.classList.add('game-card');

        const result =
          g.white.username === username
            ? g.white.result === 'win'
              ? 'Vitória'
              : g.white.result === 'lost'
              ? 'Derrota'
              : 'Empate'
            : g.black.result === 'win'
            ? 'Vitória'
            : g.black.result === 'lost'
            ? 'Derrota'
            : 'Empate';

        const color =
          result === 'Vitória'
            ? '#4CAF50'
            : result === 'Derrota'
            ? '#f44336'
            : '#ff9800';

        div.innerHTML = `
          <div class="game-result" style="color:${color}">${result}</div>
          <div class="game-details">
            <p>Brancas: ${g.white.username}</p>
            <p>Pretas: ${g.black.username}</p>
            <p>Time Control: ${convertTimeControl(g.time_control)}</p>
            <a href="${g.url}" target="_blank">Ver partida</a>
          </div>
        `;
        gamesDiv.appendChild(div);
      });
    })
    .catch(err => console.error('Erro ao buscar jogos:', err));
}

/***********************************************
 * fetchStats(username)
 * Busca estatísticas (blitz, bullet, daily...)
 ***********************************************/
function fetchStats(username) {
  fetch(`https://api.chess.com/pub/player/${username}/stats`)
    .then(r => r.json())
    .then(data => {
      const statsCard = document.getElementById('stats');
      const statsDiv = document.getElementById('stats-info');
      statsDiv.innerHTML = '';

      if (data.chess_blitz) {
        statsDiv.innerHTML += `
          <p><strong>Blitz Best:</strong> ${data.chess_blitz.best.rating}</p>
          <p><strong>Blitz Last:</strong> ${data.chess_blitz.last.rating}</p>
        `;
      }
      if (data.chess_bullet) {
        statsDiv.innerHTML += `
          <p><strong>Bullet Best:</strong> ${data.chess_bullet.best.rating}</p>
          <p><strong>Bullet Last:</strong> ${data.chess_bullet.last.rating}</p>
        `;
      }
      if (data.chess_daily) {
        statsDiv.innerHTML += `
          <p><strong>Daily Best:</strong> ${data.chess_daily.best.rating}</p>
          <p><strong>Daily Last:</strong> ${data.chess_daily.last.rating}</p>
        `;
      }
      if (statsDiv.innerHTML) {
        statsCard.style.display = 'block';
      }
    })
    .catch(err => alert('Erro ao buscar estatísticas: ' + err));
}

/***********************************************
 * convertTimeControl(tc)
 * Converte time_control em texto legível
 ***********************************************/
function convertTimeControl(tc) {
  const seconds = parseInt(tc.split(' ')[0]);
  if (seconds < 60) return `${seconds} seg`;
  if (seconds < 3600) return `${(seconds/60).toFixed(0)} min`;
  if (seconds < 86400) return `${(seconds/3600).toFixed(0)} h`;
  return `${(seconds/86400).toFixed(0)} dias`;
}

// Inicialização do tabuleiro
const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDragStart,
  onDrop,
  onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});

const game = new Chess();
let playerColor = '';
let isPlayingWithComputer = false;
let fullMoveHistory = [];

// Configurações de dificuldade
const difficultySettings = {
  '5':  { depth: 5,  skipMoves: 0.4 },
  '10': { depth: 10, skipMoves: 0.2 },
  '15': { depth: 15, skipMoves: 0.05 }
};

/***********************************************
 * getStockfishMove(fen)
 * Consulta a API Stockfish p/ melhor lance
 ***********************************************/
async function getStockfishMove(fen) {
  try {
    const diff = document.getElementById('difficulty').value;
    const settings = difficultySettings[diff];
    const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${settings.depth}`;
    document.getElementById('sent-fen').innerText = `FEN enviado: ${fen}`;

    const resp = await fetch(url);
    const data = await resp.json();

    const text = `Resposta da API:
Sucesso: ${data.success}
Avaliação: ${data.evaluation || 'N/A'}
Mate em: ${data.mate || 'N/A'}
Melhor jogada: ${data.bestmove || 'N/A'}
Continuação: ${data.continuation || 'N/A'}
Dificuldade: ${diff} (depth ${settings.depth})`;

    document.getElementById('api-response').innerText = text;

    if (data.success && data.bestmove) {
      // Chance de jogar um lance aleatório
      if (Math.random() < settings.skipMoves) {
        const moves = game.moves({ verbose: true });
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
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

/***********************************************
 * makeComputerMove()
 * Efetua lance do computador
 ***********************************************/
async function makeComputerMove() {
  if (!isPlayingWithComputer || game.game_over()) return;
  const fen = game.fen();
  const mv = await getStockfishMove(fen);
  if (mv) {
    const moveObj = game.move({
      from: mv.substring(0,2),
      to: mv.substring(2,4),
      promotion: mv.length === 5 ? mv[4] : undefined
    });
    board.position(game.fen());
    if (moveObj) fullMoveHistory.push(moveObj.san);
    updateStatus();
    updateMovesList();
  }
}

/***********************************************
 * startGame(color)
 * Inicia partida contra o Bot
 ***********************************************/
function startGame(color) {
  playerColor = color;
  isPlayingWithComputer = true;
  game.reset();
  board.start();
  fullMoveHistory = [];

  document.querySelector('.start-controls').style.display = 'none';
  document.getElementById('resignBtn').style.display = 'block';
  document.getElementById('newGameBtn').style.display = 'none';
  document.querySelector('.moves-history').style.display = 'flex';
  document.getElementById('moves-list').innerHTML = '';
  
  updateStatus();
  if (playerColor === 'b') makeComputerMove();
}

/***********************************************
 * endGame()
 * Retorna aos controles iniciais
 ***********************************************/
function endGame() {
  document.querySelector('.moves-history').style.display = 'none';
  document.querySelector('.start-controls').style.display = 'flex';
  document.getElementById('resignBtn').style.display = 'none';
  
  // Mostra o botão Novo Jogo ao terminar
  document.getElementById('newGameBtn').style.display = 'block';
  
  isPlayingWithComputer = false;
  playerColor = '';
}

/***********************************************
 * startPvPGame()
 * Inicia jogo Player vs Player
 ***********************************************/
function startPvPGame() {
  isPlayingWithComputer = false;
  playerColor = '';
  game.reset();
  board.start();
  fullMoveHistory = [];

  document.getElementById('welcome-page').style.display = 'none';
  document.getElementById('chess-game').style.display = 'block';
  document.querySelector('.start-controls').style.display = 'none';
  document.getElementById('resignBtn').style.display = 'none';
  
  // Botão novo jogo aparece somente quando acaba
  document.getElementById('newGameBtn').style.display = 'none';
  document.querySelector('.moves-history').style.display = 'flex';
  document.getElementById('moves-list').innerHTML = '';

  updateStatus();
}

/***********************************************
 * onDragStart(...)
 * Verifica jogador e cor
 ***********************************************/
function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if (isPlayingWithComputer) {
    if (
      (game.turn() === 'w' && playerColor === 'b') ||
      (game.turn() === 'b' && playerColor === 'w') ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)
    ) return false;
  } else {
    if (
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)
    ) return false;
  }
  return true;
}

/***********************************************
 * onDrop(source, target)
 * Efetua lance ou volta se for ilegal
 ***********************************************/
function onDrop(source, target) {
  removeHighlights();
  const mv = game.move({ from: source, to: target, promotion: 'q' });
  if (!mv) return 'snapback';

  fullMoveHistory.push(mv.san);
  updateStatus();
  updateMovesList();

  if (isPlayingWithComputer && game.turn() !== playerColor) {
    setTimeout(makeComputerMove, 500);
  }
}

/***********************************************
 * onSnapEnd()
 * Ajusta a posição final
 ***********************************************/
function onSnapEnd() {
  board.position(game.fen());
}

/***********************************************
 * updateStatus()
 * Define status e checa fim de jogo
 ***********************************************/
function updateStatus() {
  let statusText = '';
  if (game.game_over()) {
    if (game.in_checkmate()) {
      statusText = `Xeque-mate! ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} vencem!`;
      showWinnerModal(statusText);
    } else if (game.in_draw()) {
      statusText = 'Empate!';
      showWinnerModal(statusText);
    } else {
      statusText = 'Fim de jogo!';
      showWinnerModal(statusText);
    }
    endGame();
  } else {
    statusText = `${game.turn() === 'w' ? 'Brancas' : 'Pretas'} jogam`;
  }
  document.getElementById('status').innerText = statusText;
}

/***********************************************
 * showWinnerModal(message)
 * Mostra modal final
 ***********************************************/
function showWinnerModal(message) {
  document.getElementById('winnerMessage').innerText = message;
  document.getElementById('winnerModal').style.display = 'flex';
}

/***********************************************
 * removeHighlights()
 * Remove destaques de melhor jogada
 ***********************************************/
function removeHighlights() {
  $('.highlight-square').removeClass('highlight-square');
}

/***********************************************
 * updateMovesList()
 * Atualiza histórico de jogadas
 ***********************************************/
function updateMovesList() {
  const movesList = document.getElementById('moves-list');
  const hist = game.history({ verbose: true });
  movesList.innerHTML = '';

  for (let i = 0; i < hist.length; i += 2) {
    const number = Math.floor(i / 2) + 1;
    const white = hist[i];
    const black = hist[i + 1];
    const div = document.createElement('div');
    div.className = 'move-item';
    div.innerHTML = `
      <span class="move-number">${number}.</span>
      <span class="move-white">${white.san}</span>
      ${black ? `<span class="move-black">${black.san}</span>` : ''}
    `;
    movesList.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

/***********************************************
 * showBestMove()
 * Mostra melhor lance da API
 ***********************************************/
async function showBestMove() {
  if (!isPlayingWithComputer || game.game_over()) return;
  const fen = game.fen();
  try {
    const resp = await fetch(
      `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=15`
    );
    const data = await resp.json();
    if (data.success && data.bestmove) {
      const best = data.bestmove.split(' ')[1];
      const from = best.substring(0,2);
      const to = best.substring(2,4);
      removeHighlights();
      $(`#board .square-${from}`).addClass('highlight-square');
      $(`#board .square-${to}`).addClass('highlight-square');
      setTimeout(removeHighlights, 2000);
      document.getElementById('status').innerText = `Dica: ${from} → ${to}`;
    }
  } catch (error) {
    console.error('Erro ao buscar melhor jogada:', error);
  }
}

/***********************************************
 * replayGame()
 * Replay do jogo finalizado
 ***********************************************/
function replayGame() {
  document.getElementById('winnerModal').style.display = 'none';
  board.start();
  game.reset();

  let i = 0;
  function nextMove() {
    if (i >= fullMoveHistory.length) return;
    const move = fullMoveHistory[i];
    game.move(move);
    board.position(game.fen());
    i++;
    setTimeout(nextMove, 650);
  }
  nextMove();
}

/***********************************************
 * Event Listeners
 ***********************************************/
window.addEventListener('load', () => {
  document.getElementById('fetch-profile').addEventListener('click', () => {
    const user = document.getElementById('username').value;
    if (!user) {
      alert('Por favor, insira um nome de usuário.');
      return;
    }
    fetchProfile(user);
  });

  document.getElementById('play-link').addEventListener('click', () => {
    location.reload();
  });

  document.getElementById('tutorial-link').addEventListener('click', () => {
    alert('Aqui poderias redirecionar para um tutorial...');
  });

  document.getElementById('play-bot-btn').addEventListener('click', () => {
    document.getElementById('welcome-page').style.display = 'none';
    document.getElementById('chess-game').style.display = 'block';
  });

  document.getElementById('pvp-btn').addEventListener('click', startPvPGame);

  document.getElementById('playAsWhite').addEventListener('click', () => startGame('w'));
  document.getElementById('playAsBlack').addEventListener('click', () => startGame('b'));

  document.getElementById('resignBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja desistir?')) {
      document.getElementById('status').innerText =
        `Jogo encerrado. ${playerColor === 'w' ? 'Pretas' : 'Brancas'} vencem por desistência!`;
      showWinnerModal(document.getElementById('status').innerText);
      endGame();
    }
  });

  // Ao clicar em "Novo Jogo", reinicia tudo
  document.getElementById('newGameBtn').addEventListener('click', () => {
    game.reset();
    board.start();
    fullMoveHistory = [];
    document.querySelector('.moves-history').style.display = 'none';
    document.querySelector('.start-controls').style.display = 'flex';
    document.getElementById('resignBtn').style.display = 'none';
    document.getElementById('newGameBtn').style.display = 'none';
    document.getElementById('moves-list').innerHTML = '';
    document.getElementById('status').innerText = 'Selecione uma cor para começar';
    isPlayingWithComputer = false;
    playerColor = '';
  });

  // Botão "Dica"
  document.getElementById('helpBtn').addEventListener('click', showBestMove);

  // Seletor de dificuldade
  document.getElementById('difficulty').addEventListener('change', e => {
    console.log(`Dificuldade alterada para: ${e.target.value}`);
  });

  // Botão para mostrar/ocultar API Info
  document.getElementById('toggleApiInfoBtn').addEventListener('click', () => {
    const apiDiv = document.getElementById('api-info');
    apiDiv.style.display = apiDiv.style.display === 'none' ? 'block' : 'none';
  });

  // Modal - fechar
  document.getElementById('closeWinnerModal').addEventListener('click', () => {
    document.getElementById('winnerModal').style.display = 'none';
  });

  // Modal - replay
  document.getElementById('replayGameBtn').addEventListener('click', replayGame);
});
