
import { format, endOfDay } from 'date-fns';
import { toast } from "sonner";
import { CalendarEvent, EventFormData } from '@/types/calendar';

// API base URL
const API_BASE_URL = 'https://webhook.serverwegrowup.com.br/webhook/agenda';

// Fetch events with GET method
export async function fetchCalendarEvents(selectedDate?: Date | null) {
  try {
    // Format date parameters for the API
    let url = API_BASE_URL;
    
    // If a date is selected, add query parameters for start and end dates
    if (selectedDate) {
      const startDateTime = format(selectedDate, "yyyy-MM-dd'T'00:00:00.000xxx");
      const endDateTime = format(endOfDay(selectedDate), "yyyy-MM-dd'T'23:59:59.999xxx");
      
      url += `?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`;
      console.log('Fetching events with date range:', { startDateTime, endDateTime });
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    throw err;
  }
}

// Refresh events with POST method
export async function refreshCalendarEventsPost(selectedDate?: Date | null) {
  try {
    // Create payload with selected date if available
    const payload: any = {};
    
    if (selectedDate) {
      const startDateTime = format(selectedDate, "yyyy-MM-dd'T'00:00:00.000xxx");
      const endDateTime = format(endOfDay(selectedDate), "yyyy-MM-dd'T'23:59:59.999xxx");
      
      payload.start = startDateTime;
      payload.end = endDateTime;
      console.log('Refreshing events with payload:', payload);
    }
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    toast.success("Eventos atualizados com sucesso!");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error refreshing calendar events:', err);
    toast.error("Não conseguimos atualizar os eventos, tente novamente.");
    throw err;
  }
}

// Add a new event
export async function addCalendarEvent(formData: EventFormData) {
  try {
    // Format the date and times for the API
    const { date, startTime, endTime, summary, description, email } = formData;
    const dateStr = format(date, "yyyy-MM-dd");
    
    const startDateTime = `${dateStr}T${startTime}:00-03:00`;
    const endDateTime = `${dateStr}T${endTime}:00-03:00`;
    
    const payload = {
      summary,
      description,
      start: startDateTime,
      end: endDateTime,
      email
    };
    
    console.log('Adding event with payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/adicionar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    toast.success("Evento adicionado com sucesso!");
    return true;
  } catch (err) {
    console.error('Error adding event:', err);
    toast.error("Erro ao adicionar evento. Tente novamente.");
    return false;
  }
}

// Edit an existing event
export async function editCalendarEvent(eventId: string, formData: EventFormData) {
  try {
    // Format the date and times for the API
    const { date, startTime, endTime, summary, description, email } = formData;
    const dateStr = format(date, "yyyy-MM-dd");
    
    const startDateTime = `${dateStr}T${startTime}:00-03:00`;
    const endDateTime = `${dateStr}T${endTime}:00-03:00`;
    
    const payload = {
      id: eventId,
      summary,
      description,
      start: startDateTime,
      end: endDateTime,
      email
    };
    
    console.log('Updating event with payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/alterar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    toast.success("Evento atualizado com sucesso!");
    return true;
  } catch (err) {
    console.error('Error updating event:', err);
    toast.error("Erro ao atualizar evento. Tente novamente.");
    return false;
  }
}

// Delete an event
export async function deleteCalendarEvent(eventId: string) {
  try {
    const payload = {
      id: eventId
    };
    
    console.log('Deleting event with payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/excluir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    toast.success("Evento excluído com sucesso!");
    return true;
  } catch (err) {
    console.error('Error deleting event:', err);
    toast.error("Erro ao excluir evento. Tente novamente.");
    return false;
  }
}
