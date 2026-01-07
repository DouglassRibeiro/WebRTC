from django.contrib import admin
from django.urls import path, include # Importe o 'include'

urlpatterns = [
    path('admin/', admin.site.urls),
    # Inclui todas as rotas do app core
    path('', include('core.urls')), 
]