import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
}

export default function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date")
        .limit(6);
      if (data) setEvents(data as CalendarEvent[]);
    };
    fetch();
  }, []);

  if (events.length === 0) return null;

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return {
      day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
      month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
      weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    };
  };

  const formatTime = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":");
    return `${h}:${m}`;
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-5 py-2.5 bg-primary rounded-xl">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
          <h3 className="font-heading font-bold text-2xl text-primary-foreground">Próximos Eventos</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((ev) => {
          const { day, month, weekday } = formatDate(ev.event_date);
          const time = formatTime(ev.event_time);
          return (
            <div
              key={ev.id}
              className="border bg-card rounded-xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-lg font-heading font-bold text-primary leading-none">{day}</span>
                <span className="text-[10px] font-bold text-primary/70 uppercase">{month}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-sm text-foreground line-clamp-2">{ev.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{weekday}</span>
                  {time && (
                    <>
                      <span>·</span>
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      <span>{time}</span>
                    </>
                  )}
                </div>
                {ev.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
