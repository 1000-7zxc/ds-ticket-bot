# Deadmine Bot

Discord бот для логирования событий на сервере.

## Функции

1. **Лог войса** - отслеживание подключений/отключений от голосовых каналов
2. **Лог чата** - логирование изменений и удалений сообщений
3. **Лог модерации** - баны, кики, тайм-ауты
4. **Лог ролей** - выдача и снятие ролей
5. **Авто-роль** - автоматическая выдача роли новым участникам

## Команды

- `/autorole` - Выдать роль всем участникам сервера (только для администраторов)

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Заполните `.env` своими данными:
- `DISCORD_TOKEN` - токен бота
- `GUILD_ID` - ID сервера
- ID каналов для логов

4. Запустите бота:
```bash
npm start
```

5. Зарегистрируйте команды:
```bash
node deploy-commands.js
```

## Деплой на Railway

1. Подключите GitHub репозиторий к Railway
2. Добавьте переменные окружения в Railway:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `AUTO_ROLE_ID`
   - `VOICE_LOG_CHANNEL`
   - `CHAT_LOG_CHANNEL`
   - `MODERATION_LOG_CHANNEL`
   - `ROLE_LOG_CHANNEL`
3. Railway автоматически задеплоит бота
4. Зарегистрируйте команды локально: `node deploy-commands.js`

## Требования

- Node.js 16.9.0 или выше
- Discord.js v14

## Необходимые интенты

В Discord Developer Portal включите:
- Server Members Intent
- Message Content Intent
- Presence Intent (опционально)
