# Generated by Django 2.2.11 on 2022-02-02 02:37

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Vc',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('offer', models.TextField(blank=True)),
                ('answer', models.TextField(blank=True)),
            ],
        ),
    ]