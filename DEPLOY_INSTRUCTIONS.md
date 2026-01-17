# Инструкция по деплою на сервер

## Шаг 1: Подключение к серверу

```bash
ssh root@твой_сервер_ip
# или
ssh пользователь@твой_сервер_ip
```

## Шаг 2: Проверка текущего состояния

```bash
# Проверить свободную память
free -h

# Проверить есть ли уже swap
swapon --show

# Перейти в папку проекта (замени на свой путь)
cd ~/new_project_finance
# или
cd /path/to/your/project
```

## Шаг 3: Создание swap файла (если его нет)

```bash
# Проверить, есть ли свободное место на диске (нужно минимум 2GB)
df -h

# Создать swap файл размером 2GB
sudo fallocate -l 2G /swapfile

# Установить правильные права доступа
sudo chmod 600 /swapfile

# Настроить swap
sudo mkswap /swapfile

# Включить swap
sudo swapon /swapfile

# Проверить что swap работает
free -h
# Должно показать увеличенную память

# (Опционально) Сделать swap постоянным после перезагрузки
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Шаг 4: Подтянуть изменения из git

```bash
# Если используешь git
git pull

# Или если нужно клонировать заново
# git clone твой_репозиторий
```

## Шаг 5: Собрать Docker образ

```bash
# Перейти в папку проекта
cd ~/new_project_finance

# Собрать backend образ (это займет время, особенно первый раз)
docker-compose -f docker-compose.prod.yml build backend

# Если сборка успешна, можно собрать все сразу
docker-compose -f docker-compose.prod.yml build
```

## Шаг 6: Запустить приложение

```bash
# Запустить все сервисы
docker-compose -f docker-compose.prod.yml up -d

# Проверить что все контейнеры запущены
docker-compose -f docker-compose.prod.yml ps

# Посмотреть логи если нужно
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Шаг 7: (Опционально) Отключить swap после сборки

Если хочешь освободить место на диске (swap можно оставить для работы):

```bash
# Отключить swap (но это не обязательно, можно оставить)
sudo swapoff /swapfile

# Удалить swap файл (если отключил)
sudo rm /swapfile

# Удалить запись из /etc/fstab если добавил
sudo nano /etc/fstab  # удалить строку с /swapfile
```

## Полезные команды для проверки

```bash
# Проверить использование памяти
free -h

# Проверить использование диска
df -h

# Посмотреть запущенные контейнеры
docker ps

# Посмотреть логи backend
docker logs project_finance_backend -f

# Остановить все сервисы
docker-compose -f docker-compose.prod.yml down

# Перезапустить backend
docker-compose -f docker-compose.prod.yml restart backend
```

