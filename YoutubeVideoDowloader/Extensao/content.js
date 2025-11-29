function isVideoPage() {
    return window.location.href.includes("watch") || window.location.href.includes("shorts");
}

// --- GERENCIADOR DE ESTILOS INJETADOS (Para o Mini-Player) ---
function injetarEstilosExtras() {
    if (document.getElementById('paulinho-extra-styles')) return;
    const style = document.createElement('style');
    style.id = 'paulinho-extra-styles';
    style.innerHTML = `
        #p-mini-player {
            position: fixed; bottom: 20px; right: 20px;
            background: #000; border: 2px solid #00FF00;
            padding: 10px 15px; border-radius: 8px;
            color: #00FF00; font-family: 'Courier New', monospace;
            font-size: 12px; font-weight: bold;
            z-index: 2147483647; cursor: pointer;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
            display: none; /* Começa escondido */
            text-transform: uppercase;
        }
        #p-mini-player:hover { background: #002200; }
        .p-hidden { display: none !important; }
    `;
    document.head.appendChild(style);
}

// --- FUNÇÃO: CONTROLADOR DO PROGRESSO E UI ---
function iniciarMonitoramento(menu, btnBaixar) {
    // Cria o Mini-Player se não existir
    let miniPlayer = document.getElementById('p-mini-player');
    if (!miniPlayer) {
        miniPlayer = document.createElement('div');
        miniPlayer.id = 'p-mini-player';
        miniPlayer.innerText = 'PREPARANDO... 0%';
        // Ao clicar no mini-player, restaura o menu grande
        miniPlayer.onclick = () => {
            const overlay = document.getElementById('paulinho-overlay');
            if (overlay) overlay.classList.remove('p-hidden');
            miniPlayer.style.display = 'none';
        };
        document.body.appendChild(miniPlayer);
    }

    // Cria a barra dentro do menu grande se não existir
    let barraContainer = document.getElementById('p-barra-container');
    if (!barraContainer) {
        barraContainer = document.createElement('div');
        barraContainer.id = 'p-barra-container';
        // Estilos da barra
        Object.assign(barraContainer.style, {
            width: '100%', height: '12px', background: '#001100',
            border: '1px solid #00FF00', marginTop: '15px',
            borderRadius: '4px', overflow: 'hidden', display: 'none'
        });

        const barraFill = document.createElement('div');
        barraFill.id = 'p-barra-fill';
        Object.assign(barraFill.style, {
            width: '0%', height: '100%', background: '#00FF00',
            transition: 'width 0.2s linear' // Animação mais fluida para o progresso falso
        });

        barraContainer.appendChild(barraFill);
        // Insere antes dos botões
        const grupoBotoes = menu.querySelector('.paulinho-btn-group');
        menu.insertBefore(barraContainer, grupoBotoes);
    }

    // Variável para controlar o "Loading Falso" (Delay do YouTube)
    let progressoSimulado = 0;

    // --- LOOP DE VERIFICAÇÃO (Mais rápido: 200ms) ---
    const intervalo = setInterval(async () => {
        try {
            const response = await fetch('http://localhost:5000/status');
            const dados = await response.json();
            
            // Elementos UI
            const overlay = document.getElementById('paulinho-overlay');
            const barraContainer = document.getElementById('p-barra-container');
            const barraFill = document.getElementById('p-barra-fill');
            const miniDisplay = document.getElementById('p-mini-player');

            // Estados ativos de download
            if (['iniciando', 'baixando', 'convertendo'].includes(dados.status)) {
                
                let porcentagemExibida = dados.porcentagem;
                let mensagemExibida = dados.mensagem;

                // LÓGICA DO DELAY: Se o Python ainda diz 0% ou "iniciando", simulamos atividade
                if (dados.porcentagem === 0 || dados.status === 'iniciando') {
                    if (progressoSimulado < 98) {
                        progressoSimulado += 2.8; // Sobe suavemente até 45% enquanto espera
                    }
                    porcentagemExibida = progressoSimulado;
                    mensagemExibida = `PREPARANDO... ${Math.floor(progressoSimulado)}%`;
                } else {
                    // Quando o download real começa, usamos o valor real
                    // (Mas garantimos que a barra não "pule" para trás se o real for menor que o simulado)
                    if (dados.porcentagem > progressoSimulado) {
                         porcentagemExibida = dados.porcentagem;
                    } else {
                         // Se o download real começou baixo (ex: 10%) mas a simulação já tava em 20%, mantém visualmente em 20%
                         // até o real ultrapassar, para ficar bonito.
                         porcentagemExibida = Math.max(dados.porcentagem, progressoSimulado);
                    }
                    
                    if (dados.status === 'convertendo') {
                        porcentagemExibida = 100; // Trava no finalzinho durante conversão
                        mensagemExibida = "FINALIZANDO...";
                    }
                }

                // Atualiza Mini Player
                if (miniDisplay) miniDisplay.innerText = `⬇ ${Math.floor(porcentagemExibida)}%`;
                
                // Se o menu grande estiver visível
                if (overlay && !overlay.classList.contains('p-hidden')) {
                    if (barraContainer) barraContainer.style.display = 'block';
                    if (barraFill) barraFill.style.width = porcentagemExibida + '%';
                    
                    if (btnBaixar) {
                        btnBaixar.innerText = mensagemExibida || "AGUARDE...";
                        btnBaixar.disabled = true;
                        btnBaixar.style.background = '#222';
                        btnBaixar.style.cursor = 'wait';
                    }
                }
            } 
            else if (dados.status === 'concluido') {
                clearInterval(intervalo);
                if (barraFill) barraFill.style.width = '100%';
                if (btnBaixar) btnBaixar.innerText = "CONCLUÍDO!";
                if (miniDisplay) miniDisplay.style.display = 'none'; // Esconde mini player
                
                // Se o menu estiver minimizado, mostra alerta direto
                // Se estiver aberto, mostra no botão e fecha
                setTimeout(() => {
                    alert("✅ DOWNLOAD CONCLUÍDO!\nArquivo salvo na pasta Downloads.");
                    if (overlay) overlay.remove();
                    if (miniDisplay) miniDisplay.remove();
                }, 500);
            }
        } catch (e) {
            console.error("Erro status:", e);
        }
    }, 200); // Intervalo de 200ms para animação suave
}

