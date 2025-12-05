import os
import sys
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

# --- VARIÁVEIS GLOBAIS DE ESTADO ---
ESTADO_ATUAL = {
    "status": "parado",
    "porcentagem": 0,
    "mensagem": "Aguardando..."
}

# --- FORÇA DOWNLOAD NO DISCO C ---
PASTA_DOWNLOAD = r"C:\YTDownloads"

# Cria a pasta caso não exista
if not os.path.exists(PASTA_DOWNLOAD):
    os.makedirs(PASTA_DOWNLOAD)

print("[DEBUG] Salvando os arquivos em:", PASTA_DOWNLOAD)

# --- BLINDAGEM DE CAMINHO ---
PASTA_SCRIPT = os.path.dirname(os.path.abspath(__file__))
CAMINHO_COOKIES = os.path.join(PASTA_SCRIPT, 'cookies.txt')


def hook_progresso(d):
    """Atualiza a variável global com a porcentagem do download"""
    if d['status'] == 'downloading':
        try:
            p_str = d.get('_percent_str', '0%').replace('%', '')
            ESTADO_ATUAL['status'] = 'baixando'
            ESTADO_ATUAL['porcentagem'] = float(p_str)
            ESTADO_ATUAL['mensagem'] = f"Baixando: {p_str}%"
        except:
            pass

    elif d['status'] == 'finished':
        ESTADO_ATUAL['status'] = 'convertendo'
        ESTADO_ATUAL['porcentagem'] = 99
        ESTADO_ATUAL['mensagem'] = "Convertendo arquivo..."


def baixar_video_tarefa(url, tipo, qualidade):
    ESTADO_ATUAL['status'] = 'iniciando'
    ESTADO_ATUAL['porcentagem'] = 0
    ESTADO_ATUAL['mensagem'] = "Iniciando..."

    print("--------------------------------------------------")
    print(f"[NOVA TAREFA] URL: {url}")
    print(f"              TIPO: {tipo.upper()} | QUALIDADE: {qualidade}")
    print("--------------------------------------------------")

    # Verificação de cookies
    if os.path.exists(CAMINHO_COOKIES):
        print(f"✅ COOKIES ENCONTRADOS EM: {CAMINHO_COOKIES}")
    else:
        print(f"❌ COOKIES NÃO ENCONTRADOS!")
        print(f"   O Python procurou aqui: {CAMINHO_COOKIES}")
        print(f"   Certifique-se que o arquivo está correto!")

    opcoes = {
        'outtmpl': os.path.join(PASTA_DOWNLOAD, '%(title)s.%(ext)s'),
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': [hook_progresso],
        'cookiefile': CAMINHO_COOKIES,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    if tipo == 'audio':
        print("--> Modo AUDIO ativado.")
        opcoes.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })

    else:
        print(f"--> Modo VIDEO ativado ({qualidade}).")
        opcoes.update({'merge_output_format': 'mp4'})

        if qualidade == '1080p':
            format_str = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]'
        elif qualidade == '720p':
            format_str = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]'
        else:
            format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'

        opcoes.update({'format': format_str})

    try:
        with yt_dlp.YoutubeDL(opcoes) as ydl:
            ydl.download([url])

        print("[SUCESSO] Download Concluído!")
        ESTADO_ATUAL['status'] = 'concluido'
        ESTADO_ATUAL['porcentagem'] = 100
        ESTADO_ATUAL['mensagem'] = "Download Finalizado!"

        if os.name == 'nt':
            import winsound
            try:
                winsound.Beep(1000, 200)
            except:
                pass

    except Exception as e:
        print(f"[ERRO CRÍTICO] {e}")
        ESTADO_ATUAL['status'] = 'erro'
        ESTADO_ATUAL['mensagem'] = "Erro no Download"

        if tipo == 'audio' and "FFmpeg" in str(e):
            print("[AVISO] Tentando baixar sem conversão (m4a)...")
            if 'postprocessors' in opcoes:
                del opcoes['postprocessors']
            try:
                with yt_dlp.YoutubeDL(opcoes) as ydl:
                    ydl.download([url])
                ESTADO_ATUAL['status'] = 'concluido'
                ESTADO_ATUAL['porcentagem'] = 100
                ESTADO_ATUAL['mensagem'] = "Concluído (M4A)"
            except:
                pass


@app.route('/baixar', methods=['POST'])
def receber_pedido():
    if ESTADO_ATUAL['status'] in ['baixando', 'convertendo', 'iniciando']:
        return jsonify({"status": "ocupado", "msg": "Já existe um download em andamento!"}), 409

    dados = request.json
    url = dados.get('url')
    tipo = dados.get('tipo', 'video')
    qualidade = dados.get('qualidade', 'best')

    if not url:
        return jsonify({"status": "erro"}), 400

    thread = threading.Thread(target=baixar_video_tarefa, args=(url, tipo, qualidade))
    thread.start()

    return jsonify({"status": "ok", "msg": "Iniciando..."})


@app.route('/status', methods=['GET'])
def verificar_status():
    return jsonify(ESTADO_ATUAL)


if __name__ == '__main__':
    os.system('cls' if os.name == 'nt' else 'clear')
    if os.name == 'nt':
        os.system('color 0A')

    print("==============================================")
    print("     SERVIDOR DO PAULINHO - V4.1 (C:\\)       ")
    print("==============================================")
    print(f" PASTA DO SCRIPT: {PASTA_SCRIPT}")
    print(f" SALVANDO EM: {PASTA_DOWNLOAD}")
    if os.path.exists(CAMINHO_COOKIES):
        print(" COOKIES: [OK] ENCONTRADO!")
    else:
        print(" COOKIES: [X] NÃO ENCONTRADO!")
    print("==============================================")

    app.run(port=5001)
