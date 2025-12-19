import React, { useState, useEffect } from 'react';

function MonthlyChart({ transactions }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    generateCalendar();
  }, [transactions, selectedMonth, selectedYear]);

  // Helper function to normalize date to YYYY-MM-DD format (LOCAL TIME)
  const normalizeDate = (dateString) => {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Try to parse as Date object
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Get local date components (not UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
    }
    
    return '';
  };

  // Helper function to create date string in YYYY-MM-DD format (LOCAL TIME)
  const createDateString = (year, month, day) => {
    const date = new Date(year, month, day);
    const localYear = date.getFullYear();
    const localMonth = String(date.getMonth() + 1).padStart(2, '0');
    const localDay = String(date.getDate()).padStart(2, '0');
    return `${localYear}-${localMonth}-${localDay}`;
  };

  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendar = [];
    let dayCounter = 1;

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      
      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startingDay) || dayCounter > daysInMonth) {
          weekDays.push({ day: null, income: 0, expense: 0, hasTransactions: false });
        } else {
          // Use local date string, not UTC
          const dateStr = createDateString(selectedYear, selectedMonth, dayCounter);
          
          // Filter transactions for this specific day
          const dayTransactions = transactions.filter(t => {
            const transactionDateStr = normalizeDate(t.date);
            return transactionDateStr === dateStr;
          });

          const dayIncome = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          
          const dayExpense = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

          weekDays.push({
            day: dayCounter,
            date: dateStr,
            income: dayIncome,
            expense: dayExpense,
            total: dayIncome + dayExpense,
            hasTransactions: dayTransactions.length > 0,
            transactionCount: dayTransactions.length
          });
          dayCounter++;
        }
      }
      
      if (weekDays.some(day => day.day !== null)) {
        calendar.push(weekDays);
      }
    }

    setCalendarData(calendar);
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount >= 1000) {
      return `৳${(numAmount / 1000).toFixed(1)}k`;
    }
    return `৳${numAmount.toFixed(0)}`;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from current year - 2 to current year + 2
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const getDayClass = (dayData) => {
    if (!dayData.day) return 'calendar-day empty';
    
    let classes = 'calendar-day';
    if (dayData.hasTransactions) classes += ' has-transactions';
    if (dayData.income > dayData.expense) classes += ' net-income';
    if (dayData.expense > dayData.income) classes += ' net-expense';
    
    // Check if this is today (using local time)
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    if (dayData.day === todayDate && 
        selectedMonth === todayMonth && 
        selectedYear === todayYear) {
      classes += ' today';
    }
    return classes;
  };

  const getDayTooltip = (dayData) => {
    if (!dayData.day) return '';
    const transactions = dayData.hasTransactions ? 
      `${dayData.transactionCount} transaction${dayData.transactionCount > 1 ? 's' : ''}` : 
      'No transactions';
    
    return `Day ${dayData.day} (${transactions})
Income: ${formatAmount(dayData.income)}
Expense: ${formatAmount(dayData.expense)}
Net: ${formatAmount(dayData.income - dayData.expense)}`;
  };

  const getMonthStats = () => {
    const allDays = calendarData.flat().filter(day => day.day);
    const totalIncome = allDays.reduce((sum, day) => sum + day.income, 0);
    const totalExpense = allDays.reduce((sum, day) => sum + day.expense, 0);
    const netBalance = totalIncome - totalExpense;
    const daysWithTransactions = allDays.filter(day => day.hasTransactions).length;
    
    return { totalIncome, totalExpense, netBalance, daysWithTransactions };
  };

  const monthStats = getMonthStats();

  // Debug function to log transaction dates
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('📅 MonthlyChart Debug - Transaction Dates:');
      transactions.forEach((t, i) => {
        console.log(`Transaction ${i}:`, {
          original: t.date,
          normalized: normalizeDate(t.date),
          type: t.type,
          amount: t.amount
        });
      });
      
      // Log current month dates
      console.log('📅 Current Month:', months[selectedMonth], selectedYear);
    }
  }, [transactions, selectedMonth, selectedYear]);

  return (
    <div className="card monthly-chart-card">
      <div className="card-header">
        <h3 className="card-title">Monthly Calendar</h3>
        <div className="chart-controls">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="form-control form-control-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="form-control form-control-sm"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-weekdays">
          <div className="weekday">Sun</div>
          <div className="weekday">Mon</div>
          <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday">Sat</div>
        </div>

        <div className="calendar-grid">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((dayData, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className={getDayClass(dayData)}
                  title={getDayTooltip(dayData)}
                >
                  {dayData.day && (
                    <>
                      <div className="day-number">{dayData.day}</div>
                      {dayData.hasTransactions && (
                        <div className="day-transactions">
                          {dayData.income > 0 && (
                            <div className="day-income" title={`Income: ${formatAmount(dayData.income)}`}>
                              +{formatAmount(dayData.income)}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div className="day-expense" title={`Expense: ${formatAmount(dayData.expense)}`}>
                              -{formatAmount(dayData.expense)}
                            </div>
                          )}
                          {dayData.transactionCount > 1 && (
                            <div className="day-count">{dayData.transactionCount}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="calendar-stats">
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-label">Total Income</div>
              <div className="stat-value text-success">
                {formatAmount(monthStats.totalIncome)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Expense</div>
              <div className="stat-value text-danger">
                {formatAmount(monthStats.totalExpense)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Net Balance</div>
              <div className={`stat-value ${monthStats.netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatAmount(monthStats.netBalance)}
              </div>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-label">Days with Transactions</div>
              <div className="stat-value">
                {monthStats.daysWithTransactions} days
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Average Daily</div>
              <div className="stat-value">
                {formatAmount(monthStats.totalExpense / (monthStats.daysWithTransactions || 1))}
              </div>
            </div>
          </div>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color today-color"></div>
            <span>Today</span>
          </div>
          <div className="legend-item">
            <div className="legend-color net-income-color"></div>
            <span>Net Income Day</span>
          </div>
          <div className="legend-item">
            <div className="legend-color net-expense-color"></div>
            <span>Net Expense Day</span>
          </div>
          <div className="legend-item">
            <div className="legend-color has-transactions-color"></div>
            <span>Has Transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyChart;