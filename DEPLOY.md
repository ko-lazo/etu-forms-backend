# Деплой

Схема: Postgres и Redis - в Docker (`docker-compose.yml`), два Node-процесса
(API и воркер) - под pm2. Сборка происходит в GitLab CI, на сервер приезжает
готовый `dist/`.

```
pm2  etu-forms-backend   dist/main.js    :3000
pm2  etu-forms-worker    dist/worker.js  без порта
```

docker
```
127.0.0.1:5432  postgres
127.0.0.1:6379  redis
```

Порты БД и Redis привязаны к `127.0.0.1` - снаружи они недоступны,
подключаться к ним можно через SSH-туннель.

Дальше по тексту `$APP_DIR` - каталог проекта на сервере (он же переменная в
GitLab CI).

---

## Как работает деплой

Пуш в `master` запускает `.gitlab-ci.yml`:

1. **`build-project`** - `npm ci`, линт, форматирование, `tsc --noEmit`, тесты,
   `npm run build`. Результат пакуется в `build.tar.gz`
   (`dist/`, `db/`, `package.json`, `package-lock.json`) и сохраняется как
   артефакт на сутки.
2. **`deploy-prod`** - `scp` архива в `$APP_DIR`, затем по SSH:
   распаковка, `npm ci --omit=dev`, `npm run db:up`,
   `pm2 restart etu-forms-backend etu-forms-worker`.

Git на сервере в деплое **не участвует**.

Сборка идёт под Node 24, но `npm ci` выполняется на сервере - нативные модули
(`argon2`) собираются под ту версию Node, что стоит там.

## Переменные GitLab CI/CD

Settings → CI/CD → Variables, все **protected**:

| Переменная             | Тип      | Значение                                   |
| ---------------------- | -------- | ------------------------------------------ |
| `PROD_HOST`            | Variable | IP или домен сервера                       |
| `PROD_USER`            | Variable | пользователь для SSH                       |
| `SSH_PORT`             | Variable | порт SSH                                   |
| `APP_DIR`              | Variable | каталог проекта на сервере                 |
| `SSH_PRIVATE_KEY_PROD` | **File** | приватный ключ, с переводом строки в конце |

Тип `File` обязателен: job делает `cp "$SSH_PRIVATE_KEY_PROD" ~/.ssh/id_deploy`
и ждёт путь, а не содержимое.

Публичный ключ должен лежать в `~/.ssh/authorized_keys` пользователя
`$PROD_USER`.

`node`, `npm` и `pm2` должны быть доступны. Проверка ровно тем же способом, каким ходит CI:

```bash
ssh <user>@<host> 'which node npm pm2'
```

## Первичная настройка сервера

Положить `.env` (см. ниже) и `docker-compose.yml`, затем:

```bash
cd $APP_DIR
docker compose up -d --wait
```

Первый деплой из CI разложит `dist/` и накатит миграции. После этого один раз
регистрируем процессы в pm2:

```bash
cd $APP_DIR
pm2 start dist/main.js   --name etu-forms-backend
pm2 start dist/worker.js --name etu-forms-worker
pm2 save
pm2 startup              # выполнить команду, которую он напечатает
```

`pm2 save` и `pm2 startup` - обязательны, иначе процессы не переживут ребут.

**Watch-режим pm2 должен быть выключен.**

Воркер обязателен: экспорт в Excel уходит в очередь BullMQ, и без
`etu-forms-worker` задачи просто копятся в Redis.

## `.env`

Лежит в `$APP_DIR/.env`, `chmod 600`, в git не хранится. За основу - `.env.example`,
не забудьте про:

```dotenv
NODE_ENV=production
CORS_ORIGIN=https://example.com
```

Подводные камни:

- **В пароле не должно быть `$`, `dotenv-expand` интерпретирует $ как начало подстановки.

## Диагностика

```bash
pm2 list
pm2 logs etu-forms-backend --lines 100
pm2 logs etu-forms-worker  --lines 100
docker compose ps
curl -s localhost:3000/health          # {"status":"ok"}
```

Откат: перезапустить в GitLab job `deploy-prod` нужного пайплайна, пока жив его
артефакт (сутки). Миграции автоматически не откатываются - если релиз их
содержал, сначала `npm run db:down`.
