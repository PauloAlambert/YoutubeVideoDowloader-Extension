import os
import zipfile
import urllib.request
import shutil
import sys

URL_FFMPEG = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
ARQUIVO_ZIP = "ffmpeg.zip"
PASTA_EXTRAIDA = "ffmpeg_temp"

def barra_progresso(bloco_num, tamanho_bloco, tamanho_total):
    progresso = bloco_num * tamanho_bloco
    porcentagem = (progresso / tamanho_total) * 100
    sys.stdout.write(f"\rBaixando FFmpeg... {porcentagem:.1f}%")
    sys.stdout.flush()

def instalar():
    # Verifica se já tem o FFmpeg
    if os.path.exists("ffmpeg.exe") and os.path.exists("ffprobe.exe"):
        print("[OK] FFmpeg ja esta instalado.")
        return # Sai do script e deixa o .bat continuar

    print("==========================================")
    print("   BAIXANDO COMPONENTES DE AUDIO/VIDEO    ")
    print("==========================================")

    try:
        print(f"⬇ Iniciando download (pode demorar um pouco)...")
        urllib.request.urlretrieve(URL_FFMPEG, ARQUIVO_ZIP, barra_progresso)
        print("\n✅ Download concluído!")
        
        print("📦 Extraindo arquivos...")
        with zipfile.ZipFile(ARQUIVO_ZIP, 'r') as zip_ref:
            zip_ref.extractall(PASTA_EXTRAIDA)
        
        caminho_bin = None
        for root, dirs, files in os.walk(PASTA_EXTRAIDA):
            if "ffmpeg.exe" in files:
                caminho_bin = root
                break
        
        if caminho_bin:
            shutil.move(os.path.join(caminho_bin, "ffmpeg.exe"), "ffmpeg.exe")
            shutil.move(os.path.join(caminho_bin, "ffprobe.exe"), "ffprobe.exe")
            print("✅ Instalação concluída com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Limpeza
    if os.path.exists(ARQUIVO_ZIP): os.remove(ARQUIVO_ZIP)
    if os.path.exists(PASTA_EXTRAIDA): shutil.rmtree(PASTA_EXTRAIDA)

if __name__ == "__main__":
    instalar()