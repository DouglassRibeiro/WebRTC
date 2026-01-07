from django.urls import path
from . import views

urlpatterns = [
    # Quando o usuário acessar 'chamada/', ele executa a função video_chamada
    path('chamada/', views.video_chamada, name='video_call'),
]