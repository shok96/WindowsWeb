/**
 * Calendar - Календарь
 */

export class Calendar {
  constructor() {
    this.currentDate = new Date();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'calendar-app';
    container.innerHTML = `
      <div class="calendar-header">
        <button class="nav-btn" data-action="prev">←</button>
        <h3 class="current-month"></h3>
        <button class="nav-btn" data-action="next">→</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-header">Пн</div>
        <div class="calendar-day-header">Вт</div>
        <div class="calendar-day-header">Ср</div>
        <div class="calendar-day-header">Чт</div>
        <div class="calendar-day-header">Пт</div>
        <div class="calendar-day-header">Сб</div>
        <div class="calendar-day-header">Вс</div>
      </div>
    `;
    
    const monthEl = container.querySelector('.current-month');
    const grid = container.querySelector('.calendar-grid');
    
    const renderCalendar = () => {
      // Удалить старые дни
      grid.querySelectorAll('.calendar-day').forEach(el => el.remove());
      
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      monthEl.textContent = this.currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Пустые ячейки
      const startDay = firstDay === 0 ? 6 : firstDay - 1;
      for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
      }
      
      // Дни месяца
      const today = new Date();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          dayEl.classList.add('today');
        }
        
        grid.appendChild(dayEl);
      }
    };
    
    renderCalendar();
    
    container.querySelector('[data-action="prev"]').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      renderCalendar();
    });
    
    container.querySelector('[data-action="next"]').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      renderCalendar();
    });
    
    return container;
  }
}





