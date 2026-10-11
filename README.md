# Установка Ollama

## Сайт
https://ollama.com

## Установка

В PowerShell:
```powershell
irm https://ollama.com/install.ps1 | iex
```

## Скачивание модели

```powershell
ollama pull qwen2.5:3b
```

## Проверка

```powershell
ollama list
```

## Запуск и проверка

```powershell
ollama run qwen2.5:3b
```

Напиши «привет». Выйти: `/bye`.

## Проверка сервера

```powershell
curl.exe http://localhost:11434/api/tags
```

Если не отвечает — запусти в отдельном окне:
```powershell
ollama serve
```