// --- FUNÇÃO MENU PRINCIPAL ---
function abrirMenuPaulinho(btnOriginal) {
    injetarEstilosExtras(); // Garante CSS do mini player
    
    // Limpa menus antigos
    const menuAntigo = document.getElementById('paulinho-overlay');
    if (menuAntigo) menuAntigo.remove();

    // Cria Overlay
    const overlay = document.createElement('div');
    overlay.id = 'paulinho-overlay';
    
    const menu = document.createElement('div');
    menu.id = 'paulinho-menu';
    
    menu.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #00FF00; margin-bottom:15px; padding-bottom:5px;">
            <h2 style="margin:0; border:none; font-size:16px;">⬇ BAIXAR VÍDEO</h2>
            <button id="p-btn-minimizar" style="background:none; border:1px solid #00FF00; color:#00FF00; cursor:pointer; font-weight:bold; font-family:monospace;">_</button>
        </div>
        
        <label>TIPO DE ARQUIVO:</label>
        <select id="p-tipo">
            <option value="video">VÍDEO (MP4)</option>
            <option value="audio">ÁUDIO (MP3)</option>
        </select>

        <div id="p-box-qualidade">
            <label>QUALIDADE:</label>
            <select id="p-qualidade">
                <option value="best">Melhor (Auto)</option>
                <option value="1080p">Full HD (1080p)</option>
                <option value="720p">HD (720p)</option>
            </select>
        </div>

        <div class="paulinho-btn-group">
            <button class="paulinho-confirm" id="p-btn-baixar">INICIAR</button>
            <button class="paulinho-cancel" id="p-btn-cancelar">CANCELAR</button>
        </div>
    `;

    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    // Referências
    const selectTipo = document.getElementById('p-tipo');
    const boxQualidade = document.getElementById('p-box-qualidade');
    const btnBaixar = document.getElementById('p-btn-baixar');
    const btnCancelar = document.getElementById('p-btn-cancelar');
    const btnMinimizar = document.getElementById('p-btn-minimizar');

    // Lógica UI
    selectTipo.onchange = () => {
        boxQualidade.style.display = (selectTipo.value === 'audio') ? 'none' : 'block';
    };

    // Botão Cancelar (Fecha tudo)
    btnCancelar.onclick = () => overlay.remove();

    // BOTÃO MINIMIZAR (Novo!)
    btnMinimizar.onclick = () => {
        overlay.classList.add('p-hidden'); // Esconde menu
        const mini = document.getElementById('p-mini-player');
        if (mini) {
            mini.style.display = 'block'; // Mostra mini player
            mini.innerText = "MINIMIZADO (AGUARDANDO...)";
        }
    };

    // Botão Baixar
    btnBaixar.onclick = async () => {
        const tipo = selectTipo.value;
        const qualidade = document.getElementById('p-qualidade').value;
        
        try {
            const resp = await fetch('http://localhost:5000/baixar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ url: window.location.href, tipo, qualidade })
            });
            const json = await resp.json();

            if (json.status === 'ocupado') {
                alert("Já existe um download em andamento!");
                return;
            }

            if (resp.ok) {
                // Inicia o monitoramento e barra
                iniciarMonitoramento(menu, btnBaixar);
            } else {
                alert("Erro ao iniciar download.");
            }
        } catch (erro) {
            alert("ERRO: O servidor Python não está rodando!");
        }
    };
}

// --- CRIAÇÃO DO BOTÃO NA PÁGINA ---
function criarBotao() {
    if (!isVideoPage()) return;
    let target = null;
    let isShorts = window.location.href.includes("shorts");

    if (isShorts) {
        const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
        if (activeShort) {
            target = activeShort.querySelector('#actions') || activeShort.querySelector('ytd-video-owner-renderer');
            if (target && target.querySelector('#btn-paulinho')) return;
        }
    } else {
        if (document.getElementById('btn-paulinho')) return;
        target = document.querySelector('#owner') || document.querySelector('#above-the-fold') || document.querySelector('#top-row');
    }

    if (target) {
        const btn = document.createElement('button');
        btn.id = 'btn-paulinho';
        btn.innerText = isShorts ? 'BAIXAR' : 'BAIXAR (PAULINHO)';
        
        // Estilos
        Object.assign(btn.style, {
            cursor: 'pointer', zIndex: '9990', fontWeight: 'bold'
        });

        if (isShorts) {
            Object.assign(btn.style, {
                marginTop: "15px", width: "48px", height: "48px",
                borderRadius: "50%", fontSize: "9px", display: "flex",
                alignItems: "center", justifyContent: "center", padding: "0"
            });
        } else {
            Object.assign(btn.style, {
                marginLeft: "15px", fontSize: "14px", padding: "10px 20px", borderRadius: "20px"
            });
        }

        btn.onclick = (e) => { e.stopPropagation(); abrirMenuPaulinho(btn); };
        if (isShorts) target.prepend(btn); else target.appendChild(btn);
    }
}
setInterval(criarBotao, 1000);