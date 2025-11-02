# Гайд тестировщика

## Роль и ответственность

Тестировщик отвечает за:
- Написание тестов для нового кода
- Валидацию выполнения контрактов
- Проверку граничных случаев
- Проверку обработки ошибок

## Workflow тестировщика

### 1. Изучение контрактов

**Начинай с анализа SAL-аннотаций:**
```javascript
// Для каждого метода проверяй:
- @requires - что нужно проверить на входе
- @ensures - что должно быть после выполнения
- @invariant - что должно оставаться неизменным
- @throws - какие ошибки могут возникнуть
```

### 2. Покрытие тестами

**Приоритеты:**
1. ✅ Все @requires проверки
2. ✅ Все @ensures гарантии
3. ✅ Все @throws исключения
4. ✅ Граничные случаи
5. ✅ Интеграционные тесты

### 3. Валидация контрактов

**Проверяй:**
- Выполняются ли предусловия (@requires)?
- Выполняются ли постусловия (@ensures)?
- Сохраняются ли инварианты (@invariant)?
- Корректно ли обрабатываются ошибки?

### 4. Отчет о тестировании

Создавай отчет с:
- Покрытием тестами
- Найденными проблемами
- Рекомендациями по улучшению

## Примеры тестов

### Тест предусловий (@requires)

```javascript
describe('StorageManager.save()', () => {
  it('should fail if data is not serializable', () => {
    const manager = new StorageManager();
    const circular = { a: {} };
    circular.a.b = circular; // Circular reference
    
    expect(() => manager.save(circular)).toThrow();
  });
});
```

### Тест постусловий (@ensures)

```javascript
describe('StorageManager.save()', () => {
  it('should add lastModified timestamp', () => {
    const manager = new StorageManager();
    const data = { test: 'value' };
    
    manager.save(data);
    const saved = manager.load();
    
    expect(saved.lastModified).toBeDefined();
    expect(typeof saved.lastModified).toBe('number');
  });
});
```

### Тест инвариантов (@invariant)

```javascript
describe('FileSystem', () => {
  it('should maintain valid structure after operations', () => {
    const fs = new FileSystem(storage, eventBus);
    
    fs.createFile('Desktop', 'test.txt', 'content');
    const item = fs.getItemInfo('Desktop', 'test.txt');
    
    // Инвариант: структура всегда валидна
    expect(item.type).toBe('file');
    expect(item.name).toBe('test.txt');
    expect(item.content).toBe('content');
  });
});
```

## Валидация бизнес-контрактов

Проверяй не только формальные, но и бизнес-контракты:

```javascript
// @why_ensures: lastModified критичен для отслеживания актуальности данных
it('should track data freshness via lastModified', () => {
  const manager = new StorageManager();
  const data1 = { value: 1 };
  const data2 = { value: 2 };
  
  manager.save(data1);
  const time1 = manager.load().lastModified;
  
  setTimeout(() => {
    manager.save(data2);
    const time2 = manager.load().lastModified;
    
    expect(time2).toBeGreaterThan(time1); // Данные обновлены
  }, 10);
});
```

## Важные принципы

1. **Контракты = тесты** - каждый контракт должен быть протестирован
2. **Граничные случаи** - тестируй края допустимых значений
3. **Обработка ошибок** - все @throws должны быть покрыты
4. **Интеграция** - тестируй взаимодействие компонентов
5. **Производительность** - проверяй @performance_contract если указан

## Отчетность

После тестирования создавай отчет:

```markdown
## Результаты тестирования

### Покрытие
- Unit тесты: 95%
- Интеграционные тесты: 80%
- Контракты: 100%

### Найденные проблемы
1. @requires проверка неполная в методе X
2. @ensures не выполняется в случае Y

### Рекомендации
1. Добавить проверку валидности в метод X
2. Обработать случай Y в методе Z
```
