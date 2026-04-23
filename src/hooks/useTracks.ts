import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Track {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_sequential: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface Module {
  id: string;
  track_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  difficulty: string;
  xp_reward: number;
  extra_material_url: string | null;
  sort_order: number;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface TrackDetail extends Track {
  modules: ModuleWithLessons[];
  totalLessons: number;
}

export interface TrackWithProgress extends Track {
  totalLessons: number;
  completedLessons: number;
}

/** Lista todas as trilhas publicadas com contagem de progresso do usuário. */
export function useTracksList() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<TrackWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: tData } = await supabase
      .from("tracks")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");

    const tracksRows = (tData || []) as any[];
    if (tracksRows.length === 0) {
      setTracks([]);
      setLoading(false);
      return;
    }

    // Carrega lessons (com module->track) para contar total e completos
    const { data: modulesData } = await supabase.from("modules").select("id, track_id");
    const modulesByTrack: Record<string, string[]> = {};
    (modulesData || []).forEach((m: any) => {
      if (!modulesByTrack[m.track_id]) modulesByTrack[m.track_id] = [];
      modulesByTrack[m.track_id].push(m.id);
    });
    const allModuleIds = (modulesData || []).map((m: any) => m.id);
    const moduleToTrack: Record<string, string> = {};
    (modulesData || []).forEach((m: any) => { moduleToTrack[m.id] = m.track_id; });

    let lessonRows: any[] = [];
    if (allModuleIds.length > 0) {
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id, module_id")
        .in("module_id", allModuleIds);
      lessonRows = lessonsData || [];
    }
    const totalByTrack: Record<string, number> = {};
    const lessonToTrack: Record<string, string> = {};
    lessonRows.forEach((l: any) => {
      const t = moduleToTrack[l.module_id];
      if (!t) return;
      lessonToTrack[l.id] = t;
      totalByTrack[t] = (totalByTrack[t] || 0) + 1;
    });

    const completedByTrack: Record<string, number> = {};
    if (user && lessonRows.length > 0) {
      const { data: comp } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonRows.map((l: any) => l.id));
      (comp || []).forEach((c: any) => {
        const t = lessonToTrack[c.lesson_id];
        if (t) completedByTrack[t] = (completedByTrack[t] || 0) + 1;
      });
    }

    setTracks(
      tracksRows.map((t: any) => ({
        ...t,
        totalLessons: totalByTrack[t.id] || 0,
        completedLessons: completedByTrack[t.id] || 0,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { tracks, loading, refetch: fetchAll };
}

/** Carrega uma trilha completa com módulos, aulas e o set de aulas concluídas. */
export function useTrackDetail(trackId: string | undefined) {
  const { user } = useAuth();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!trackId) return;
    setLoading(true);

    const { data: tData } = await supabase.from("tracks").select("*").eq("id", trackId).maybeSingle();
    if (!tData) {
      setTrack(null);
      setLoading(false);
      return;
    }
    const { data: mData } = await supabase
      .from("modules")
      .select("*")
      .eq("track_id", trackId)
      .order("sort_order");
    const moduleIds = (mData || []).map((m: any) => m.id);
    let lessonsData: any[] = [];
    if (moduleIds.length > 0) {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("sort_order");
      lessonsData = data || [];
    }
    const lessonsByModule: Record<string, Lesson[]> = {};
    lessonsData.forEach((l: any) => {
      if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = [];
      lessonsByModule[l.module_id].push(l as Lesson);
    });
    const modules: ModuleWithLessons[] = (mData || []).map((m: any) => ({
      ...m,
      lessons: lessonsByModule[m.id] || [],
    }));
    setTrack({
      ...(tData as any),
      modules,
      totalLessons: lessonsData.length,
    });

    if (user && lessonsData.length > 0) {
      const { data: comp } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonsData.map((l: any) => l.id));
      setCompletedIds(new Set((comp || []).map((c: any) => c.lesson_id)));
    } else {
      setCompletedIds(new Set());
    }
    setLoading(false);
  }, [trackId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { track, completedIds, loading, refetch: fetchAll };
}

/** Achata módulos+aulas em uma sequência ordenada para o caminho visual. */
export function flattenLessons(track: TrackDetail | null): Array<Lesson & { moduleTitle: string; moduleIndex: number; lessonIndex: number }> {
  if (!track) return [];
  const result: Array<Lesson & { moduleTitle: string; moduleIndex: number; lessonIndex: number }> = [];
  track.modules.forEach((m, mi) => {
    m.lessons.forEach((l, li) => {
      result.push({ ...l, moduleTitle: m.title, moduleIndex: mi, lessonIndex: li });
    });
  });
  return result;
}
