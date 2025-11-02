# Гайд по работе с semantic indices

## Что такое semantic indices?

Semantic indices - это структурированная документация проекта в формате JSON, которая помогает ИИ агентам быстро понимать архитектуру и структуру кода.

## Структура semantic_indices

```
semantic_indices/
├── directory_index_services.json    # Индекс всех модулей
├── knowledge_graph/                 # Детальные графы знаний
│   ├── core_module.json
│   ├── apps_module.json
│   ├── components_module.json
│   └── main_module.json
├── README.md                        # Документация
├── STATUS.md                        # Статус обработки
└── PENDING.md                       # Список задач
```

## Использование semantic indices

### 1. Начало работы с модулем

**Всегда начинай с directory_index_services.json:**
```javascript
// Найди модуль в directory_index_services.json
// Прочитай описание и список компонентов
// Пойми структуру зависимостей
```

### 2. Глубокое изучение компонента

**Читай knowledge_graph/{module}.json:**
```javascript
// Найди компонент в knowledge_graph
// Изучи key_contracts - контракты компонента
// Пойми integration_points - точки интеграции
// Проверь dependencies и relationships
```

### 3. Использование SAL-аннотаций

**Читай код с SAL-аннотациями:**
```javascript
// SAL-аннотации в коде формализуют контракты
// Они дополняют knowledge graphs
// Используй их для понимания деталей реализации
```

## Обновление semantic indices

### Когда обновлять directory_index_services.json

✅ **Обязательно обновлять при:**
- Добавлении нового модуля
- Добавлении нового компонента
- Изменении структуры модулей

### Когда обновлять knowledge_graph

✅ **Обязательно обновлять при:**
- Изменении контрактов компонента
- Изменении точек интеграции
- Изменении зависимостей
- Архитектурных изменениях

### Когда обновлять не нужно

❌ **Не нужно обновлять при:**
- Рефакторинге без изменения API
- Исправлении багов
- Мелких изменениях кода
- Изменении реализации без изменения контрактов

## Примеры использования

### Поиск компонента

```javascript
// Задача: Найти компонент для работы с файлами
// 1. Открываю directory_index_services.json
// 2. Ищу "FileSystem" в core_module
// 3. Вижу что это в src/core/FileSystem.js
// 4. Читаю knowledge_graph/core_module.json для деталей
```

### Понимание интеграции

```javascript
// Задача: Понять как FileSystem интегрируется с другими компонентами
// 1. Читаю knowledge_graph/core_module.json
// 2. Нахожу FileSystem.integration_points
// 3. Вижу что Desktop, FileExplorer, Terminal используют FileSystem
// 4. Изучаю как они взаимодействуют через SAL-аннотации
```

### Добавление нового компонента

```javascript
// Задача: Добавить новый сервис NotificationService
// 1. Добавляю в directory_index_services.json (core_module.components)
// 2. Создаю/обновляю knowledge_graph/core_module.json
// 3. Добавляю SAL-аннотации в код
// 4. Обновляю relationships и integration_points
```

## Важные принципы

1. **Всегда начинай с semantic indices** - не изучай код вслепую
2. **Используй для планирования** - понимай зависимости перед изменением
3. **Обновляй при изменениях** - поддерживай актуальность
4. **Используй вместе с SAL** - knowledge graphs + SAL-аннотации дают полную картину
5. **Проверяй перед мержем** - убедись что semantic indices актуальны

## Автоматизация

В будущем можно создать скрипты для:
- Проверки соответствия кода индексам
- Автоматического обновления при изменениях
- Валидации структуры semantic indices
