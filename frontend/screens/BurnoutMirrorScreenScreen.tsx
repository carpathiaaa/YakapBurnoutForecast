  function buildLastNDates(n: number): { key: string; label: string }[] {
    const out: { key: string; label: string }[] = [];
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      const key = `${y}-${m}-${dd}`;
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const label = names[dayOfWeek];
      
      // Debug logging to verify day mapping
      console.log(`Date: ${key}, Day of week: ${dayOfWeek}, Label: ${label}`);
      
      out.push({ key, label });
    }
    return out;
  }
