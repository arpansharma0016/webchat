from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.models import User, auth
from django.contrib import messages
from .models import Vc
from django.views.decorators.csrf import csrf_exempt
import os
import json
import random
import time
import threading



def index(request):
    return render(request, "index.html")


@csrf_exempt
def create(request):
    if request.method == "POST":
        updatedData = json.loads(request.body.decode('UTF-8'))
        offer = updatedData['offer']
        id = int(updatedData['id'])
        try:
            vc = Vc.objects.get(id=id)
        except:
            vc = None
        if vc:
            vc.offer = offer
            vc.save()
            return JsonResponse({'status':'success', 'id':vc.id})
        else:
            return JsonResponse({'status':'fail', 'message':'Bad request'})

    else:
        return JsonResponse({'status':'fail', 'message':'Bad request'})

def delit(id):
    try:
        vc = Vc.objects.get(id=id)
    except:
        vc = None
    if vc:
        threading.Timer(6.0, dell, [id]).start()
        return

    else:
        return

def dell(arg):
    try:
        vc = Vc.objects.get(id=arg)
    except:
        vc = None
    if vc:
        vc.delete()
        return
    else:
        return


def check(request):
    vc = Vc.objects.all()
    if vc.exists():
        vc = vc.first()
        if vc.offer:
            return JsonResponse({'status':'success', 'found':'yes', 'id':vc.id, 'offer':vc.offer})
        else:
            vc.delete()
            return JsonResponse({'status':'fail'})

    else:
        vc = Vc.objects.create(created=True)
        vc.save()
        delit(vc.id)
        return JsonResponse({'status':'success', 'found':'no', 'id':vc.id})



def check_answer(request, id):
    try:
        vc = Vc.objects.get(id=id)
    except:
        vc = None

    if vc:
        if vc.offer:
            if vc.answer:
                answer = vc.answer
                vc.delete()
                return JsonResponse({'status':'success', 'found':'yes', 'answer':answer})
            
            else:
                return JsonResponse({'status':'success', 'found':'no'})

        else:
            return JsonResponse({'status':'fail', 'message':'Invalid request'})
        
    else:
        return JsonResponse({'status':'fail', 'message':'Invalid request'})



@csrf_exempt
def answer(request):
    if request.method == "POST":
        updatedData = json.loads(request.body.decode('UTF-8'))
        id = updatedData['id']
        answer = updatedData['answer']

        try:
            vc = Vc.objects.get(id=id)
        except:
            vc = None
        
        if vc:
            if vc.answer:
                return JsonResponse({'status':'fail', 'message':'This user is already occupied'})
            else:
                vc.answer = answer
                vc.save()
                return JsonResponse({'status':'success', 'id':vc.id})
        
        else:
            return JsonResponse({'status':'fail', 'message':'No user'})


    else:
        return JsonResponse({'status':'fail', 'message':'Invalid request'})
