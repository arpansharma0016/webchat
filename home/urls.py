from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('create', views.create, name="create"),
    path('check', views.check, name="check"),
    path('check_answer-<int:id>', views.check_answer, name="check_answer"),
    path('answer', views.answer, name="answer"),
]