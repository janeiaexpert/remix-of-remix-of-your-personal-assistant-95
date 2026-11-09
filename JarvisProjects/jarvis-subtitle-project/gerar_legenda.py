import sys
import os

# Script para sobreposição de legendas usando ffmpeg
# Define a legenda no meio do peito, em duas linhas, centralizada
# Texto: "Olá, você que está aí na telinha do seu celular\nou quem sabe até um tablet, você sabia que pode\nempacotar o seu conhecimento no mundo digital e vender,\njá pensou nisso?"

def criar_legenda():
    input_file = r"C:\Users\Administrador\Downloads\Clone de Jane no Bar"
    output_file = r"C:\Users\Administrador\Downloads\Clone_de_Jane_Legendado.mp4"
    
    # O filtro drawtext desenha o texto centralizado na altura do peito
    # Para vertical (y), aproximadamente 60% da altura do vídeo
    # Box para melhor leitura (opcional, mas recomendado para contraste)
    
    texto = "Olá, você que está aí na telinha do seu celular\nou quem sabe até um tablet, você sabia que pode\nempacotar o seu conhecimento no mundo digital e vender,\njá pensou nisso?"
    
    drawtext_filter = (
        "drawtext=text='{}':fontcolor=white:fontsize=48:font='Arial':"
        "x=(w-text_w)/2:y=h*0.6:shadowcolor=black:shadowx=2:shadowy=2"
    ).format(texto)
    
    cmd = f'ffmpeg -i "{input_file}" -vf "{drawtext_filter}" -c:a copy "{output_file}"'
    
    print(f"Executando: {cmd}")
    os.system(cmd)

if __name__ == "__main__":
    criar_legenda()
