from django.shortcuts import render

def video_chamada(request):
    # O Django procura automaticamente dentro da pasta 'templates' de cada app
    return render(request, 'core/video_call.html')