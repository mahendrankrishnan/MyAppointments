import { Injectable } from '@angular/core';

export interface CalendarEventInput {
  title: string;
  description?: string;
  startDate: Date;
  durationMinutes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private readonly baseUrl = 'https://calendar.google.com/calendar/render';
  private readonly defaultDurationMinutes = 60;

  buildAddEventUrl(event: CalendarEventInput): string {
    const durationMinutes = event.durationMinutes ?? this.defaultDurationMinutes;
    const endDate = new Date(event.startDate.getTime() + durationMinutes * 60 * 1000);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatGoogleDate(event.startDate)}/${this.formatGoogleDate(endDate)}`,
    });

    if (event.description) {
      params.set('details', event.description);
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  openAddEventUrl(event: CalendarEventInput): void {
    window.open(this.buildAddEventUrl(event), '_blank', 'noopener,noreferrer');
  }

  private formatGoogleDate(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');

    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  }
}
